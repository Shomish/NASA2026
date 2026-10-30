/**
 * @fileoverview Rutas de registros (/api/v1/registros).
 * Flujo pendiente → validado → cerrado, con código crypto, transacción y borrado lógico.
 * @module server/api/registros
 */

import { Router } from 'express'
import { z } from 'zod'
import { Op } from 'sequelize'
import { autenticacion } from '../middlewares/autenticacion.js'
import { modelos } from '../db/modelos.js'
import { sequelize } from '../db/conexion.js'
import { generarCodigoUnico, esMedicoOAdmin, tripulanteDelUsuario, auditar } from './utilidades.js'
import { generarAlertas } from './alertas.js'

const {
  Registro, SignoVital, RegistroSueno, EvaluacionPhq9, RegistroRadiacion, NotaDiario,
  RegistroGlucosa, RegistroAnimo, RegistroEjercicio, RegistroSintomasInmunes,
  RegistroEstadoConductual, RegistroAmbiente,
} = modelos
const rutas = Router()

/** Mapeo de tipo → modelo de detalle. */
const MODELOS_DETALLE = {
  signos_vitales: SignoVital,
  sueno: RegistroSueno,
  salud_mental: EvaluacionPhq9,
  radiacion: RegistroRadiacion,
  diario: NotaDiario,
  glucosa: RegistroGlucosa,
  animo: RegistroAnimo,
  ejercicio: RegistroEjercicio,
  sintomas_inmunes: RegistroSintomasInmunes,
  estado_conductual: RegistroEstadoConductual,
  ambiente: RegistroAmbiente,
}

/**
 * Esquemas del detalle por tipo. Solo aceptan los campos de su tabla 1:1;
 * cualquier clave extra (p. ej. `registro_id` o `id` inyectados) se descarta,
 * lo que cierra el vector de mass assignment en el detalle.
 */
const ESQUEMAS_DETALLE = {
  signos_vitales: z.object({
    presion_sistolica: z.number().int().positive().optional(),
    presion_diastolica: z.number().int().positive().optional(),
    spo2: z.number().min(0).max(100).optional(),
    frecuencia_cardiaca: z.number().int().positive().optional(),
    masa_kg: z.number().positive().optional(),
    temperatura_c: z.number().optional(),
  }),
  sueno: z.object({
    horas: z.number().min(0).max(24),
    calidad: z.number().int().min(0).max(10).optional(),
    despertares: z.number().int().min(0).optional(),
  }),
  salud_mental: z.object({
    respuestas: z.array(z.number().int().min(0).max(3)),
    puntaje: z.number().int().min(0).max(27),
    nivel: z.string().max(40).optional(),
    item9_positivo: z.boolean().optional(),
  }),
  radiacion: z.object({
    dosis_msv: z.number().min(0),
    acumulada_msv: z.number().min(0),
  }),
  diario: z.object({
    titulo: z.string().min(1).max(160),
    contenido: z.string().min(1),
    etiquetas: z.array(z.string()).optional(),
  }),
  glucosa: z.object({
    glucosa_mgdl: z.number().int().min(0).max(600),
    ayunas: z.boolean().optional(),
  }),
  animo: z.object({
    escala: z.number().int().min(1).max(10),
    notas: z.string().max(255).optional(),
  }),
  ejercicio: z.object({
    tipo: z.enum(['resistencia', 'cardio']),
    minutos: z.number().int().min(1).max(600),
    cumplio_plan: z.boolean().optional(),
  }),
  sintomas_inmunes: z.object({
    fiebre: z.number().int().min(0).max(3).optional(),
    fatiga_inusual: z.number().int().min(0).max(3).optional(),
    infecciones: z.number().int().min(0).max(3).optional(),
    lesiones_cutaneas: z.number().int().min(0).max(3).optional(),
    cicatrizacion_lenta: z.number().int().min(0).max(3).optional(),
  }),
  estado_conductual: z.object({
    gad7: z.number().int().min(0).max(21).optional(),
    estres: z.number().int().min(0).max(10).optional(),
    fatiga: z.number().int().min(0).max(10).optional(),
  }),
  ambiente: z.object({
    co2_ppm: z.number().int().min(0).optional(),
    temperatura_c: z.number().optional(),
    humedad: z.number().min(0).max(100).optional(),
    ruido_db: z.number().min(0).optional(),
  }),
}

/** Esquema de creación de registro. */
const esquemaRegistro = z.object({
  tripulante_id: z.number().int().positive(),
  tipo: z.enum(['signos_vitales', 'sueno', 'salud_mental', 'radiacion', 'diario', 'glucosa', 'animo', 'ejercicio', 'sintomas_inmunes', 'estado_conductual', 'ambiente']),
  detalle: z.record(z.unknown()).optional().default({}),
})

/**
 * Valida y devuelve el detalle (limpio) según el tipo. Descarta claves extra.
 * @param {string} tipo - Tipo de registro.
 * @param {Record<string, unknown>} detalle - Detalle crudo.
 * @param {boolean} parcial - Si se permiten campos omitidos (edición).
 * @returns {object} { valido, detalle | error }.
 */
function validarDetalle(tipo, detalle, parcial = false) {
  const esquema = ESQUEMAS_DETALLE[tipo]
  const resultado = (parcial ? esquema.partial() : esquema).safeParse(detalle ?? {})
  return resultado.success ? { valido: true, detalle: resultado.data } : { valido: false }
}

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

/**
 * Indica si el usuario puede actuar sobre un registro concreto.
 * Médico/administrador: siempre. Tripulante: solo sobre los suyos.
 * @param {object} req - Petición.
 * @param {object} registro - Registro sobre el que se actúa.
 * @returns {Promise<boolean>} Verdadero si tiene acceso.
 */
async function accesoRegistro(req, registro) {
  if (esMedicoOAdmin(req)) return true
  const tripulante = await tripulanteDelUsuario(req)
  return Boolean(tripulante && tripulante.id === registro.tripulante_id)
}

// GET /api/v1/registros (filtros, búsqueda, rango de fechas y paginación)
rutas.get('/', autenticacion, async (req, res) => {
  const tripulanteId = await restriccionTripulante(req)
  const { tipo, estado, tripulante_id, pagina = 1, por_pagina = 20, incluir_eliminados, q, desde, hasta } = req.query

  const where = incluir_eliminados === 'true' ? {} : { eliminado_en: null }
  if (tripulanteId !== null) where.tripulante_id = tripulanteId
  if (tripulante_id && tripulanteId === null) where.tripulante_id = Number(tripulante_id)
  if (tipo) where.tipo = tipo
  if (estado) where.estado = estado
  if (q) where.codigo = { [Op.like]: `%${q}%` }
  if (desde || hasta) {
    where.fecha_registro = {}
    if (desde) where.fecha_registro[Op.gte] = new Date(desde)
    if (hasta) where.fecha_registro[Op.lte] = new Date(`${hasta}T23:59:59`)
  }

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

  const detalle = validarDetalle(validacion.data.tipo, validacion.data.detalle)
  if (!detalle.valido) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Detalle inválido.' })

  const modeloDetalle = MODELOS_DETALLE[validacion.data.tipo]
  const transaccion = await sequelize.transaction()
  try {
    const registro = await Registro.create(
      {
        codigo: await generarCodigoUnico(),
        usuario_id: req.usuario.id,
        tripulante_id: validacion.data.tripulante_id,
        tipo: validacion.data.tipo,
        estado: 'pendiente',
      },
      { transaction: transaccion },
    )
    await modeloDetalle.create({ registro_id: registro.id, ...detalle.detalle }, { transaction: transaccion })
    await transaccion.commit()
    await auditar({ usuarioId: req.usuario.id, accion: 'crear', entidad: 'registro', entidadId: registro.id, req })
    await generarAlertas(registro, detalle.detalle)
    res.status(201).json(registro)
  } catch (error) {
    await transaccion.rollback()
    if (error.message === 'CODIGO_COLISION') {
      return res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'No se pudo generar un código único.' })
    }
    res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'No se pudo crear el registro.' })
  }
})

// PUT /api/v1/registros/:id/validar (médico o administrador, solo pendiente)
rutas.put('/:id/validar', autenticacion, async (req, res) => {
  if (!esMedicoOAdmin(req)) return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'Solo médico o administrador.' })
  const registro = await Registro.findByPk(req.params.id)
  if (!registro || registro.eliminado_en) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  if (registro.estado !== 'pendiente') {
    return res.status(409).json({ codigo: 'ESTADO_INVALIDO', mensaje: 'Solo se puede validar un registro pendiente.' })
  }
  await registro.update({ estado: 'validado' })
  await auditar({ usuarioId: req.usuario.id, accion: 'validar', entidad: 'registro', entidadId: registro.id, req })
  res.json(registro)
})

// PUT /api/v1/registros/:id/cerrar (médico o administrador, solo validado)
rutas.put('/:id/cerrar', autenticacion, async (req, res) => {
  if (!esMedicoOAdmin(req)) return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'Solo médico o administrador.' })
  const registro = await Registro.findByPk(req.params.id)
  if (!registro || registro.eliminado_en) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  if (registro.estado !== 'validado') {
    return res.status(409).json({ codigo: 'ESTADO_INVALIDO', mensaje: 'Solo se puede cerrar un registro validado.' })
  }
  await registro.update({ estado: 'cerrado', fecha_cierre: new Date() })
  await auditar({ usuarioId: req.usuario.id, accion: 'cerrar', entidad: 'registro', entidadId: registro.id, req })
  res.json(registro)
})

// PUT /api/v1/registros/:id (editar detalle; no se puede editar uno cerrado)
rutas.put('/:id', autenticacion, async (req, res) => {
  const registro = await Registro.findByPk(req.params.id)
  if (!registro || registro.eliminado_en) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  if (!(await accesoRegistro(req, registro))) {
    return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'No puedes editar este registro.' })
  }
  if (registro.estado === 'cerrado') {
    return res.status(409).json({ codigo: 'ESTADO_INVALIDO', mensaje: 'Un registro cerrado no se puede editar.' })
  }

  const cuerpo = z.object({ detalle: z.record(z.unknown()).optional().default({}) }).safeParse(req.body ?? {})
  if (!cuerpo.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })

  const detalle = validarDetalle(registro.tipo, cuerpo.data.detalle, true)
  if (!detalle.valido) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Detalle inválido.' })

  const modeloDetalle = MODELOS_DETALLE[registro.tipo]
  await modeloDetalle.update(detalle.detalle, { where: { registro_id: registro.id } })
  await auditar({ usuarioId: req.usuario.id, accion: 'editar', entidad: 'registro', entidadId: registro.id, req })
  res.json(registro)
})

// DELETE /api/v1/registros/:id (borrado lógico; el tripulante solo el suyo)
rutas.delete('/:id', autenticacion, async (req, res) => {
  const registro = await Registro.findByPk(req.params.id)
  if (!registro || registro.eliminado_en) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  if (!(await accesoRegistro(req, registro))) {
    return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'No puedes eliminar este registro.' })
  }
  await registro.update({ eliminado_en: new Date() })
  await auditar({ usuarioId: req.usuario.id, accion: 'eliminar', entidad: 'registro', entidadId: registro.id, req })
  res.status(204).end()
})

// POST /api/v1/registros/:id/restaurar (deshacer borrado lógico; el tripulante solo el suyo)
rutas.post('/:id/restaurar', autenticacion, async (req, res) => {
  const registro = await Registro.findByPk(req.params.id)
  if (!registro) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Registro no encontrado.' })
  if (!(await accesoRegistro(req, registro))) {
    return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'No puedes restaurar este registro.' })
  }
  if (!registro.eliminado_en) return res.status(400).json({ codigo: 'ESTADO_INVALIDO', mensaje: 'El registro no está eliminado.' })
  await registro.update({ eliminado_en: null })
  await auditar({ usuarioId: req.usuario.id, accion: 'restaurar', entidad: 'registro', entidadId: registro.id, req })
  res.json(registro)
})

export default rutas
