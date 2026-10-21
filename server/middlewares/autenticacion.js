/**
 * @fileoverview Middleware de autenticación.
 * Verifica el JWT de acceso (cabecera Authorization) y adjunta el usuario a req.
 * @module server/middlewares/autenticacion
 */

import jwt from 'jsonwebtoken'
import { config } from '../config.js'

/**
 * Verifica el access token JWT y adjunta `req.usuario`.
 * @param {import('express').Request} req - Petición.
 * @param {import('express').Response} res - Respuesta.
 * @param {import('express').NextFunction} next - Siguiente middleware.
 */
export function autenticacion(req, res, next) {
  const cabecera = req.headers.authorization
  const token = cabecera?.startsWith('Bearer ') ? cabecera.slice(7) : null
  if (!token) {
    return res.status(401).json({ codigo: 'SIN_TOKEN', mensaje: 'No autenticado.' })
  }
  try {
    const payload = jwt.verify(token, config.JWT_SECRET)
    req.usuario = { id: payload.sub, rol: payload.rol }
    return next()
  } catch {
    return res.status(401).json({ codigo: 'TOKEN_INVALIDO', mensaje: 'Token inválido o expirado.' })
  }
}
