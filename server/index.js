/**
 * @fileoverview Servidor Express del Monitor Autónomo de Salud.
 * Sirve el build de React y expone la API REST (incluido el endpoint IoT).
 * @module server/index
 */

import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  inicializarBaseDatos,
  insertarRegistro,
  obtenerRegistros,
  insertarTelemetria,
  obtenerTelemetria,
} from './baseDatos.js'

// Carga las variables de entorno de `.env` (si existe). Sin esta carga,
// `process.env.GEMINI_API_KEY` quedaría indefinida. No lanza error si el archivo falta.
try {
  process.loadEnvFile()
} catch {
  /* Sin .env: se usan las variables del entorno del sistema. */
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUERTO = process.env.PUERTO ?? 3001

const aplicacion = express()
aplicacion.use(cors())
aplicacion.use(express.json())

/* ==================== API REST ==================== */

// Health-check del servidor.
aplicacion.get('/api/estado', (_req, res) => {
  res.json({ estado: 'operativo', servicio: 'monitor-salud-astronauta', hora: new Date().toISOString() })
})

// Estado del proveedor de IA (para que el front sepa si hay LLM en la nube disponible).
aplicacion.get('/api/chat/estado', (_req, res) => {
  res.json({ disponible: Boolean(process.env.GEMINI_API_KEY) })
})

// Proxy del asistente de IA: oculta la API key del proveedor (solo backend).
aplicacion.post('/api/chat', async (req, res) => {
  const clave = process.env.GEMINI_API_KEY
  if (!clave) {
    return res.status(503).json({ error: 'IA no configurada en el servidor' })
  }
  const { mensaje = '', contexto = '' } = req.body ?? {}
  try {
    const respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${clave}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `Eres el médico de IA de una misión espacial. Contexto del astronauta:\n${contexto}\n\nPregunta del astronauta: ${mensaje}\nResponde en español, breve y accionable.` },
              ],
            },
          ],
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

// CRUD de registros de signos vitales.
aplicacion.get('/api/registros', (_req, res) => {
  res.json(obtenerRegistros())
})

aplicacion.post('/api/registros', (req, res) => {
  try {
    const registro = insertarRegistro(req.body ?? {})
    res.status(201).json(registro)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Endpoint de telemetría IoT (dispositivos externos → SQLite).
aplicacion.post('/api/telemetria', (req, res) => {
  try {
    const dato = insertarTelemetria(req.body ?? {})
    res.status(201).json(dato)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

aplicacion.get('/api/telemetria', (_req, res) => {
  res.json(obtenerTelemetria())
})

/* ==================== Servir frontend (producción) ==================== */
const carpetaDist = path.join(__dirname, '..', 'dist')
aplicacion.use(express.static(carpetaDist))
aplicacion.get('*', (_req, res) => {
  res.sendFile(path.join(carpetaDist, 'index.html'))
})

// Inicialización y arranque.
inicializarBaseDatos()
  .then(() => {
    aplicacion.listen(PUERTO, () => {
      console.log(`🛰️  Backend Express operativo en http://localhost:${PUERTO}`)
      console.log(`    API: /api/estado · /api/registros · /api/telemetria`)
    })
  })
  .catch((error) => {
    console.error('Error al inicializar la base de datos:', error)
    process.exit(1)
  })
