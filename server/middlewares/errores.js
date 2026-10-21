/**
 * @fileoverview Middleware de manejo centralizado de errores.
 * @module server/middlewares/errores
 */

import { logger } from '../logger.js'

/**
 * Maneja errores no capturados sin filtrar stack traces al cliente.
 * @param {Error} error - Error.
 * @param {import('express').Request} _req - Petición.
 * @param {import('express').Response} res - Respuesta.
 * @param {import('express').NextFunction} _next - Siguiente.
 */
export function manejoErrores(error, _req, res, _next) {
  logger.error({ err: error }, 'Error no controlado')
  return res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
}
