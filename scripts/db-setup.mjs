/**
 * @fileoverview Script de configuración de la base de datos (db:setup).
 * Crea las bases, sincroniza el esquema (dev) y siembra datos.
 * NO usar sync en producción (usar migraciones).
 * @module scripts/db-setup
 */

import mysql from 'mysql2/promise'
import { config } from '../server/config.js'
import { sequelize } from '../server/db/conexion.js'
import { sembrar } from '../server/db/seed.js'
import { aplicarMigraciones } from '../server/db/migraciones.js'
async function crearBases() {
  const conexion = await mysql.createConnection({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
  })
  for (const nombre of [config.DB_NAME, config.DB_NAME_TEST]) {
    await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  }
  await conexion.end()
}

try {
  await crearBases()
  console.log('Bases creadas.')
  await sequelize.sync()
  await aplicarMigraciones()
  console.log('Esquema sincronizado (36 tablas).')
  await sembrar()
  console.log('Datos sembrados.')
  await sequelize.close()
  process.exit(0)
} catch (error) {
  console.error(`❌ Error en db:setup: ${error.message}`)
  process.exit(1)
}
