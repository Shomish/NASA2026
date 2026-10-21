/**
 * @fileoverview Pruebas de integración de la API de autenticación (Supertest).
 * @module server/auth/auth.test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { crearAplicacion } from '../app.js'
import { sembrarUsuarios } from './repositorioUsuarios.js'
import { inicializarBaseDatos } from '../baseDatos.js'

let app
let accessToken

beforeAll(async () => {
  await inicializarBaseDatos()
  await sembrarUsuarios(true)
  app = crearAplicacion()
  const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', contrasena: 'admin123' })
  accessToken = login.body.accessToken
})

describe('autenticación', () => {
  it('login correcto devuelve accessToken y usuario', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'admin', contrasena: 'admin123' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.usuario.username).toBe('admin')
  })

  it('login con contraseña incorrecta devuelve 401 y mensaje genérico', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'admin', contrasena: 'incorrecta' })
    expect(res.status).toBe(401)
    expect(res.body.mensaje).toContain('Usuario o contraseña')
  })

  it('usuario inexistente devuelve la misma respuesta 401 (anti-enumeración)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'noexiste', contrasena: 'cualquiera' })
    expect(res.status).toBe(401)
    expect(res.body.mensaje).toContain('Usuario o contraseña')
  })

  it('datos inválidos (sin campos) devuelven 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({})
    expect(res.status).toBe(400)
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
