/**
 * @fileoverview Script de reinicio de la base de datos (db:reset, SOLO desarrollo).
 * Elimina y recrea las tablas y vuelve a sembrar.
 * @module scripts/db-reset
 */

import { sequelize } from '../server/db/conexion.js'
import { sembrar } from '../server/db/seed.js'

try {
  await sequelize.sync({ force: true })
  console.log('Tablas recreadas.')
  await sembrar()
  console.log('Datos sembrados.')
  await sequelize.close()
  process.exit(0)
} catch (error) {
  console.error(`❌ Error en db:reset: ${error.message}`)
  process.exit(1)
}
