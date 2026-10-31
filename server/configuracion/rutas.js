/**
 * @fileoverview Rutas de configuración (/api/v1).
 * Umbrales clínicos y gestión de usuarios, restringidas al rol administrador.
 * @module server/configuracion/rutas
 */

import { Router } from 'express'
import { z } from 'zod'
import { autenticacion } from '../middlewares/autenticacion.js'
import { autorizar } from '../middlewares/autorizacion.js'
import { obtenerUmbrales, actualizarUmbrales, restablecerUmbrales } from './umbrales.js'
import { obtenerConfigIA, actualizarConfigIA } from './ia.js'
import { auditar } from '../api/utilidades.js'

const rutas = Router()

/** Esquema de actualización de umbrales (permite campos opcionales). */
const esquemaUmbrales = z.object({
  saturacion_oxigeno: z.object({ normalMin: z.number(), normalMax: z.number(), criticoMin: z.number(), criticoMax: z.number() }).partial().optional(),
  frecuencia_cardiaca: z.object({ normalMin: z.number(), normalMax: z.number(), criticoMin: z.number(), criticoMax: z.number() }).partial().optional(),
  temperatura: z.object({ normalMin: z.number(), normalMax: z.number(), criticoMin: z.number(), criticoMax: z.number() }).partial().optional(),
  phq9: z.object({ normalMin: z.number(), normalMax: z.number(), criticoMin: z.number(), criticoMax: z.number() }).partial().optional(),
})

// GET /api/v1/configuracion/umbrales (administrador)
rutas.get('/configuracion/umbrales', autenticacion, autorizar('administrador'), (_req, res) => {
  res.json(obtenerUmbrales())
})

// PUT /api/v1/configuracion/umbrales (administrador)
rutas.put('/configuracion/umbrales', autenticacion, autorizar('administrador'), (req, res) => {
  const validacion = esquemaUmbrales.safeParse(req.body ?? {})
  if (!validacion.success) {
    return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Umbrales inválidos.' })
  }
  const resultante = actualizarUmbrales(validacion.data)
  return res.json(resultante)
})

// POST /api/v1/configuracion/umbrales/restablecer (administrador)
rutas.post('/configuracion/umbrales/restablecer', autenticacion, autorizar('administrador'), (_req, res) => {
  res.json(restablecerUmbrales())
})

/** Esquema de actualización de la configuración de IA. */
const esquemaIA = z.object({
  activo: z.boolean().optional(),
  proveedor: z.enum(['gemini', 'openai']).optional(),
  modelo: z.string().max(80).optional(),
  clave_api: z.string().max(255).optional(),
  url_base: z.string().max(255).optional(),
})

// GET /api/v1/configuracion/ia (administrador): estado del proveedor.
rutas.get('/configuracion/ia', autenticacion, autorizar('administrador'), async (_req, res) => {
  const config = await obtenerConfigIA()
  res.json({
    activo: config.activo,
    proveedor: config.proveedor,
    modelo: config.modelo,
    clave_configurada: config.claveConfigurada,
    url_base: config.urlBase,
    limite_diario_por_usuario: config.limiteDiario,
    limite_mensual_global: config.limiteMensual,
  })
})

// PUT /api/v1/configuracion/ia (administrador): activa/desactiva y guarda proveedor/clave/modelo/URL.
rutas.put('/configuracion/ia', autenticacion, autorizar('administrador'), async (req, res) => {
  const validacion = esquemaIA.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Configuración inválida.' })
  const resultante = await actualizarConfigIA(validacion.data)
  await auditar({ usuarioId: req.usuario.id, accion: validacion.data.activo ? 'activar_ia' : 'configurar_ia', entidad: 'configuracion_ia', entidadId: resultante.proveedor, req })
  res.json({
    activo: resultante.activo,
    proveedor: resultante.proveedor,
    modelo: resultante.modelo,
    clave_configurada: resultante.claveConfigurada,
    url_base: resultante.urlBase,
  })
})

export default rutas
