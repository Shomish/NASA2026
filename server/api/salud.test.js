/**
 * @fileoverview Pruebas de la salud complementaria (2B): nuevos tipos de registro,
 * alertas, nutrición, auditoría, sincronización idempotente, entornos y catálogo.
 * @module server/api/salud.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { Op } from 'sequelize'
import { prepararApp, cerrarBase, EMAIL_ADMIN, CONTRASENA_ADMIN } from '../test/preparar.js'
import { modelos } from '../db/modelos.js'

let app
let tokenAdmin
let tokenTripulante

beforeAll(async () => {
  app = await prepararApp()
  const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
  tokenAdmin = login.body.accessToken

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

describe('nuevos tipos de registro (reto)', () => {
  it('crea un registro de glucosa con su detalle', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'glucosa', detalle: { glucosa_mgdl: 95, ayunas: true } })
    expect(res.status).toBe(201)
    const detalle = await modelos.RegistroGlucosa.findOne({ where: { registro_id: res.body.id } })
    expect(detalle.glucosa_mgdl).toBe(95)
  })

  it('crea un registro de ejercicio y ánimo', async () => {
    const ejercicio = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'ejercicio', detalle: { tipo: 'cardio', minutos: 30 } })
    expect(ejercicio.status).toBe(201)

    const animo = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'animo', detalle: { escala: 6 } })
    expect(animo.status).toBe(201)
  })
})

describe('alertas', () => {
  it('genera una alerta crítica por valor fuera de umbral (SpO₂ baja)', async () => {
    await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { spo2: 85 } })
    const alertas = await modelos.Alerta.findAll({ where: { tripulante_id: 1, severidad: 'critica' } })
    expect(alertas.length).toBeGreaterThan(0)
    expect(alertas.some((a) => a.mensaje.includes('saturacion_oxigeno'))).toBe(true)
  })

  it('genera SIEMPRE una alerta crítica ante la pregunta 9 del PHQ-9', async () => {
    await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tripulante_id: 1, tipo: 'salud_mental', detalle: { respuestas: [0, 0, 0, 0, 0, 0, 0, 0, 1], puntaje: 1, item9_positivo: true } })
    const alertas = await modelos.Alerta.findAll({ where: { tripulante_id: 1, severidad: 'critica' } })
    expect(alertas.some((a) => a.mensaje.includes('PHQ-9'))).toBe(true)
  })

  it('no genera alertas duplicadas para la misma condición', async () => {
    const condicion = { tripulante_id: 1, mensaje: { [Op.like]: '%saturacion_oxigeno%' } }
    const antes = await modelos.Alerta.count({ where: condicion })
    // Dos registros con la misma SpO₂ crítica.
    await request(app).post('/api/v1/registros').set('Authorization', `Bearer ${tokenAdmin}`).send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { spo2: 84 } })
    await request(app).post('/api/v1/registros').set('Authorization', `Bearer ${tokenAdmin}`).send({ tripulante_id: 1, tipo: 'signos_vitales', detalle: { spo2: 84 } })
    const despues = await modelos.Alerta.count({ where: condicion })
    expect(despues - antes).toBe(1)
  })

  it('lista alertas y permite marcar leída y resolver', async () => {
    const lista = await request(app).get('/api/v1/alertas').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(lista.status).toBe(200)
    const primera = lista.body[0]

    const leer = await request(app).put(`/api/v1/alertas/${primera.id}/leer`).set('Authorization', `Bearer ${tokenAdmin}`)
    expect(leer.status).toBe(200)
    expect(leer.body.estado).toBe('leida')

    const resolver = await request(app).put(`/api/v1/alertas/${primera.id}/resolver`).set('Authorization', `Bearer ${tokenAdmin}`)
    expect(resolver.status).toBe(200)
    expect(resolver.body.estado).toBe('resuelta')
  })
})

describe('nutrición, auditoría y catálogo', () => {
  it('lista alimentos sembrados y permite CRUD (admin)', async () => {
    const lista = await request(app).get('/api/v1/alimentos').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(lista.status).toBe(200)
    expect(lista.body.length).toBeGreaterThanOrEqual(11)

    const crear = await request(app)
      .post('/api/v1/alimentos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Alimento Prueba', categoria: 'despensa', kcal: 100 })
    expect(crear.status).toBe(201)
    expect(crear.body.nombre).toBe('Alimento Prueba')
  })

  it('un tripulante no puede crear alimentos (403)', async () => {
    const res = await request(app)
      .post('/api/v1/alimentos')
      .set('Authorization', `Bearer ${tokenTripulante}`)
      .send({ nombre: 'Intruso', categoria: 'despensa' })
    expect(res.status).toBe(403)
  })

  it('la auditoría es solo para administrador', async () => {
    const admin = await request(app).get('/api/v1/auditoria').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(admin.status).toBe(200)
    expect(Array.isArray(admin.body)).toBe(true)

    const tripulante = await request(app).get('/api/v1/auditoria').set('Authorization', `Bearer ${tokenTripulante}`)
    expect(tripulante.status).toBe(403)
  })

  it('expone catálogo de indicadores y entornos de misión', async () => {
    const catalogo = await request(app).get('/api/v1/catalogo').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(catalogo.status).toBe(200)
    expect(catalogo.body.length).toBeGreaterThanOrEqual(7)

    const entornos = await request(app).get('/api/v1/entornos').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(entornos.status).toBe(200)
    expect(entornos.body.length).toBe(6)
  })
})

describe('sincronización offline', () => {
  it('es idempotente: la misma clave no se procesa dos veces', async () => {
    const clave = `clave-sync-${Date.now()}`
    const cuerpo = { idempotency_key: clave, operacion: 'crear_registro', datos: { tripulante_id: 1, tipo: 'signos_vitales', detalle: { frecuencia_cardiaca: 70 } } }

    const primero = await request(app).post('/api/v1/sync').set('Authorization', `Bearer ${tokenAdmin}`).send(cuerpo)
    expect(primero.status).toBe(201)
    expect(primero.body.duplicado).toBe(false)

    const segundo = await request(app).post('/api/v1/sync').set('Authorization', `Bearer ${tokenAdmin}`).send(cuerpo)
    expect(segundo.status).toBe(200)
    expect(segundo.body.duplicado).toBe(true)

    const registros = await modelos.Registro.count({ where: { tipo: 'signos_vitales' } })
    expect(registros).toBeGreaterThanOrEqual(1)
  })
})

describe('avanzar día (demo)', () => {
  it('avanza el día de misión en modo demo', async () => {
    const ana = await modelos.Tripulante.findOne({ where: { nombre: 'Ana Quispe' } })
    const diaAntes = ana.dia_mision
    const res = await request(app).post('/api/v1/demo/avanzar-dia').set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
    const despues = await modelos.Tripulante.findByPk(ana.id)
    expect(despues.dia_mision).toBe(diaAntes + 1)
  })
})
