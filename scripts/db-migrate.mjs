/**
 * @fileoverview Script de migraciones versionadas (db:migrate).
 * Aplica las migraciones pendientes del esquema (ALTER TABLE idempotentes).
 * @module scripts/db-migrate
 */

import { sequelize } from '../server/db/conexion.js'
import { ejecutarMigraciones } from '../server/db/migraciones.js'

try {
  await sequelize.sync()
  const aplicadas = await ejecutarMigraciones()
  console.log(`Migraciones aplicadas: ${aplicadas}.`)
  await sequelize.close()
  process.exit(0)
} catch (error) {
  console.error(`❌ Error en db:migrate: ${error.message}`)
  process.exit(1)
}
