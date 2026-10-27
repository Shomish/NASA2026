/**
 * @fileoverview Rutas de registros (/api/v1/registros).
 * Flujo pendiente → validado → cerrado, con código crypto, transacción y borrado lógico.
 * @module server/api/registros
 */

import { Router } from 'express'
import { z } from 'zod'
import { autenticacion } from '../middlewares/autenticacion.js'
import { modelos } from '../db/modelos.js'
import { sequelize } from '../db/conexion.js'
import { generarCodigo, esMedicoOAdmin, tripulanteDelUsuario, auditar } from './utilidades.js'

const { Registro, SignoVital, RegistroSueno, EvaluacionPhq9, RegistroRadiacion, NotaDiario } = modelos
const rutas = Router()

/** Mapeo de tipo → modelo de detalle. */
const MODELOS_DETALLE = {
  signos_vitales: SignoVital,
  sueno: RegistroSueno,
  salud_mental: EvaluacionPhq9,
  radiacion: RegistroRadiacion,
  diario: NotaDiario,
}

/** Esquema de creación de registro. */
const esquemaRegistro = z.object({
  tripulante_id: z.number().int().positive(),
  tipo: z.enum(['signos_vitales', 'sueno', 'salud_mental', 'radiacion', 'diario']),
  detalle: z.record(z.unknown()).optional().default({}),
})

/**
 * Obtiene el id del tripulante al que puede acceder el usuario (regla de acceso).
 * @param {object} req - Petición.
 * @returns {Promise<number | null>} Id del tripulante (null si es admin/médico sin restricción).
 */
async function restriccionTripulante(req) {
  if (esMedicoOAdmin(req)) return null
  const tripulante = await tripulanteDelUsuario(req)
  return tripulante ? tripulante.id : -1 // -1: sin permiso, no verá nada.
}

// GET /api/v1/registros (filtros y paginación)
rutas.get('/', autenticacion, async (req, res) => {
  const tripulanteId = await restriccionTripulante(req)
  const { tipo, estado, tripulante_id, pagina = 1, por_pagina = 20 } = req.query

  const where = { eliminado_en: null }
  if (tripulanteId !== null) where.tripulante_id = tripulanteId
  if (tripulante_id && tripulanteId === null) where.tripulante_id = Number(tripulante_id)
  if (tipo) where.tipo = tipo
  if (estado) where.estado = estado

  const { rows, count } = await Registro.findAndCountAll({
    where,
    order: [['fecha_registro', 'DESC']],
    limit: Number(por_pagina),
    offset: (Number(pagina) - 1) * Number(por_pagina),
  })
  res.json({ total: count, pagina: Number(pagina), por_pagina: Number(por_pagina), datos: rows })
})

// POST /api/v1/registros (transacción cabecera + detalle)
rutas.post('/', autenticacion, async (req, res) => {
  const validacion = esquemaRegistro.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })

  const tripulanteId = await restriccionTripulante(req)
  if (tripulanteId !== null && tripulanteId !== validacion.data.tripulante_id) {
    return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'No puedes registrar datos de otro tripulante.' })
  }

  const modeloDetalle = MODELOS_DETALLE[validacion.data.tipo]
  const transaccion = await sequelize.transaction()
  try {
    const registro = await Registro.create(
      {
        codigo: generarCodigo(),
        usuario_id: req.usuario.id,
        tripulante_id: validacion.data.tripulante_id,
        tipo: validacion.data.tipo,
        estado: 'pendiente',
      },
      { transaction: transaccion },
    )
    await modeloDetalle.create(
      { registro_id: registro.id, ...(validacion.data.detalle ?? {}) },
      { transaction: transaccion },
    )
    await transaccion.commit()
    await auditar({ usuarioId: req.usuario.id, accion: 'crear', entidad: 'registro', entidadId: registro.id, req })
    res.status(201).json(registro)
  } catch {
    await transaccion.rollback()
    res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'No se pudo crear el registro.' })
  }
})

// PUT /api/v1/registros/:id/validar (médico o administrador)
rutas.put('/:id/validar', autenticacion, async (req, res) => {
  if (!esMedicoOAdmin(req)) return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'Solo médico o administrador.' })
  const registro = await Registro.findByPk(req.params.id)
  if (!registro) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  await registro.update({ estado: 'validado' })
  await auditar({ usuarioId: req.usuario.id, accion: 'validar', entidad: 'registro', entidadId: registro.id, req })
  res.json(registro)
})

// PUT /api/v1/registros/:id/cerrar (médico o administrador)
rutas.put('/:id/cerrar', autenticacion, async (req, res) => {
  if (!esMedicoOAdmin(req)) return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'Solo médico o administrador.' })
  const registro = await Registro.findByPk(req.params.id)
  if (!registro) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  await registro.update({ estado: 'cerrado', fecha_cierre: new Date() })
  await auditar({ usuarioId: req.usuario.id, accion: 'cerrar', entidad: 'registro', entidadId: registro.id, req })
  res.json(registro)
})

// DELETE /api/v1/registros/:id (borrado lógico)
rutas.delete('/:id', autenticacion, async (req, res) => {
  const registro = await Registro.findByPk(req.params.id)
  if (!registro) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  await registro.update({ eliminado_en: new Date() })
  await auditar({ usuarioId: req.usuario.id, accion: 'eliminar', entidad: 'registro', entidadId: registro.id, req })
  res.status(204).end()
})

// POST /api/v1/registros/:id/restaurar (deshacer borrado lógico)
rutas.post('/:id/restaurar', autenticacion, async (req, res) => {
  const registro = await Registro.findByPk(req.params.id)
  if (!registro) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  await registro.update({ eliminado_en: null })
  await auditar({ usuarioId: req.usuario.id, accion: 'restaurar', entidad: 'registro', entidadId: registro.id, req })
  res.json(registro)
})

export default rutas
