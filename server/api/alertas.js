/**
 * @fileoverview Rutas de alertas (/api/v1/alertas) y generación automática.
 * Las alertas se generan desde los umbrales clínicos y la pregunta 9 del PHQ-9.
 * @module server/api/alertas
 */

import { Router } from 'express'
import { Op } from 'sequelize'
import { autenticacion } from '../middlewares/autenticacion.js'
import { autorizar } from '../middlewares/autorizacion.js'
import { modelos } from '../db/modelos.js'
import { esMedicoOAdmin, tripulanteDelUsuario } from './utilidades.js'
import { item9Phq9Positivo } from '../../shared/evaluaciones.js'

const { Alerta, UmbralClinico, Tripulante } = modelos
const rutas = Router()

/** Mapeo campo de detalle → parámetro de umbral. */
const MAPA_UMBRAL = {
  spo2: 'saturacion_oxigeno',
  frecuencia_cardiaca: 'frecuencia_cardiaca',
  temperatura_c: 'temperatura',
  glucosa_mgdl: 'glucosa',
}

/**
 * Genera alertas para un registro a partir de umbrales y del ítem 9 del PHQ-9.
 * @param {object} registro - Registro recién creado.
 * @param {object} detalle - Detalle limpio del registro.
 * @returns {Promise<void>} Promesa.
 */
export async function generarAlertas(registro, detalle) {
  const alertas = []

  // Ítem 9 del PHQ-9 (ideación): activa SIEMPRE una alerta crítica.
  if (registro.tipo === 'salud_mental') {
    const item9 = detalle.item9_positivo || item9Phq9Positivo(detalle.respuestas)
    if (item9) {
      alertas.push({
        tripulante_id: registro.tripulante_id,
        registro_origen_id: registro.id,
        severidad: 'critica',
        mensaje: 'Respuesta afirmativa en la pregunta 9 del PHQ-9: se recomienda apoyo inmediato.',
        estado: 'nueva',
      })
    }
  }

  for (const [campo, parametro] of Object.entries(MAPA_UMBRAL)) {
    const valor = detalle[campo]
    if (valor === undefined || valor === null) continue
    const umbral = await UmbralClinico.findOne({ where: { parametro } })
    if (!umbral) continue
    if (umbral.min_critico != null && Number(valor) < Number(umbral.min_critico)) {
      alertas.push({ tripulante_id: registro.tripulante_id, registro_origen_id: registro.id, severidad: 'critica', mensaje: `${parametro} crítico: ${valor} ${umbral.unidad ?? ''}`.trim(), estado: 'nueva' })
    } else if (umbral.max_critico != null && Number(valor) > Number(umbral.max_critico)) {
      alertas.push({ tripulante_id: registro.tripulante_id, registro_origen_id: registro.id, severidad: 'critica', mensaje: `${parametro} crítico: ${valor} ${umbral.unidad ?? ''}`.trim(), estado: 'nueva' })
    }
  }

  for (const a of alertas) {
    // Evita duplicados: si ya existe una alerta activa con el mismo mensaje y tripulante.
    const duplicada = await Alerta.findOne({
      where: { tripulante_id: a.tripulante_id, mensaje: a.mensaje, estado: { [Op.in]: ['nueva', 'leida'] } },
    })
    if (!duplicada) await Alerta.create(a)
  }
}

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
