/**
 * @fileoverview Servidor Express del Monitor Autónomo de Salud.
 * Punto de entrada: inicializa la base, siembra usuarios y escucha.
 * @module server/index
 */

import { config } from './config.js'
import { logger } from './logger.js'
import { crearAplicacion } from './app.js'
import { sembrarUsuarios } from './auth/repositorioUsuarios.js'
import { inicializarBaseDatos } from './baseDatos.js'

const PUERTO = config.PUERTO
const aplicacion = crearAplicacion()

inicializarBaseDatos()
  .then(() => sembrarUsuarios(config.DEMO_MODE === 'true'))
  .then(() => {
    aplicacion.listen(PUERTO, () => {
      logger.info({ puerto: PUERTO, demoMode: config.DEMO_MODE }, 'Backend Express operativo')
    })
  })
  .catch((error) => {
    logger.error({ err: error }, 'Error al inicializar')
    process.exit(1)
  })
