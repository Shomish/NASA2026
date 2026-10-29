/**
 * @fileoverview Rutas de autenticación (/api/v1/auth).
 * @module server/auth/rutas
 */

import { Router } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { login, register, refresh, logout, me } from './controlador.js'
import { autenticacion } from '../middlewares/autenticacion.js'
import { verificarOrigen } from '../middlewares/csrf.js'
import { config } from '../config.js'
import { AlmacenRateLimitMySQL } from './almacenRateLimit.js'

const rutas = Router()

// Rate limits con almacén persistente (MySQL) para que los contadores sobrevivan
// al reinicio. Cada endpoint usa un prefijo propio para no mezclar contadores.
const esProduccion = config.NODE_ENV === 'production'

/** Genera una clave con prefijo a partir de la IP del cliente. */
const clavePrefijo = (prefijo) => (req) => `${prefijo}:${ipKeyGenerator(req.ip)}`

// Login (anti fuerza bruta).
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esProduccion ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new AlmacenRateLimitMySQL(),
  keyGenerator: clavePrefijo('login'),
  message: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiados intentos. Inténtalo más tarde.' },
})

// Registro (anti spam de cuentas).
const limitadorRegistro = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esProduccion ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: new AlmacenRateLimitMySQL(),
  keyGenerator: clavePrefijo('registro'),
  message: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiadas solicitudes. Inténtalo más tarde.' },
})

// Refresh (anti abuso de rotación de tokens).
const limitadorRefresh = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: esProduccion ? 100 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new AlmacenRateLimitMySQL(),
  keyGenerator: clavePrefijo('refresh'),
  message: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiadas solicitudes. Inténtalo más tarde.' },
})

rutas.post('/login', limitadorLogin, login)
rutas.post('/register', limitadorRegistro, register)
rutas.post('/refresh', verificarOrigen, limitadorRefresh, refresh)
rutas.post('/logout', verificarOrigen, logout)
rutas.get('/me', autenticacion, me)

export default rutas
