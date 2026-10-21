/**
 * @fileoverview Pruebas de seguridad de la autenticación.
 * Config de producción, CSRF, revocación de refresh reutilizado, 401 y enumeración.
 * @module server/auth/seguridad.test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { validarConfig } from '../config.js'
import { crearAplicacion } from '../app.js'
import { sembrarUsuarios } from './repositorioUsuarios.js'
import { inicializarBaseDatos } from '../baseDatos.js'

let app

beforeAll(async () => {
  await inicializarBaseDatos()
  await sembrarUsuarios(true)
  app = crearAplicacion()
})

describe('configuración de producción', () => {
  it('rechaza DEMO_MODE=true en producción', () => {
    expect(() =>
      validarConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(16), DEMO_MODE: 'true' }),
    ).toThrow('DEMO_MODE')
  })

  it('rechaza producción sin JWT_SECRET', () => {
    expect(() => validarConfig({ NODE_ENV: 'production', DEMO_MODE: 'false' })).toThrow('JWT_SECRET')
  })

  it('en desarrollo el modo demo está activo por defecto', () => {
    const config = validarConfig({ NODE_ENV: 'development' })
    expect(config.DEMO_MODE).toBe('true')
  })
})

describe('protección CSRF (Origin)', () => {
  it('/refresh con Origin de otro dominio devuelve 403', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').set('Origin', 'https://malicioso.com')
    expect(res.status).toBe(403)
  })

  it('/logout con Origin de otro dominio devuelve 403', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Origin', 'https://malicioso.com')
    expect(res.status).toBe(403)
  })
})

describe('enumeración de usuarios', () => {
  it('usuario inexistente y contraseña incorrecta devuelven el mismo mensaje', async () => {
    const inexistente = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'noexiste', contrasena: 'clave' })
    const incorrecta = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', contrasena: 'clave-incorrecta' })
    expect(inexistente.status).toBe(401)
    expect(incorrecta.status).toBe(401)
    expect(inexistente.body.mensaje).toBe(incorrecta.body.mensaje)
  })
})

describe('revocación de refresh reutilizado', () => {
  it('un refresh token reutilizado revoca toda la familia', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ username: 'admin', contrasena: 'admin123' })
    const cookieA = login.headers['set-cookie'][0].split(';')[0]

    // Primer uso: rota y emite un nuevo refresh (cookieB).
    const refresh1 = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieA)
    expect(refresh1.status).toBe(200)
    const cookieB = refresh1.headers['set-cookie'][0].split(';')[0]

    // Reutilización del token A: debe revocar toda la familia.
    const reutilizado = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieA)
    expect(reutilizado.status).toBe(401)

    // El token B (de la misma familia) también queda revocado.
    const refresh2 = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieB)
    expect(refresh2.status).toBe(401)
  })
})

describe('cobertura 401 sin sesión', () => {
  it('/api/registros devuelve 401', async () => {
    const res = await request(app).get('/api/registros')
    expect(res.status).toBe(401)
  })

  it('/api/telemetria devuelve 401', async () => {
    const res = await request(app).get('/api/telemetria')
    expect(res.status).toBe(401)
  })

  it('/api/v1/chat devuelve 401', async () => {
    const res = await request(app).post('/api/v1/chat').send({ mensaje: 'hola' })
    expect(res.status).toBe(401)
  })

  it('/api/v1/auth/me devuelve 401', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })
})
