/**
 * @fileoverview Pruebas del núcleo de la API (tripulantes, registros, usuarios).
 * @module server/api/api.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { prepararApp, cerrarBase, EMAIL_ADMIN, CONTRASENA_ADMIN } from '../test/preparar.js'
import { modelos } from '../db/modelos.js'

let app
let tokenAdmin
let tokenTripulante

beforeAll(async () => {
  app = await prepararApp()
  const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
  tokenAdmin = login.body.accessToken

  // Crea un usuario tripulante vinculado a Ana Quispe.
  await request(app).post('/api/v1/auth/register').send({ nombre: 'Ana Tripulante', email: 'ana.tripulante@ayni.health', contrasena: 'clave1234' })
  const usuarioTripulante = await modelos.Usuario.findOne({ where: { email: 'ana.tripulante@ayni.health' } })
  const ana = await modelos.Tripulante.findOne({ where: { nombre: 'Ana Quispe' } })
  await ana.update({ usuario_id: usuarioTripulante.id })
  const loginTripulante = await request(app).post('/api/v1/auth/login').send({ email: 'ana.tripulante@ayni.health', contrasena: 'clave1234' })
  tokenTripulante = loginTripulante.body.accessToken
})

afterAll(async () => {
  await cerrarBase()
})

describe('tripulantes', () => {
  it('GET lista los tripulantes (administrador)', async () => {
    const res = await request(app).get('/api/v1/tripulantes').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(3)
  })

  it('POST crea un tripulante (administrador)', async () => {
    const res = await request(app)
      .post('/api/v1/tripulantes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Nuevo Tripulante', cargo: 'Especialista', edad: 30 })
    expect(res.status).toBe(201)
    expect(res.body.nombre).toBe('Nuevo Tripulante')
  })

  it('POST escribe devuelve 403 para un tripulante', async () => {
    const res = await request(app)
      .post('/api/v1/tripulantes')
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ nombre: 'Intruso' })
    expect(res.status).toBe(403)
  })
})

describe('registros', () => {
  let registroId
  let codigo

  it('POST crea cabecera + detalle con código único (transacción)', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { frecuencia_cardiaca: 72, spo2: 97 } })
    expect(res.status).toBe(201)
    expect(res.body.codigo).toMatch(/^[0-9A-F]{8}$/)
    expect(res.body.estado).toBe('pendiente')
    registroId = res.body.id
    codigo = res.body.codigo
  })

  it('el código es único entre registros', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'sueno', detalle: { horas: 8, calidad: 8, despertares: 1 } })
    expect(res.body.codigo).not.toBe(codigo)
  })

  it('un tripulante no puede registrar datos de otro tripulante (IDOR)', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ tripulante_id: 2, tipo: 'sueno', detalle: { horas: 8 } })
    expect(res.status).toBe(403)
  })

  it('un tripulante solo ve sus propios registros (IDOR en GET)', async () => {
    const res = await request(app).get('/api/v1/registros').set('Authorization', `Bearer ${tokenTripulante}`)
    expect(res.status).toBe(200)
    for (const r of res.body.datos) expect(r.tripulante_id).toBe(1)
  })

  it('validar: médico/admin puede; tripulante recibe 403', async () => {
    const resTripulante = await request(app)
      .put(`/api/v1/registros/${registroId}/validar`)
      .set('Authorization', `Bearer ${tokenTripulante}`)
    expect(resTripulante.status).toBe(403)

    const resAdmin = await request(app)
      .put(`/api/v1/registros/${registroId}/validar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(resAdmin.status).toBe(200)
    expect(resAdmin.body.estado).toBe('validado')
  })

  it('cerrar registra fecha_cierre', async () => {
    const res = await request(app)
      .put(`/api/v1/registros/${registroId}/cerrar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe('cerrado')
    expect(res.body.fecha_cierre).toBeTruthy()
  })

  it('DELETE es borrado lógico y se puede restaurar', async () => {
    const del = await request(app).delete(`/api/v1/registros/${registroId}`).set('Authorization', `Bearer ${tokenAdmin}`)
    expect(del.status).toBe(204)

    const restaurado = await request(app)
      .post(`/api/v1/registros/${registroId}/restaurar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(restaurado.status).toBe(200)
    expect(restaurado.body.eliminado_en).toBeNull()
  })
})

describe('usuarios', () => {
  it('GET lista usuarios (solo administrador)', async () => {
    const res = await request(app).get('/api/v1/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
  })

  it('GET devuelve 403 para un tripulante', async () => {
    const res = await request(app).get('/api/v1/usuarios').set('Authorization', `Bearer ${tokenTripulante}`)
    expect(res.status).toBe(403)
  })

  it('no se puede desactivar al último administrador', async () => {
    const admin = await modelos.Usuario.findOne({ where: { email: EMAIL_ADMIN } })
    const res = await request(app)
      .put(`/api/v1/usuarios/${admin.id}/desactivar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(409)
    expect(res.body.codigo).toBe('ULTIMO_ADMIN')
  })
})
