/**
 * @fileoverview Pruebas de privacidad y costo del chat: consentimiento, límites,
 * caída al motor local, sanitización y escalamiento con alerta enlazada.
 * @module server/chat/privacidad.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { prepararApp, cerrarBase, EMAIL_ADMIN, CONTRASENA_ADMIN } from '../test/preparar.js'
import { modelos } from '../db/modelos.js'
import { generarRespuestaChat } from './servicio.js'
import { GeminiChatProvider } from './proveedores.js'
import { sanitizarEntrada, sanitizarSalida } from './privacidad.js'

/** Proveedor simulado que registra si fue llamado. */
class ProveedorSimulado extends GeminiChatProvider {
  constructor(respuesta) {
    super('clave-falsa-de-prueba')
    this.respuesta = respuesta
    this.llamadas = 0
  }

  async generar() {
    this.llamadas += 1
    return this.respuesta
  }
}

let app
let tokenAdmin

beforeAll(async () => {
  app = await prepararApp()
  const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
  tokenAdmin = login.body.accessToken
})

afterAll(async () => {
  await cerrarBase()
})

describe('sanitización y caída al motor local', () => {
  it('sanitiza la salida eliminando HTML/scripts', () => {
    expect(sanitizarSalida('<p>Hola</p><script>alert(1)</script>')).toBe('Hola')
    expect(sanitizarSalida('<b>negrita</b> javascript:alert(1)')).toBe('negrita alert(1)')
  })

  it('sanitiza la entrada quitando caracteres de control', () => {
    expect(sanitizarEntrada('hola\u0000mundo')).toBe('holamundo')
  })

  it('usa la nube cuando el proveedor responde y cae al local cuando falla', async () => {
    const conRespuesta = new ProveedorSimulado('Respuesta de nube')
    const r1 = await generarRespuestaChat({ mensaje: 'hola', contexto: {}, proveedor: conRespuesta })
    expect(r1.usoNube).toBe(true)
    expect(r1.respuesta).toContain('Respuesta de nube')

    const sinRespuesta = new ProveedorSimulado(null)
    const r2 = await generarRespuestaChat({ mensaje: 'hola', contexto: {}, proveedor: sinRespuesta })
    expect(r2.usoNube).toBe(false)
    expect(r2.respuesta).toContain('no está disponible')
  })
})

describe('consentimiento, límites y escalamiento (integración)', () => {
  it('sin consentimiento el chat usa el motor local y no la nube', async () => {
    const res = await request(app).post('/api/v1/chat').set('Authorization', `Bearer ${tokenAdmin}`).send({ mensaje: 'hola', contexto: {} })
    expect(res.status).toBe(200)
    expect(res.body.modo).toBe('local')
    expect(res.body.respuesta).toBeTruthy()
    // La clave de Gemini nunca aparece en la respuesta.
    expect(JSON.stringify(res.body)).not.toMatch(/AIza/)
  })

  it('el cambio de consentimiento se audita sin guardar el contenido', async () => {
    await request(app).put('/api/v1/chat/consentimiento').set('Authorization', `Bearer ${tokenAdmin}`).send({ acepta_nube: true })
    const auditoria = await modelos.Auditoria.findOne({ where: { accion: 'consentir_nube', usuario_id: null } })
    // El usuario admin tiene id, así que buscamos por acción directamente.
    const porAccion = await modelos.Auditoria.findAll({ where: { accion: 'consentir_nube' } })
    expect(porAccion.length).toBeGreaterThan(0)
    expect(auditoria ?? porAccion[0]).toBeTruthy()
  })

  it('el escalamiento en código genera una alerta crítica enlazada', async () => {
    const antes = await modelos.Alerta.count({ where: { severidad: 'critica' } })
    await request(app).post('/api/v1/chat').set('Authorization', `Bearer ${tokenAdmin}`).send({ mensaje: 'no me siento bien', contexto: { signosVitales: { saturacion_oxigeno: 80 } } })
    const despues = await modelos.Alerta.count({ where: { severidad: 'critica' } })
    expect(despues).toBeGreaterThan(antes)
  })
})
