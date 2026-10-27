/**
 * @fileoverview Pruebas de reglas de negocio y mass assignment del núcleo.
 * Cubre: mass assignment (estado/rol/usuario_id/tripulante_id ajenos), permisos
 * de restauración, cierre solo de validados, edición de cerrados bloqueada y
 * reintento seguro del código crypto ante colisión.
 * @module server/api/reglas.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { prepararApp, cerrarBase, EMAIL_ADMIN, CONTRASENA_ADMIN } from '../test/preparar.js'
import { modelos } from '../db/modelos.js'
import { generarCodigoUnico } from './utilidades.js'

let app
let tokenAdmin
let tokenTripulante
let usuarioTripulanteId

beforeAll(async () => {
  app = await prepararApp()
  const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
  tokenAdmin = login.body.accessToken

  await request(app).post('/api/v1/auth/register').send({ nombre: 'Ana Tripulante', email: 'ana.tripulante@ayni.health', contrasena: 'clave1234' })
  const usuarioTripulante = await modelos.Usuario.findOne({ where: { email: 'ana.tripulante@ayni.health' } })
  usuarioTripulanteId = usuarioTripulante.id
  const ana = await modelos.Tripulante.findOne({ where: { nombre: 'Ana Quispe' } })
  await ana.update({ usuario_id: usuarioTripulante.id })
  const loginTripulante = await request(app).post('/api/v1/auth/login').send({ email: 'ana.tripulante@ayni.health', contrasena: 'clave1234' })
  tokenTripulante = loginTripulante.body.accessToken
})

afterAll(async () => {
  await cerrarBase()
})

describe('mass assignment', () => {
  it('registros: ignora estado, rol, usuario_id y código inyectados', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({
        tripulante_id: 1,
        tipo: 'signos_vitales',
        detalle: { frecuencia_cardiaca: 71 },
        estado: 'cerrado',
        rol: 'administrador',
        usuario_id: 999999,
        codigo: 'AAAA0000',
      })
    expect(res.status).toBe(201)
    expect(res.body.estado).toBe('pendiente')
    expect(res.body.codigo).toMatch(/^[0-9A-F]{8}$/)
    expect(res.body.codigo).not.toBe('AAAA0000')
    expect(Number(res.body.usuario_id)).toBe(usuarioTripulanteId)
  })

  it('registros: el detalle no permite inyectar registro_id ajeno', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { registro_id: 999999, id: 999999, frecuencia_cardiaca: 80 } })
    expect(res.status).toBe(201)
    const detalle = await modelos.SignoVital.findOne({ where: { registro_id: res.body.id } })
    expect(detalle.registro_id).toBe(res.body.id)
    expect(detalle.frecuencia_cardiaca).toBe(80)
  })

  it('tripulantes: un administrador no puede fijar usuario_id ni id ajeno', async () => {
    const res = await request(app)
      .post('/api/v1/tripulantes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Tripulante Protegido', usuario_id: usuarioTripulanteId, id: 999999 })
    expect(res.status).toBe(201)
    expect(res.body.usuario_id ?? null).toBeNull()
    expect(res.body.id).not.toBe(999999)
  })

  it('registro público: el rol inyectado se ignora (siempre tripulante)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ nombre: 'Intruso Rol', email: 'intruso.rol@ayni.health', contrasena: 'clave1234', rol: 'administrador' })
    expect(res.status).toBe(201)
    expect(res.body.rol).toBe('tripulante')
  })

  it('usuarios: un tripulante no puede crear ni cambiar rol (403)', async () => {
    const crear = await request(app)
      .post('/api/v1/usuarios')
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ nombre: 'X', email: 'x@ayni.health', contrasena: 'clave1234', rol: 'administrador' })
    expect(crear.status).toBe(403)

    const cambiar = await request(app)
      .put(`/api/v1/usuarios/${usuarioTripulanteId}/rol`)
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ rol: 'administrador' })
    expect(cambiar.status).toBe(403)
  })
})

describe('reglas de negocio', () => {
  it('un tripulante no puede restaurar el borrado lógico de otro tripulante', async () => {
    const creado = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 2, tipo: 'sueno', detalle: { horas: 7 } })
    expect(creado.status).toBe(201)

    await request(app).delete(`/api/v1/registros/${creado.body.id}`).set('Authorization', `Bearer ${tokenAdmin}`)

    const restaurado = await request(app)
      .post(`/api/v1/registros/${creado.body.id}/restaurar`)
      .set('Authorization', `Bearer ${tokenTripulante}`)
    expect(restaurado.status).toBe(403)
  })

  it('un tripulante sí puede restaurar su propio borrado lógico', async () => {
    const creado = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ tripulante_id: 1, tipo: 'diario', detalle: { titulo: 'Día 120', contenido: 'Entrenamiento normal.' } })
    expect(creado.status).toBe(201)

    await request(app).delete(`/api/v1/registros/${creado.body.id}`).set('Authorization', `Bearer ${tokenTripulante}`)

    const restaurado = await request(app)
      .post(`/api/v1/registros/${creado.body.id}/restaurar`)
      .set('Authorization', `Bearer ${tokenTripulante}`)
    expect(restaurado.status).toBe(200)
    expect(restaurado.body.eliminado_en).toBeNull()
  })

  it('no se puede cerrar un registro que no esté validado', async () => {
    const creado = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { spo2: 98 } })
    expect(creado.status).toBe(201)

    const cerrar = await request(app).put(`/api/v1/registros/${creado.body.id}/cerrar`).set('Authorization', `Bearer ${tokenAdmin}`)
    expect(cerrar.status).toBe(409)
    expect(cerrar.body.codigo).toBe('ESTADO_INVALIDO')
  })

  it('un registro cerrado no se puede editar', async () => {
    const creado = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { frecuencia_cardiaca: 75 } })
    expect(creado.status).toBe(201)
    const id = creado.body.id

    await request(app).put(`/api/v1/registros/${id}/validar`).set('Authorization', `Bearer ${tokenAdmin}`)
    await request(app).put(`/api/v1/registros/${id}/cerrar`).set('Authorization', `Bearer ${tokenAdmin}`)

    const editar = await request(app)
      .put(`/api/v1/registros/${id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ detalle: { frecuencia_cardiaca: 99 } })
    expect(editar.status).toBe(409)
    expect(editar.body.codigo).toBe('ESTADO_INVALIDO')
  })

  it('editar un registro pendiente propio sí está permitido', async () => {
    const creado = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { frecuencia_cardiaca: 70 } })
    expect(creado.status).toBe(201)

    const editar = await request(app)
      .put(`/api/v1/registros/${creado.body.id}`)
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ detalle: { frecuencia_cardiaca: 88 } })
    expect(editar.status).toBe(200)
    const detalle = await modelos.SignoVital.findOne({ where: { registro_id: creado.body.id } })
    expect(detalle.frecuencia_cardiaca).toBe(88)
  })
})

describe('código crypto con reintento', () => {
  it('reintenta cuando el código generado colisiona con uno existente', async () => {
    const creado = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { spo2: 99 } })
    const codigoExistente = creado.body.codigo

    let llamadas = 0
    const resultado = await generarCodigoUnico(() => {
      llamadas += 1
      return llamadas === 1 ? codigoExistente : 'BEEF1234'
    })
    expect(llamadas).toBeGreaterThan(1)
    expect(resultado).toBe('BEEF1234')
  })
})
