/**
 * @fileoverview Rutas de tripulantes (/api/v1/tripulantes).
 * CRUD completo; escritura solo para administrador.
 * @module server/api/tripulantes
 */

import { Router } from 'express'
import { z } from 'zod'
import { autenticacion } from '../middlewares/autenticacion.js'
import { autorizar } from '../middlewares/autorizacion.js'
import { modelos } from '../db/modelos.js'
import { auditar } from './utilidades.js'

const { Tripulante } = modelos
const rutas = Router()

/** Esquema de creación/edición de tripulante. */
const esquemaTripulante = z.object({
  nombre: z.string().min(2).max(120),
  cargo: z.string().max(80).optional(),
  edad: z.number().int().positive().optional(),
  peso_kg: z.number().positive().optional(),
  altura_cm: z.number().positive().optional(),
  dia_mision: z.number().int().positive().optional(),
  mision: z.string().max(120).optional(),
  objetivo: z.string().max(255).optional(),
  alergias: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
})

// GET /api/v1/tripulantes
rutas.get('/', autenticacion, async (_req, res) => {
  const tripulantes = await Tripulante.findAll()
  res.json(tripulantes)
})

// POST /api/v1/tripulantes (solo administrador)
rutas.post('/', autenticacion, autorizar('administrador'), async (req, res) => {
  const validacion = esquemaTripulante.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  const tripulante = await Tripulante.create(validacion.data)
  await auditar({ usuarioId: req.usuario.id, accion: 'crear', entidad: 'tripulante', entidadId: tripulante.id, req })
  res.status(201).json(tripulante)
})

// PUT /api/v1/tripulantes/:id (solo administrador)
rutas.put('/:id', autenticacion, autorizar('administrador'), async (req, res) => {
  const validacion = esquemaTripulante.partial().safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  const tripulante = await Tripulante.findByPk(req.params.id)
  if (!tripulante) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Tripulante no encontrado.' })
  await tripulante.update(validacion.data)
  await auditar({ usuarioId: req.usuario.id, accion: 'editar', entidad: 'tripulante', entidadId: tripulante.id, req })
  res.json(tripulante)
})

// DELETE /api/v1/tripulantes/:id (solo administrador)
rutas.delete('/:id', autenticacion, autorizar('administrador'), async (req, res) => {
  const tripulante = await Tripulante.findByPk(req.params.id)
  if (!tripulante) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Tripulante no encontrado.' })
  await tripulante.update({ activo: false })
  await auditar({ usuarioId: req.usuario.id, accion: 'desactivar', entidad: 'tripulante', entidadId: tripulante.id, req })
  res.status(204).end()
})

export default rutas
