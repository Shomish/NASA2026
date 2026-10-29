/**
 * @fileoverview Rutas de salud complementaria: nutrición (alimentos/contramedidas/planes),
 * catálogo de indicadores, entornos de misión y acciones de salud.
 * @module server/api/salud
 */

import { Router } from 'express'
import { z } from 'zod'
import { autenticacion } from '../middlewares/autenticacion.js'
import { autorizar } from '../middlewares/autorizacion.js'
import { modelos } from '../db/modelos.js'
import { tripulanteDelUsuario } from './utilidades.js'

const { Alimento, Contramedida, PlanNutricional, CatalogoIndicador, EntornoMision, AccionSalud } = modelos
const rutas = Router()

/* ==================== Nutrición ==================== */

const esquemaAlimento = z.object({
  nombre: z.string().min(2).max(120),
  categoria: z.enum(['superalimento_andino', 'despensa']),
  kcal: z.number().int().optional(),
  proteina_g: z.number().optional(),
  carbohidratos_g: z.number().optional(),
  grasa_g: z.number().optional(),
  porcion: z.string().max(80).optional(),
  beneficio: z.string().max(255).optional(),
  origen_andino: z.boolean().optional(),
})

// Listar alimentos (todos los roles autenticados).
rutas.get('/alimentos', autenticacion, async (_req, res) => {
  res.json(await Alimento.findAll({ order: [['nombre', 'ASC']] }))
})

// Crear alimento (admin).
rutas.post('/alimentos', autenticacion, autorizar('administrador'), async (req, res) => {
  const validacion = esquemaAlimento.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  res.status(201).json(await Alimento.create(validacion.data))
})

// Editar alimento (admin).
rutas.put('/alimentos/:id', autenticacion, autorizar('administrador'), async (req, res) => {
  const validacion = esquemaAlimento.partial().safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  const alimento = await Alimento.findByPk(req.params.id)
  if (!alimento) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Alimento no encontrado.' })
  await alimento.update(validacion.data)
  res.json(alimento)
})

// Eliminar alimento (admin).
rutas.delete('/alimentos/:id', autenticacion, autorizar('administrador'), async (req, res) => {
  const alimento = await Alimento.findByPk(req.params.id)
  if (!alimento) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Alimento no encontrado.' })
  await alimento.destroy()
  res.status(204).end()
})

// Contramedidas (listar y crear, admin para crear).
rutas.get('/contramedidas', autenticacion, async (_req, res) => {
  res.json(await Contramedida.findAll())
})

rutas.post('/contramedidas', autenticacion, autorizar('administrador'), async (req, res) => {
  const esquema = z.object({ alimento_id: z.number().int().positive(), objetivo: z.string().min(2).max(160), dosis_texto: z.string().max(80).optional(), via: z.string().max(60).optional() })
  const validacion = esquema.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  res.status(201).json(await Contramedida.create(validacion.data))
})

// Planes nutricionales.
rutas.get('/planes', autenticacion, async (_req, res) => {
  res.json(await PlanNutricional.findAll({ include: [{ model: Alimento, through: { attributes: [] } }] }))
})

rutas.post('/planes', autenticacion, autorizar('administrador', 'medico'), async (req, res) => {
  const esquema = z.object({ tripulante_id: z.number().int().positive(), objetivo: z.string().max(255).optional(), alergias: z.array(z.string()).optional(), imc_referencia: z.number().optional() })
  const validacion = esquema.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  res.status(201).json(await PlanNutricional.create(validacion.data))
})

/* ==================== Catálogo, entornos y acciones ==================== */

rutas.get('/catalogo', autenticacion, async (_req, res) => {
  res.json(await CatalogoIndicador.findAll({ order: [['nombre', 'ASC']] }))
})

rutas.get('/entornos', autenticacion, async (_req, res) => {
  res.json(await EntornoMision.findAll())
})

// Acciones de salud (plan de acción). El tripulante ve las suyas.
rutas.get('/acciones', autenticacion, async (req, res) => {
  const where = {}
  const tripulante = await tripulanteDelUsuario(req)
  if (tripulante && req.usuario.rol === 'tripulante') where.tripulante_id = tripulante.id
  else if (req.query.tripulante_id) where.tripulante_id = Number(req.query.tripulante_id)
  res.json(await AccionSalud.findAll({ where, order: [['id', 'DESC']] }))
})

rutas.put('/acciones/:id', autenticacion, async (req, res) => {
  const esquema = z.object({ estado: z.enum(['pendiente', 'hecha', 'descartada']) })
  const validacion = esquema.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Estado inválido.' })
  const accion = await AccionSalud.findByPk(req.params.id)
  if (!accion) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Acción no encontrada.' })
  await accion.update({ estado: validacion.data.estado })
  res.json(accion)
})

export default rutas
