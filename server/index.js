/**
 * @fileoverview Servidor Express del Monitor Autónomo de Salud.
 * Conecta a MySQL (fail-fast) y sirve el frontend y la API.
 * @module server/index
 */

import { config } from './config.js'
import { logger } from './logger.js'
import { crearAplicacion } from './app.js'
import { verificarConexion, sequelize } from './db/conexion.js'
import { sembrar } from './db/seed.js'
import { inicializarBaseDatos } from './baseDatos.js'

const PUERTO = config.PUERTO
const aplicacion = crearAplicacion()

async function arrancar() {
  // 1. MySQL (motor principal). Falla rápido si no responde en el puerto configurado.
  await verificarConexion()
  await sequelize.sync()
  logger.info({ host: config.DB_HOST, port: config.DB_PORT, base: config.DB_NAME }, 'MySQL conectado y esquema sincronizado')

  // 2. Siembra de datos iniciales.
  await sembrar()

  // 3. Base sql.js (legacy, para rutas de datos previas a la migración).
  await inicializarBaseDatos()

  aplicacion.listen(PUERTO, () => {
    logger.info({ puerto: PUERTO, demoMode: config.DEMO_MODE }, 'Backend Express operativo')
  })
}

arrancar().catch((error) => {
  logger.error({ err: error }, 'Error al inicializar')
  console.error(`❌ ${error.message}`)
  process.exit(1)
})
