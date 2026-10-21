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
import { listarUsuarios } from '../auth/repositorioUsuarios.js'

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

// GET /api/v1/usuarios (administrador)
rutas.get('/usuarios', autenticacion, autorizar('administrador'), (_req, res) => {
  res.json(listarUsuarios())
})

export default rutas
