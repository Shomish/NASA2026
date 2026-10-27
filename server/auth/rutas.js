/**
 * @fileoverview Rutas de autenticación (/api/v1/auth).
 * @module server/auth/rutas
 */

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, register, refresh, logout, me } from './controlador.js'
import { autenticacion } from '../middlewares/autenticacion.js'
import { verificarOrigen } from '../middlewares/csrf.js'
import { config } from '../config.js'

const rutas = Router()

// Rate limit específico SOLO para el login (anti fuerza bruta).
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.NODE_ENV === 'production' ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiados intentos. Inténtalo más tarde.' },
})

rutas.post('/login', limitadorLogin, login)
rutas.post('/register', register)
rutas.post('/refresh', verificarOrigen, refresh)
rutas.post('/logout', verificarOrigen, logout)
rutas.get('/me', autenticacion, me)

export default rutas
