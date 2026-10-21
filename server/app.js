/**
 * @fileoverview Aplicación Express (middlewares y rutas), sin escuchar.
 * Separada de index.js para poder probarla con Supertest sin arrancar el servidor.
 * @module server/app
 */

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import authRutas from './auth/rutas.js'
import chatRutas from './chat/rutas.js'
import configuracionRutas from './configuracion/rutas.js'
import { autenticacion } from './middlewares/autenticacion.js'
import { manejoErrores } from './middlewares/errores.js'
import {
  insertarRegistro,
  obtenerRegistros,
  insertarTelemetria,
  obtenerTelemetria,
} from './baseDatos.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Crea y configura la aplicación Express.
 * @returns {import('express').Express} Aplicación configurada.
 */
export function crearAplicacion() {
  const aplicacion = express()

  aplicacion.use(helmet({ contentSecurityPolicy: false }))
  aplicacion.use(
    cors({
      origin: config.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
      credentials: true,
    }),
  )
  aplicacion.use(express.json({ limit: '100kb' }))
  aplicacion.use(cookieParser())

  const limitadorLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiados intentos. Inténtalo más tarde.' },
  })

  aplicacion.get('/api/estado', (_req, res) => {
    res.json({ estado: 'operativo', servicio: 'monitor-salud-astronauta', hora: new Date().toISOString() })
  })

  aplicacion.use('/api/v1/auth', limitadorLogin, authRutas)

  // Chatbot (versión segura, con rate limit por usuario y límite de tamaño).
  aplicacion.use('/api/v1/chat', chatRutas)

  // Configuración y usuarios (solo administrador).
  aplicacion.use('/api/v1', configuracionRutas)

  aplicacion.get('/api/registros', autenticacion, (_req, res) => {
    res.json(obtenerRegistros())
  })

  aplicacion.post('/api/registros', autenticacion, (req, res) => {
    try {
      const registro = insertarRegistro(req.body ?? {})
      res.status(201).json(registro)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  })

  aplicacion.post('/api/telemetria', autenticacion, (req, res) => {
    try {
      const dato = insertarTelemetria(req.body ?? {})
      res.status(201).json(dato)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  })

  aplicacion.get('/api/telemetria', autenticacion, (_req, res) => {
    res.json(obtenerTelemetria())
  })

  // Sirve el frontend (producción): estático + fallback a index.html.
  const carpetaDist = path.join(__dirname, '..', 'dist')
  aplicacion.use(express.static(carpetaDist))
  aplicacion.get('*', (_req, res) => {
    res.sendFile(path.join(carpetaDist, 'index.html'))
  })

  aplicacion.use(manejoErrores)

  return aplicacion
}
