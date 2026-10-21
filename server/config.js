/**
 * @fileoverview Configuración validada del servidor (Zod).
 * Carga .env (si existe) y valida las variables de entorno; falla rápido si falta algo.
 * @module server/config
 */

import { z } from 'zod'

// Carga las variables de entorno de `.env` (si existe).
try {
  process.loadEnvFile()
} catch {
  /* Sin .env: se usan las variables del entorno del sistema. */
}

/** Esquema de configuración del servidor. */
const esquemaConfig = z.object({
  PUERTO: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),
  NODE_ENV: z.string().default('development'),
})

/**
 * Resuelve el valor de JWT_SECRET: obligatorio en producción, con un valor de
 * desarrollo (inseguro) solo para facilitar la demo local.
 * @returns {string} Secreto JWT.
 */
function resolverJwtSecret() {
  const esProduccion = process.env.NODE_ENV === 'production'
  const secreto = process.env.JWT_SECRET
  if (!secreto) {
    if (esProduccion) throw new Error('JWT_SECRET es obligatorio en producción.')
    return 'dev-secreto-inseguro-solo-para-desarrollo'
  }
  return secreto
}

/**
 * Resuelve el valor de DEMO_MODE: en desarrollo por defecto es true (para la demo),
 * en producción es false a menos que se fije explícitamente.
 * @returns {string} 'true' o 'false'.
 */
function resolverDemoMode() {
  const esProduccion = process.env.NODE_ENV === 'production'
  return process.env.DEMO_MODE ?? (esProduccion ? 'false' : 'true')
}

/**
 * Carga y valida la configuración del servidor.
 * @returns {{PUERTO: number, JWT_SECRET: string, DEMO_MODE: string, NODE_ENV: string}} Configuración validada.
 */
function cargarConfig() {
  const resultado = esquemaConfig.safeParse({
    PUERTO: process.env.PUERTO,
    JWT_SECRET: resolverJwtSecret(),
    DEMO_MODE: resolverDemoMode(),
    NODE_ENV: process.env.NODE_ENV,
  })
  if (!resultado.success) {
    throw new Error(`Configuración inválida: ${resultado.error.message}`)
  }
  return resultado.data
}

export const config = cargarConfig()
