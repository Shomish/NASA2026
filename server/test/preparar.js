/**
 * @fileoverview Utilidades de preparación de pruebas contra MySQL.
 * Limpia la base de test, siembra y crea la app.
 * @module server/test/preparar
 */

import { sequelize } from '../db/conexion.js'
import { sembrar } from '../db/seed.js'
import { crearAplicacion } from '../app.js'
import { inicializarBaseDatos } from '../baseDatos.js'

/** Email del administrador demo. */
export const EMAIL_ADMIN = 'admin@ayni.health'
/** Contraseña del administrador demo. */
export const CONTRASENA_ADMIN = 'admin123'

/**
 * Prepara el entorno de prueba: recrea el esquema, siembra y devuelve la app.
 * @returns {Promise<import('express').Express>} Aplicación.
 */
export async function prepararApp() {
  await sequelize.sync({ force: true })
  await sembrar()
  // Base sql.js (legacy) para las rutas de datos previas a la migración.
  await inicializarBaseDatos()
  return crearAplicacion()
}

/**
 * Cierra la conexión a la base al terminar las pruebas.
 * @returns {Promise<void>} Promesa.
 */
export async function cerrarBase() {
  await sequelize.close()
}
