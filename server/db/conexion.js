/**
 * @fileoverview Conexión a MySQL con Sequelize.
 * El motor de datos pasa de sql.js (en memoria) a MySQL. ADR-0010.
 * @module server/db/conexion
 */

import { Sequelize } from 'sequelize'
import { config } from '../config.js'

/** Selecciona la base de test en el entorno de pruebas. */
const nombreBase = config.NODE_ENV === 'test' ? config.DB_NAME_TEST : config.DB_NAME

/**
 * Instancia de Sequelize.
 */
export const sequelize = new Sequelize(nombreBase, config.DB_USER, config.DB_PASSWORD, {
  host: config.DB_HOST,
  port: config.DB_PORT,
  dialect: 'mysql',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
  },
})

/**
 * Verifica la conexión y lanza un error claro si MySQL no responde.
 * @returns {Promise<void>} Promesa.
 */
export async function verificarConexion() {
  try {
    await sequelize.authenticate()
  } catch (error) {
    throw new Error(
      `No se pudo conectar a MySQL en ${config.DB_HOST}:${config.DB_PORT} (base ${nombreBase}). Verifica que MySQL esté corriendo y las variables DB_* en .env. Error: ${error.message}`,
    )
  }
}
