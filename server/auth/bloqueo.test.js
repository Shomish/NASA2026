/**
 * @fileoverview Pruebas del bloqueo de login persistente y del almacén de rate limit.
 * Verifica que los intentos fallidos y el bloqueo viven en MySQL (usuarios) y que
 * el store de express-rate-limit es persistente (tabla rate_limits).
 * @module server/auth/bloqueo.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { prepararApp, cerrarBase, EMAIL_ADMIN, CONTRASENA_ADMIN } from '../test/preparar.js'
import { modelos } from '../db/modelos.js'
import { AlmacenRateLimitMySQL } from './almacenRateLimit.js'

let app

beforeAll(async () => {
  app = await prepararApp()
})

afterAll(async () => {
  await cerrarBase()
})

describe('bloqueo de login persistente (MySQL)', () => {
  it('bloquea la cuenta tras 5 intentos fallidos y persiste en usuarios', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: 'incorrecta' })
      expect(res.status).toBe(401)
    }

    const usuario = await modelos.Usuario.findOne({ where: { email: EMAIL_ADMIN } })
    expect(usuario.bloqueado_hasta).toBeTruthy()
    expect(new Date(usuario.bloqueado_hasta).getTime()).toBeGreaterThan(Date.now())
    expect(usuario.intentos_fallidos).toBe(0)

    // Aunque la contraseña sea correcta, la cuenta sigue bloqueada.
    const bloqueado = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
    expect(bloqueado.status).toBe(429)
    expect(bloqueado.body.codigo).toBe('BLOQUEO_TEMPORAL')
  })

  it('un login correcto limpia los intentos fallidos y el bloqueo', async () => {
    await request(app).post('/api/v1/auth/register').send({ nombre: 'Prueba Bloqueo', email: 'prueba.bloqueo@ayni.health', contrasena: 'clave1234' })
    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/api/v1/auth/login').send({ email: 'prueba.bloqueo@ayni.health', contrasena: 'incorrecta' })
    }
    let usuario = await modelos.Usuario.findOne({ where: { email: 'prueba.bloqueo@ayni.health' } })
    expect(usuario.intentos_fallidos).toBe(3)

    const login = await request(app).post('/api/v1/auth/login').send({ email: 'prueba.bloqueo@ayni.health', contrasena: 'clave1234' })
    expect(login.status).toBe(200)

    usuario = await modelos.Usuario.findOne({ where: { email: 'prueba.bloqueo@ayni.health' } })
    expect(usuario.intentos_fallidos).toBe(0)
    expect(usuario.bloqueado_hasta).toBeNull()
  })
})

describe('almacén de rate limit persistente', () => {
  it('incrementa y resetea claves en MySQL', async () => {
    const almacen = new AlmacenRateLimitMySQL()
    almacen.init({ windowMs: 60_000 })
    await almacen.resetKey('ip-de-prueba')

    const primero = await almacen.increment('ip-de-prueba')
    const segundo = await almacen.increment('ip-de-prueba')
    expect(primero.totalHits).toBe(1)
    expect(segundo.totalHits).toBe(2)

    const fila = await modelos.RateLimit.findByPk('ip-de-prueba')
    expect(fila.total).toBe(2)

    await almacen.resetKey('ip-de-prueba')
    expect(await modelos.RateLimit.findByPk('ip-de-prueba')).toBeNull()
  })
})
