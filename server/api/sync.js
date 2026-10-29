/**
 * @fileoverview Endpoint de sincronización offline idempotente (/api/v1/sync).
 * Recibe operaciones con idempotency_key y garantiza que no se procesen dos veces.
 * @module server/api/sync
 */

import { Router } from 'express'
import { z } from 'zod'
import { autenticacion } from '../middlewares/autenticacion.js'
import { modelos } from '../db/modelos.js'
import { sequelize } from '../db/conexion.js'
import { generarCodigoUnico } from './utilidades.js'

const { OperacionSync, Registro, SignoVital } = modelos
const rutas = Router()

const esquemaSync = z.object({
  idempotency_key: z.string().min(8).max(80),
  operacion: z.enum(['crear_registro']),
  datos: z.object({
    tripulante_id: z.number().int().positive(),
    tipo: z.enum(['signos_vitales']),
    detalle: z.record(z.unknown()).optional().default({}),
  }),
})

// POST /api/v1/sync (idempotente).
rutas.post('/', autenticacion, async (req, res) => {
  const validacion = esquemaSync.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  const { idempotency_key, operacion, datos } = validacion.data

  const existente = await OperacionSync.findOne({ where: { idempotency_key } })
  if (existente) {
    return res.status(200).json({ duplicado: true, estado: existente.estado })
  }

  try {
    const resultado = await sequelize.transaction(async (t) => {
      await OperacionSync.create({ idempotency_key, usuario_id: req.usuario.id, operacion, estado: 'procesada' }, { transaction: t })
      if (operacion === 'crear_registro') {
        const registro = await Registro.create(
          { codigo: await generarCodigoUnico(), usuario_id: req.usuario.id, tripulante_id: datos.tripulante_id, tipo: datos.tipo, estado: 'pendiente' },
          { transaction: t },
        )
        await SignoVital.create({ registro_id: registro.id, ...(datos.detalle ?? {}) }, { transaction: t })
        return registro
      }
      return null
    })
    res.status(201).json({ duplicado: false, registro: resultado })
  } catch {
    res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'No se pudo procesar la sincronización.' })
  }
})

export default rutas
