/**
 * @fileoverview Pruebas de umbrales de alertas, emergencia y outbox de alertas.
 * @module server/api/alertas.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { Op } from 'sequelize'
import { prepararApp, cerrarBase, EMAIL_ADMIN, CONTRASENA_ADMIN } from '../test/preparar.js'
import { modelos } from '../db/modelos.js'

let app
let token
let tripulanteId

beforeAll(async () => {
  app = await prepararApp()
  const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL_ADMIN, contrasena: CONTRASENA_ADMIN })
  token = login.body.accessToken
  const ana = await modelos.Tripulante.findOne({ where: { nombre: 'Ana Quispe' } })
  tripulanteId = ana.id
})

afterAll(async () => {
  await cerrarBase()
})

/** Crea un registro y devuelve su id. */
async function crearRegistro(tipo, detalle, id = tripulanteId) {
  const res = await request(app)
    .post('/api/v1/registros')
    .set('Authorization', `Bearer ${token}`)
    .send({ tripulante_id: id, tipo, detalle })
  expect(res.status).toBe(201)
  return res.body.id
}

/** Alertas generadas por un registro concreto. */
async function alertasDe(registroId) {
  return modelos.Alerta.findAll({ where: { registro_origen_id: registroId } })
}

describe('umbrales de alertas', () => {
  it('temperatura 38.2 °C genera atención', async () => {
    const id = await crearRegistro('signos_vitales', { temperatura_c: 38.2 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'atencion' && a.mensaje.includes('Fiebre'))).toBe(true)
  })

  it('SpO₂ 88 % genera alerta crítica', async () => {
    const id = await crearRegistro('signos_vitales', { spo2: 88 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'critica')).toBe(true)
  })

  it('presión 150/95 genera atención sin crisis', async () => {
    const id = await crearRegistro('signos_vitales', { presion_sistolica: 150, presion_diastolica: 95 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'atencion' && a.mensaje.includes('Presión arterial elevada'))).toBe(true)
    expect(alertas.some((a) => a.mensaje.includes('protocolo de emergencia'))).toBe(false)
  })

  it('presión 185/125 genera crisis con protocolo', async () => {
    const id = await crearRegistro('signos_vitales', { presion_sistolica: 185, presion_diastolica: 125 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'critica' && a.mensaje.includes('protocolo de emergencia'))).toBe(true)
  })

  it('glucosa 65 genera atención', async () => {
    const id = await crearRegistro('glucosa', { glucosa_mgdl: 65, ayunas: true })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'atencion' && a.mensaje.includes('Glucosa baja'))).toBe(true)
  })

  it('glucosa 45 genera alerta crítica', async () => {
    const id = await crearRegistro('glucosa', { glucosa_mgdl: 45, ayunas: true })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'critica' && a.mensaje.includes('Glucosa grave'))).toBe(true)
  })

  it('glucosa 110 en ayunas genera atención', async () => {
    const id = await crearRegistro('glucosa', { glucosa_mgdl: 110, ayunas: true })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'atencion' && a.mensaje.includes('Glucosa elevada en ayunas'))).toBe(true)
  })

  it('glucosa 110 sin ayunas no aplica el rango elevado', async () => {
    const id = await crearRegistro('glucosa', { glucosa_mgdl: 110, ayunas: false })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.mensaje.includes('Glucosa elevada'))).toBe(false)
  })

  it('radiación acumulada 500 mSv genera atención', async () => {
    const id = await crearRegistro('radiacion', { dosis_msv: 10, acumulada_msv: 500 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'atencion' && a.mensaje.includes('Radiación acumulada en atención'))).toBe(true)
  })

  it('radiación acumulada 600 mSv genera alerta crítica', async () => {
    const id = await crearRegistro('radiacion', { dosis_msv: 10, acumulada_msv: 600 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'critica' && a.mensaje.includes('Radiación acumulada crítica'))).toBe(true)
  })

  it('un evento solar de 260 mSv genera alerta crítica', async () => {
    const id = await crearRegistro('radiacion', { dosis_msv: 260, acumulada_msv: 300 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'critica' && a.mensaje.includes('Evento solar crítico'))).toBe(true)
  })

  it('tres noches seguidas con menos de 7 h generan atención', async () => {
    const creado = await request(app)
      .post('/api/v1/tripulantes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Prueba Sueño', cargo: 'Referencia de prueba' })
    expect(creado.status).toBe(201)
    const idTripulante = creado.body.id
    let ultimoId
    for (let i = 0; i < 3; i += 1) {
      ultimoId = await crearRegistro('sueno', { horas: 6, calidad: 5, despertares: 3 }, idTripulante)
    }
    const alertas = await alertasDe(ultimoId)
    expect(alertas.some((a) => a.mensaje.includes('Sueño insuficiente'))).toBe(true)
  })
})

describe('PHQ-9 y GAD-7', () => {
  it('rechaza el PHQ-9 con 8 respuestas', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${token}`)
      .send({ tripulante_id: tripulanteId, tipo: 'salud_mental', detalle: { cuestionario: 'phq9', respuestas: [0, 0, 0, 0, 0, 0, 0, 0], puntaje: 0 } })
    expect(res.status).toBe(400)
  })

  it('rechaza respuestas mayores a 3', async () => {
    const res = await request(app)
      .post('/api/v1/registros')
      .set('Authorization', `Bearer ${token}`)
      .send({ tripulante_id: tripulanteId, tipo: 'salud_mental', detalle: { cuestionario: 'phq9', respuestas: [0, 0, 0, 0, 0, 0, 0, 0, 4], puntaje: 4 } })
    expect(res.status).toBe(400)
  })

  it('acepta el GAD-7 con 7 respuestas', async () => {
    const id = await crearRegistro('salud_mental', { cuestionario: 'gad7', respuestas: [0, 0, 0, 0, 0, 0, 0], puntaje: 0 })
    expect(id).toBeGreaterThan(0)
  })

  it('el ítem 9 del PHQ-9 genera una alerta crítica', async () => {
    const id = await crearRegistro('salud_mental', { cuestionario: 'phq9', respuestas: [0, 0, 0, 0, 0, 0, 0, 0, 1], puntaje: 1 })
    const alertas = await alertasDe(id)
    expect(alertas.some((a) => a.severidad === 'critica' && a.mensaje.includes('PHQ-9'))).toBe(true)
  })
})

describe('alerta de emergencia y outbox', () => {
  it('POST /alertas crea una alerta crítica', async () => {
    const res = await request(app)
      .post('/api/v1/alertas')
      .set('Authorization', `Bearer ${token}`)
      .send({ tripulante_id: tripulanteId, mensaje: 'Posible emergencia de prueba' })
    expect(res.status).toBe(201)
    expect(res.body.severidad).toBe('critica')
  })

  it('sync crear_alerta es idempotente', async () => {
    const clave = `alerta-sync-${Date.now()}`
    const datos = { tripulante_id: tripulanteId, mensaje: 'Posible emergencia desde outbox' }
    const primero = await request(app).post('/api/v1/sync').set('Authorization', `Bearer ${token}`).send({ idempotency_key: clave, operacion: 'crear_alerta', datos })
    expect(primero.status).toBe(201)
    const segundo = await request(app).post('/api/v1/sync').set('Authorization', `Bearer ${token}`).send({ idempotency_key: clave, operacion: 'crear_alerta', datos })
    expect(segundo.status).toBe(200)
    expect(segundo.body.duplicado).toBe(true)
  })

  it('el chat responde con el protocolo y crea una alerta crítica', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ mensaje: 'Me falta el aire y tengo dolor en el pecho, saturación 84%' })
    expect(res.status).toBe(200)
    expect(res.body.respuesta).toContain('Posible emergencia')
    const alerta = await modelos.Alerta.findOne({ where: { mensaje: { [Op.like]: '%Posible emergencia%' } } })
    expect(alerta).toBeTruthy()
  })
})
