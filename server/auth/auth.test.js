/**
 * @fileoverview Pruebas de integración de la API de autenticación (Supertest, MySQL).
 * @module server/auth/auth.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { prepararApp, cerrarBase, EMAIL_ADMIN, CONTRASENA_ADMIN } from '../test/preparar.js'

let app
let accessToken

beforeAll(async () => {
  app = await prepararApp()
  const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
  accessToken = login.body.accessToken
})

afterAll(async () => {
  await cerrarBase()
})

describe('autenticación', () => {
  it('login correcto devuelve accessToken y usuario', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.usuario.email).toBe(EMAIL_ADMIN)
  })

  it('login con contraseña incorrecta devuelve 401 y mensaje genérico', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: 'incorrecta' })
    expect(res.status).toBe(401)
    expect(res.body.mensaje).toContain('Usuario o contraseña')
  })

  it('usuario inexistente devuelve la misma respuesta 401 (anti-enumeración)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'noexiste@ayni.health', contrasena: 'cualquiera' })
    expect(res.status).toBe(401)
    expect(res.body.mensaje).toContain('Usuario o contraseña')
  })

  it('datos inválidos devuelven 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({})
    expect(res.status).toBe(400)
  })

  it('registro crea un usuario con rol tripulante', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ nombre: 'Nuevo Tripulante', email: 'nuevo@ayni.health', contrasena: 'clave1234' })
    expect(res.status).toBe(201)
    expect(res.body.rol).toBe('tripulante')
  })
})

describe('rutas protegidas', () => {
  it('ruta de datos sin sesión devuelve 401', async () => {
    const res = await request(app).get('/api/registros')
    expect(res.status).toBe(401)
  })

  it('ruta de datos con token válido devuelve 200', async () => {
    const res = await request(app).get('/api/registros').set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
  })

  it('token manipulado devuelve 401', async () => {
    const res = await request(app).get('/api/registros').set('Authorization', 'Bearer token-manipulado')
    expect(res.status).toBe(401)
  })
})
