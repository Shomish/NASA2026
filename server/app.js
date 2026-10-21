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

  aplicacion.get('/api/chat/estado', (_req, res) => {
    res.json({ disponible: Boolean(process.env.GEMINI_API_KEY) })
  })

  aplicacion.use('/api/v1/auth', limitadorLogin, authRutas)

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

  aplicacion.post('/api/chat', autenticacion, async (req, res) => {
    const clave = process.env.GEMINI_API_KEY
    if (!clave) return res.status(503).json({ error: 'IA no configurada en el servidor' })
    const { mensaje = '', contexto = '' } = req.body ?? {}
    try {
      const respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${clave}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Eres el médico de IA de una misión espacial. Contexto del astronauta:\n${contexto}\n\nPregunta del astronauta: ${mensaje}\nResponde en español, breve y accionable.` }] }],
          }),
        },
      )
      const datos = await respuesta.json()
      const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
      if (!texto) return res.status(502).json({ error: 'Respuesta vacía del proveedor' })
      res.json({ respuesta: texto })
    } catch {
      res.status(502).json({ error: 'Fallo del proveedor de IA' })
    }
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
