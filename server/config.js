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
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3313),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default('root'),
  DB_NAME: z.string().default('ayni_health'),
  DB_NAME_TEST: z.string().default('ayni_health_test'),
})

/**
 * Valida la configuración a partir de un entorno dado.
 * Lanza un Error si la configuración es inválida o insegura.
 * @param {{PUERTO?: string|number, JWT_SECRET?: string, DEMO_MODE?: string, NODE_ENV?: string, DB_HOST?: string, DB_PORT?: string|number, DB_USER?: string, DB_PASSWORD?: string, DB_NAME?: string, DB_NAME_TEST?: string}} entorno - Variables de entorno.
 * @returns {object} Configuración validada.
 */
export function validarConfig(entorno) {
  const esProduccion = entorno.NODE_ENV === 'production'

  // En producción JWT_SECRET es obligatorio.
  const jwtSecret = entorno.JWT_SECRET || ''
  if (esProduccion && !jwtSecret) {
    throw new Error('JWT_SECRET es obligatorio en producción.')
  }
  // En desarrollo, un secreto por defecto solo para la demo local.
  const secretoEfectivo = jwtSecret || (esProduccion ? '' : 'dev-secreto-inseguro-solo-para-desarrollo')

  const resultado = esquemaConfig.safeParse({
    PUERTO: entorno.PUERTO,
    JWT_SECRET: secretoEfectivo,
    DEMO_MODE: entorno.DEMO_MODE ?? (esProduccion ? 'false' : 'true'),
    NODE_ENV: entorno.NODE_ENV ?? 'development',
    DB_HOST: entorno.DB_HOST,
    DB_PORT: entorno.DB_PORT,
    DB_USER: entorno.DB_USER,
    DB_PASSWORD: entorno.DB_PASSWORD,
    DB_NAME: entorno.DB_NAME,
    DB_NAME_TEST: entorno.DB_NAME_TEST,
  })
  if (!resultado.success) {
    throw new Error(`Configuración inválida: ${resultado.error.message}`)
  }

  const config = resultado.data
  // En producción el modo demo está prohibido.
  if (config.NODE_ENV === 'production' && config.DEMO_MODE === 'true') {
    throw new Error('DEMO_MODE no puede estar activo en producción.')
  }
  return config
}

/**
 * Configuración cargada desde el entorno del proceso.
 * @type {object}
 */
export const config = validarConfig({
  PUERTO: process.env.PUERTO,
  JWT_SECRET: process.env.JWT_SECRET,
  DEMO_MODE: process.env.DEMO_MODE,
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_NAME_TEST: process.env.DB_NAME_TEST,
})
