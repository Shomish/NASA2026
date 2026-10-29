/**
 * @fileoverview Consulta de auditoría (solo administrador).
 * @module server/api/auditoria
 */

import { Router } from 'express'
import { Op } from 'sequelize'
import { autenticacion } from '../middlewares/autenticacion.js'
import { autorizar } from '../middlewares/autorizacion.js'
import { modelos } from '../db/modelos.js'

const { Auditoria } = modelos
const rutas = Router()

// GET /api/v1/auditoria (filtros por usuario, acción y rango de fechas).
rutas.get('/', autenticacion, autorizar('administrador'), async (req, res) => {
  const { usuario_id, accion, desde, hasta } = req.query
  const where = {}
  if (usuario_id) where.usuario_id = Number(usuario_id)
  if (accion) where.accion = accion
  if (desde || hasta) {
    where.creado_en = {}
    if (desde) where.creado_en[Op.gte] = new Date(desde)
    if (hasta) where.creado_en[Op.lte] = new Date(hasta)
  }
  const auditoria = await Auditoria.findAll({ where, order: [['creado_en', 'DESC']], limit: 200 })
  res.json(auditoria)
})

export default rutas
