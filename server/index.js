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
