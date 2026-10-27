/**
 * @fileoverview Script de presupuesto de bundle.
 * Verifica que el chunk inicial (index) de la ruta /login no supere 170 KB gzip.
 * Se ejecuta tras el build: `npm run verificar:presupuesto`.
 * @module scripts/verificar-presupuesto
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CARPETA_ASSETS = path.join(__dirname, '..', 'dist', 'assets')

/** Límite máximo del chunk inicial en KB gzip. */
const LIMITE_KB = 170

/**
 * Busca el archivo del chunk inicial (index-*.js).
 * @returns {string | null} Ruta del archivo o null.
 */
function encontrarChunkInicial() {
  const archivos = fs.readdirSync(CARPETA_ASSETS)
  return archivos.find((a) => /^index-.*\.js$/.test(a)) ?? null
}

const archivo = encontrarChunkInicial()
if (!archivo) {
  console.error('No se encontró el chunk inicial (index-*.js). ¿Ejecutaste el build antes?')
  process.exit(1)
}

const contenido = fs.readFileSync(path.join(CARPETA_ASSETS, archivo))
const gzip = zlib.gzipSync(contenido)
const kbGzip = gzip.length / 1024

console.log(`Chunk inicial: ${archivo}`)
console.log(`Tamaño gzip: ${kbGzip.toFixed(2)} KB (límite ${LIMITE_KB} KB)`)

if (kbGzip > LIMITE_KB) {
  console.error(`❌ El chunk inicial supera el límite de ${LIMITE_KB} KB gzip.`)
  process.exit(1)
}
console.log('✅ Presupuesto de bundle cumplido.')
