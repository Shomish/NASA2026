/**
 * @fileoverview Migraciones ligeras del esquema (ALTER TABLE) para el desarrollo.
 * `sequelize.sync()` no altera columnas ni ENUMs de tablas existentes, así que los
 * cambios de esquema sobre tablas ya creadas se aplican aquí de forma idempotente.
 * En producción se usarán migraciones Sequelize versionadas (cli).
 * @module server/db/migraciones
 */

import { sequelize } from './conexion.js'

/** Nuevos valores del ENUM `registros.tipo`. */
const TIPOS = ['signos_vitales', 'sueno', 'salud_mental', 'radiacion', 'diario', 'glucosa', 'animo', 'ejercicio', 'sintomas_inmunes', 'estado_conductual', 'ambiente']

/**
 * Aplica las migraciones ligeras (idempotentes).
 * @returns {Promise<void>} Promesa.
 */
export async function aplicarMigraciones() {
  // 1. entorno_id en tripulantes (si falta).
  const [columnas] = await sequelize.query("SHOW COLUMNS FROM tripulantes LIKE 'entorno_id'")
  if (columnas.length === 0) {
    await sequelize.query('ALTER TABLE tripulantes ADD COLUMN entorno_id INT UNSIGNED NULL')
  }

  // 2. Amplía el ENUM de tipo en registros (idempotente).
  const enumSql = TIPOS.map((t) => `'${t}'`).join(',')
  await sequelize.query(`ALTER TABLE registros MODIFY tipo ENUM(${enumSql}) NOT NULL`)
}
