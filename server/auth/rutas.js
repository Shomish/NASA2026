/**
 * @fileoverview Rutas de autenticación (/api/v1/auth).
 * @module server/auth/rutas
 */

import { Router } from 'express'
import { login, refresh, logout, me } from './controlador.js'
import { autenticacion } from '../middlewares/autenticacion.js'

const rutas = Router()

rutas.post('/login', login)
rutas.post('/refresh', refresh)
rutas.post('/logout', logout)
rutas.get('/me', autenticacion, me)

export default rutas
