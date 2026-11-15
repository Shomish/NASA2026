/**
 * @fileoverview Rutas de alertas (/api/v1/alertas) y generación automática.
 * Las alertas se generan desde los umbrales clínicos, la radiación, la presión
 * arterial, la glucosa, el sueño y la pregunta 9 del PHQ-9.
 * @module server/api/alertas
 */

import { Router } from 'express'
import { z } from 'zod'
import { Op } from 'sequelize'
import { autenticacion } from '../middlewares/autenticacion.js'
import { autorizar } from '../middlewares/autorizacion.js'
import { modelos } from '../db/modelos.js'
import { esMedicoOAdmin, tripulanteDelUsuario, auditar } from './utilidades.js'
import { item9Phq9Positivo } from '../../shared/evaluaciones.js'

const { Alerta, UmbralClinico, Tripulante, Registro, RegistroSueno } = modelos
const rutas = Router()

/** Mapeo campo de detalle → parámetro de umbral (umbrales críticos genéricos). */
const MAPA_UMBRAL = {
  spo2: 'saturacion_oxigeno',
  frecuencia_cardiaca: 'frecuencia_cardiaca',
  presion_sistolica: 'presion_sistolica',
  presion_diastolica: 'presion_diastolica',
  acumulada_msv: 'radiacion_acumulada',
  dosis_msv: 'radiacion_evento',
}

/** Mensajes personalizados para alertas críticas. */
const MENSAJES_CRITICOS = {
  presion_sistolica: (valor, unidad) =>
    `Presión sistólica en crisis: ${valor} ${unidad}. Activa el protocolo de emergencia y contacta al oficial médico y a control de misión.`,
  presion_diastolica: (valor, unidad) =>
    `Presión diastólica en crisis: ${valor} ${unidad}. Activa el protocolo de emergencia y contacta al oficial médico y a control de misión.`,
  radiacion_acumulada: (valor, unidad) =>
    `Radiación acumulada crítica: ${valor} ${unidad}. Límite de carrera NASA: 600 mSv.`,
  radiacion_evento: (valor, unidad) =>
    `Evento solar crítico: ${valor} ${unidad}. Límite NASA por evento: 250 mSv.`,
  saturacion_oxigeno: (valor, unidad) => `saturacion_oxigeno crítico: ${valor} ${unidad}`.trim(),
}

/**
 * Genera alertas para un registro a partir de umbrales, radiación, presión,
 * glucosa, sueño y del ítem 9 del PHQ-9.
 * @param {object} registro - Registro recién creado.
 * @param {object} detalle - Detalle limpio del registro.
 * @returns {Promise<void>} Promesa.
 */
export async function generarAlertas(registro, detalle) {
  const alertas = []
  const agregar = (severidad, mensaje) => {
    alertas.push({
      tripulante_id: registro.tripulante_id,
      registro_origen_id: registro.id,
      severidad,
      mensaje,
      estado: 'nueva',
    })
  }

  // Ítem 9 del PHQ-9: activa SIEMPRE una alerta crítica.
  if (registro.tipo === 'salud_mental') {
    const item9 = detalle.item9_positivo || item9Phq9Positivo(detalle.respuestas)
    if (item9) {
      agregar('critica', 'Respuesta afirmativa en la pregunta 9 del PHQ-9: se recomienda apoyo inmediato.')
    }
  }

  // Temperatura: < 34 °C crítica (equipo); ≥ 38 °C atención (CDC).
  const temperatura = Number(detalle.temperatura_c)
  if (Number.isFinite(temperatura)) {
    if (temperatura < 34) {
      agregar('critica', `Temperatura corporal crítica: ${temperatura} °C. Hipotermia; contacta al oficial médico.`)
    } else if (temperatura >= 38) {
      agregar('atencion', `Fiebre: ${temperatura} °C. Avisa al oficial médico y a control de misión.`)
    }
  }

  // Glucosa: < 54 crítica; < 70 atención; 100–125 atención solo en ayunas; > 250 crítica.
  const glucosa = Number(detalle.glucosa_mgdl)
  if (Number.isFinite(glucosa)) {
    if (glucosa < 54) {
      agregar('critica', `Glucosa grave: ${glucosa} mg/dL. Avisa de inmediato al oficial médico.`)
    } else if (glucosa < 70) {
      agregar('atencion', `Glucosa baja: ${glucosa} mg/dL. Ingiere carbohidratos y avisa al oficial médico.`)
    } else if (detalle.ayunas === true && glucosa >= 100 && glucosa <= 125) {
      agregar('atencion', `Glucosa elevada en ayunas: ${glucosa} mg/dL. Repite la medición y consulta al oficial médico.`)
    } else if (glucosa > 250) {
      agregar('critica', `Glucosa crítica: ${glucosa} mg/dL. Avisa al oficial médico.`)
    }
  }

  // Presión arterial: ≥ 140/90 atención; > 180/120 crítica (la crítica la genera MAPA_UMBRAL).
  const sistolica = Number(detalle.presion_sistolica)
  const diastolica = Number(detalle.presion_diastolica)
  const crisisPresion = (Number.isFinite(sistolica) && sistolica > 180) || (Number.isFinite(diastolica) && diastolica > 120)
  if (!crisisPresion && ((Number.isFinite(sistolica) && sistolica >= 140) || (Number.isFinite(diastolica) && diastolica >= 90))) {
    agregar('atencion', `Presión arterial elevada: ${sistolica || '—'}/${diastolica || '—'} mmHg. Repite la medición y avisa al oficial médico.`)
  }

  // Radiación: 480–599 atención; ≥ 600 crítica (la crítica la genera MAPA_UMBRAL).
  const acumulada = Number(detalle.acumulada_msv)
  if (Number.isFinite(acumulada) && acumulada >= 480 && acumulada < 600) {
    agregar('atencion', `Radiación acumulada en atención: ${acumulada} mSv (80 % del límite NASA de 600 mSv).`)
  }

  // SpO₂: 90–94 atención; < 90 crítica (la crítica la genera MAPA_UMBRAL).
  const spo2 = Number(detalle.spo2)
  if (Number.isFinite(spo2) && spo2 >= 90 && spo2 < 95) {
    agregar('atencion', `Saturación de O₂ baja: ${spo2} %. Reposa, verifica la medición y avisa si persiste.`)
  }

  // Sueño: menos de 7 h durante 3 noches seguidas (criterio del equipo).
  if (registro.tipo === 'sueno') {
    const recientes = await Registro.findAll({
      where: { tripulante_id: registro.tripulante_id, tipo: 'sueno', eliminado_en: null },
      order: [['fecha_registro', 'DESC']],
      limit: 3,
      include: [{ model: RegistroSueno, as: 'RegistroSueno' }],
    })
    if (recientes.length === 3 && recientes.every((r) => Number(r.RegistroSueno?.horas) < 7)) {
      agregar('atencion', 'Sueño insuficiente: menos de 7 h durante 3 noches seguidas. Avisa al oficial médico.')
    }
  }

  // Umbrales críticos genéricos.
  for (const [campo, parametro] of Object.entries(MAPA_UMBRAL)) {
    const valor = detalle[campo]
    if (valor === undefined || valor === null) continue
    const umbral = await UmbralClinico.findOne({ where: { parametro } })
    if (!umbral) continue
    const numero = Number(valor)
    if (!Number.isFinite(numero)) continue
    const critico =
      (umbral.min_critico != null && numero < Number(umbral.min_critico)) ||
      (umbral.max_critico != null && numero > Number(umbral.max_critico))
    if (!critico) continue
    const mensaje = MENSAJES_CRITICOS[parametro]?.(numero, umbral.unidad ?? '') ?? `${parametro} crítico: ${numero} ${umbral.unidad ?? ''}`.trim()
    agregar('critica', mensaje)
  }

  // Evita duplicados: misma alerta activa y mismo tripulante.
  let creadas = 0
  for (const alerta of alertas) {
    const duplicada = await Alerta.findOne({
      where: { tripulante_id: alerta.tripulante_id, mensaje: alerta.mensaje, estado: { [Op.in]: ['nueva', 'leida'] } },
    })
    if (!duplicada) {
      await Alerta.create(alerta)
      creadas += 1
    }
  }
  return creadas
}

/** Esquema de alerta de emergencia creada desde el chat local/offline. */
const esquemaAlertaEmergencia = z.object({
  tripulante_id: z.number().int().positive(),
  mensaje: z.string().min(5).max(255),
})

// POST /api/v1/alertas (emergencia desde el chat local; el tripulante solo puede crear la suya).
rutas.post('/', autenticacion, async (req, res) => {
  const validacion = esquemaAlertaEmergencia.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })

  const { tripulante_id, mensaje } = validacion.data
  if (!esMedicoOAdmin(req)) {
    const propio = await tripulanteDelUsuario(req)
    if (!propio || propio.id !== tripulante_id) {
      return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'No puedes crear una alerta para otro tripulante.' })
    }
  }

  const tripulante = await Tripulante.findByPk(tripulante_id)
  if (!tripulante) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Tripulante no encontrado.' })

  const alerta = await Alerta.create({
    tripulante_id,
    registro_origen_id: null,
    severidad: 'critica',
    mensaje,
    estado: 'nueva',
  })
  await auditar({ usuarioId: req.usuario.id, accion: 'crear_alerta_emergencia', entidad: 'alerta', entidadId: alerta.id, req })
  res.status(201).json(alerta)
})

// GET /api/v1/alertas (el tripulante ve solo las suyas; médico/admin todas).
rutas.get('/', autenticacion, async (req, res) => {
  const where = {}
  if (req.query.estado) where.estado = req.query.estado
  if (!esMedicoOAdmin(req)) {
    const tripulante = await tripulanteDelUsuario(req)
    if (!tripulante) return res.json([])
    where.tripulante_id = tripulante.id
  }
  const alertas = await Alerta.findAll({ where, order: [['id', 'DESC']], include: [{ model: Tripulante, as: 'Tripulante', attributes: ['id', 'nombre'] }] })
  res.json(alertas.map((a) => {
    const plano = a.get({ plain: true })
    return { ...plano, tripulante_nombre: plano.Tripulante?.nombre ?? null, Tripulante: undefined }
  }))
})

// PUT /api/v1/alertas/:id/leer (médico/admin o el tripulante dueño).
rutas.put('/:id/leer', autenticacion, async (req, res) => {
  const alerta = await Alerta.findByPk(req.params.id)
  if (!alerta) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Alerta no encontrada.' })
  if (!esMedicoOAdmin(req)) {
    const tripulante = await tripulanteDelUsuario(req)
    if (!tripulante || tripulante.id !== alerta.tripulante_id) {
      return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'No puedes marcar esta alerta.' })
    }
  }
  await alerta.update({ estado: 'leida' })
  res.json(alerta)
})

// PUT /api/v1/alertas/:id/resolver (solo médico/admin).
rutas.put('/:id/resolver', autenticacion, autorizar('administrador', 'medico'), async (req, res) => {
  const alerta = await Alerta.findByPk(req.params.id)
  if (!alerta) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Alerta no encontrada.' })
  await alerta.update({ estado: 'resuelta', resuelta_por: req.usuario.id })
  res.json(alerta)
})

export default rutas
