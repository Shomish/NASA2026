/**
 * @fileoverview Logger estructurado (pino).
 * No registra contraseñas, tokens ni datos personales.
 * @module server/logger
 */

import pino from 'pino'

/**
 * Instancia del logger de la aplicación.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['password', 'contrasena', 'token', 'refreshToken', 'authorization', 'cookie'],
    censor: '[REDACTADO]',
  },
})
