/**
 * @fileoverview Migraciones versionadas (idempotentes) del esquema.
 * Cada cambio de esquema sobre tablas existentes es una migración numerada que se
 * registra en la tabla `migraciones` (nombre + fecha de aplicación). El servidor
 * NO aplica ALTER TABLE al arrancar en producción (se usa `npm run db:migrate`).
 * @module server/db/migraciones
 */

import { sequelize } from './conexion.js'
import { modelos } from './modelos.js'

const { Migracion } = modelos

/** Nuevos valores del ENUM `registros.tipo`. */
const TIPOS = ['signos_vitales', 'sueno', 'salud_mental', 'radiacion', 'diario', 'glucosa', 'animo', 'ejercicio', 'sintomas_inmunes', 'estado_conductual', 'ambiente']

/** Lista ordenada de migraciones (idempotentes). */
const MIGRACIONES = [
  {
    nombre: '001_entorno_id_tripulantes',
    up: async () => {
      const [columnas] = await sequelize.query("SHOW COLUMNS FROM tripulantes LIKE 'entorno_id'")
      if (columnas.length === 0) {
        await sequelize.query('ALTER TABLE tripulantes ADD COLUMN entorno_id INT UNSIGNED NULL')
      }
    },
  },
  {
    nombre: '002_tipos_registro',
    up: async () => {
      const enumSql = TIPOS.map((t) => `'${t}'`).join(',')
      await sequelize.query(`ALTER TABLE registros MODIFY tipo ENUM(${enumSql}) NOT NULL`)
    },
  },
  {
    nombre: '003_tripulante_id_nullable',
    up: async () => {
      await sequelize.query('ALTER TABLE alertas MODIFY tripulante_id INT UNSIGNED NULL')
      await sequelize.query('ALTER TABLE conversaciones_ia MODIFY tripulante_id INT UNSIGNED NULL')
      await sequelize.query('ALTER TABLE consentimientos_ia MODIFY tripulante_id INT UNSIGNED NULL')
    },
  },
  {
    nombre: '004_configuracion_ia_clave_api',
    up: async () => {
      const [columnas] = await sequelize.query("SHOW COLUMNS FROM configuracion_ia LIKE 'clave_api'")
      if (columnas.length === 0) {
        await sequelize.query('ALTER TABLE configuracion_ia ADD COLUMN clave_api VARCHAR(255) NULL')
      }
      const [urlBase] = await sequelize.query("SHOW COLUMNS FROM configuracion_ia LIKE 'url_base'")
      if (urlBase.length === 0) {
        await sequelize.query('ALTER TABLE configuracion_ia ADD COLUMN url_base VARCHAR(255) NULL')
      }
    },
  },
  {
    nombre: '005_activar_ia_si_clave',
    up: async () => {
      const tieneClave = Boolean(process.env.GEMINI_API_KEY || process.env.IA_API_KEY)
      if (tieneClave) {
        await sequelize.query("UPDATE configuracion_ia SET activo = 1 WHERE proveedor = 'gemini' AND activo = 0")
      }
      const [prov] = await sequelize.query("SHOW COLUMNS FROM configuracion_ia LIKE 'proveedor_activo'")
      if (prov.length === 0) {
        await sequelize.query("ALTER TABLE configuracion_ia ADD COLUMN proveedor_activo ENUM('gemini','openai') NOT NULL DEFAULT 'gemini'")
      }
      // Si hay URL base de OpenRouter configurada, usa ese proveedor.
      if (process.env.IA_URL_BASE) {
        await sequelize.query("UPDATE configuracion_ia SET proveedor_activo = 'openai' WHERE proveedor = 'gemini'")
      }
    },
  },
]

/**
 * Ejecuta las migraciones pendientes y las registra en la tabla `migraciones`.
 * @returns {Promise<number>} Cantidad de migraciones aplicadas.
 */
export async function ejecutarMigraciones() {
  const aplicadas = await Migracion.findAll({ attributes: ['nombre'] })
  const aplicadasSet = new Set(aplicadas.map((m) => m.nombre))
  let aplicadasAhora = 0
  for (const migracion of MIGRACIONES) {
    if (aplicadasSet.has(migracion.nombre)) continue
    await migracion.up()
    await Migracion.create({ nombre: migracion.nombre, fecha_aplicacion: new Date() })
    aplicadasAhora += 1
  }
  return aplicadasAhora
}

/** Retrocompatibilidad con llamadas anteriores. */
export async function aplicarMigraciones() {
  return ejecutarMigraciones()
}
