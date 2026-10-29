/**
 * @fileoverview Acciones de demostración (solo DEMO_MODE).
 * El botón "Avanzar día" adelanta la misión de los tripulantes de demostración.
 * @module server/api/demo
 */

import { Router } from 'express'
import { autenticacion } from '../middlewares/autenticacion.js'
import { config } from '../config.js'
import { modelos } from '../db/modelos.js'

const { Tripulante } = modelos
const rutas = Router()

// POST /api/v1/demo/avanzar-dia (solo modo demo).
rutas.post('/avanzar-dia', autenticacion, async (_req, res) => {
  if (config.DEMO_MODE !== 'true') {
    return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'Disponible solo en modo demostración.' })
  }
  await Tripulante.increment('dia_mision', { by: 1, where: {} })
  res.json({ ok: true, mensaje: 'Día de misión avanzado.' })
})

export default rutas
