/**
 * @fileoverview Script de importación desde JSON (db:importar).
 * Lee el archivo JSON exportado por el cliente (IndexedDB) y lo carga en MySQL.
 * Modo dry-run y reporte de lo importado/descartado.
 * @module scripts/db-importar
 */

import fs from 'node:fs'
import { sequelize } from '../server/db/conexion.js'
import { modelos } from '../server/db/modelos.js'

const RUTA_JSON = process.argv[2]
const DRY_RUN = process.argv.includes('--dry-run')

if (!RUTA_JSON) {
  console.error('Uso: npm run db:importar -- <ruta/al/archivo.json> [--dry-run]')
  process.exit(1)
}

const { Tripulante, Registro, SignoVital } = modelos

let importados = 0
let descartados = 0

try {
  const datos = JSON.parse(fs.readFileSync(RUTA_JSON, 'utf8'))

  if (DRY_RUN) {
    console.log('(dry-run) Simulación de importación.')
  }

  for (const persona of datos.tripulacion ?? []) {
    if (!persona.id || !persona.nombre) {
      descartados += 1
      continue
    }
    if (!DRY_RUN) {
      await Tripulante.findOrCreate({
        where: { nombre: persona.nombre },
        defaults: {
          nombre: persona.nombre,
          cargo: persona.rol,
          edad: persona.edad,
          peso_kg: persona.pesoKg,
          altura_cm: persona.alturaCm,
          dia_mision: persona.diaMision,
          objetivo: persona.objetivoSalud,
          alergias: persona.alergias,
        },
      })
    }
    importados += 1
  }

  console.log(`Importados: ${importados} · Descartados: ${descartados}${DRY_RUN ? ' (dry-run)' : ''}`)
  await sequelize.close()
  process.exit(0)
} catch (error) {
  console.error(`❌ Error al importar: ${error.message}`)
  process.exit(1)
}
