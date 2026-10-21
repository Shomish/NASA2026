/**
 * @fileoverview Pruebas de autorización por rol en configuración.
 * Los endpoints de umbrales y usuarios exigen rol administrador en el servidor.
 * @module server/configuracion/configuracion.test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { crearAplicacion } from '../app.js'
import { sembrarUsuarios } from '../auth/repositorioUsuarios.js'
import { inicializarBaseDatos } from '../baseDatos.js'

let app
let tokenTripulante
let tokenMedico
let tokenAdmin

beforeAll(async () => {
  await inicializarBaseDatos()
  await sembrarUsuarios(true)
  app = crearAplicacion()
  tokenTripulante = jwt.sign({ sub: '2', rol: 'tripulante' }, config.JWT_SECRET)
  tokenMedico = jwt.sign({ sub: '3', rol: 'medico' }, config.JWT_SECRET)
  tokenAdmin = jwt.sign({ sub: '1', rol: 'administrador' }, config.JWT_SECRET)
})

describe('autorización por rol (servidor)', () => {
  it('umbrales: tripulante recibe 403', async () => {
    const res = await request(app).get('/api/v1/configuracion/umbrales').set('Authorization', `Bearer ${tokenTripulante}`)
    expect(res.status).toBe(403)
  })

  it('umbrales: médico recibe 403', async () => {
    const res = await request(app).get('/api/v1/configuracion/umbrales').set('Authorization', `Bearer ${tokenMedico}`)
    expect(res.status).toBe(403)
  })

  it('usuarios: tripulante recibe 403', async () => {
    const res = await request(app).get('/api/v1/usuarios').set('Authorization', `Bearer ${tokenTripulante}`)
    expect(res.status).toBe(403)
  })

  it('umbrales: administrador recibe 200', async () => {
    const res = await request(app).get('/api/v1/configuracion/umbrales').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
  })

  it('usuarios: administrador recibe 200', async () => {
    const res = await request(app).get('/api/v1/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
  })

  it('actualizar umbrales sin rol administrador devuelve 403', async () => {
    const res = await request(app)
      .put('/api/v1/configuracion/umbrales')
      .set('Authorization', `Bearer ${tokenMedico}`)
      .send({ saturacion_oxigeno: { criticoMin: 80 } })
    expect(res.status).toBe(403)
  })
})
