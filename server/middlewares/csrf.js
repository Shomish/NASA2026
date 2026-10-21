/**
 * @fileoverview Middleware CSRF: verificación del origen (Origin).
 * Junto con SameSite=Strict en la cookie, bloquea solicitudes cross-site
 * que intenten usar el refresh token (defensa en profundidad).
 * @module server/middlewares/csrf
 */

import { config } from '../config.js'

/**
 * Verifica que el header Origin corresponda al propio host o (en desarrollo) a Vite.
 * @param {import('express').Request} req - Petición.
 * @param {import('express').Response} res - Respuesta.
 * @param {import('express').NextFunction} next - Siguiente middleware.
 */
export function verificarOrigen(req, res, next) {
  const origen = req.headers.origin
  // Sin header Origin (p. ej. algunos clientes same-origin) se permite.
  if (!origen) return next()

  let hostOrigen = ''
  try {
    hostOrigen = new URL(origen).host
  } catch {
    return res.status(403).json({ codigo: 'ORIGEN_INVALIDO', mensaje: 'Origen no permitido.' })
  }

  const mismoOrigen = hostOrigen === req.headers.host
  const origenDev = config.NODE_ENV !== 'production' && (hostOrigen === 'localhost:5173' || hostOrigen === '127.0.0.1:5173')

  if (!mismoOrigen && !origenDev) {
    return res.status(403).json({ codigo: 'ORIGEN_INVALIDO', mensaje: 'Origen no permitido.' })
  }
  return next()
}
