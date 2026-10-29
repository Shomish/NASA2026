/**
 * @fileoverview Script de verificación de colores a mano.
 * Busca colores hexadecimales fijos en el código del frontend (fuera de los archivos
 * de tema) y falla si encuentra alguno. `npm run verificar:colores`.
 * Excepciones documentadas: ErrorBoundary y SplashCarga (se renderizan antes/fuera
 * del proveedor de tema) y ParticulasEstelares (color del efecto visual).
 * @module scripts/verificar-colores
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.join(__dirname, '..')

/** Directorio a inspeccionar. */
const DIRECTORIO = 'src'

/** Archivos permitidos con colores fijos (fuera del proveedor de tema / efecto visual). */
const EXCLUIDOS = new Set([
  path.normalize('src/presentacion/componentes/ErrorBoundary.jsx'),
  path.normalize('src/presentacion/componentes/SplashCarga.jsx'),
  path.normalize('src/features/auth/ParticulasEstelares.jsx'),
])

/** Carpetas permitidas (los tokens de tema pueden llevar hex). */
const CARPETAS_PERMITIDAS = [path.normalize('src/presentacion/sistema/temas')]

/** Patrón de color hexadecimal. */
const REGEX_HEX = /#[0-9a-fA-F]{3,8}\b/

/** Extensiones de archivo a inspeccionar. */
const EXTENSIONES = new Set(['.js', '.jsx'])

let encontrados = 0

/**
 * Inspecciona un archivo en busca de colores hexadecimales.
 * @param {string} ruta - Ruta absoluta del archivo.
 */
function inspeccionarArchivo(ruta) {
  const relativa = path.relative(RAIZ, ruta)
  const contenido = fs.readFileSync(ruta, 'utf8')
  const lineas = contenido.split('\n')
  lineas.forEach((linea, i) => {
    if (REGEX_HEX.test(linea)) {
      console.error(`❌ Color hexadecimal fijo en ${relativa}:${i + 1} → ${linea.trim()}`)
      encontrados += 1
    }
  })
}

/**
 * Recorre recursivamente un directorio.
 * @param {string} directorio - Ruta absoluta.
 * @param {string} relativa - Ruta relativa para exclusiones.
 */
function recorrer(directorio, relativa) {
  for (const carpeta of CARPETAS_PERMITIDAS) {
    if (path.normalize(relativa).startsWith(carpeta)) return
  }
  for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
    const ruta = path.join(directorio, entrada.name)
    const rel = path.join(relativa, entrada.name)
    if (entrada.isDirectory()) {
      recorrer(ruta, rel)
    } else if (EXTENSIONES.has(path.extname(entrada.name)) && !entrada.name.endsWith('.test.js') && !entrada.name.endsWith('.test.jsx')) {
      if (!EXCLUIDOS.has(path.normalize(rel))) inspeccionarArchivo(ruta)
    }
  }
}

recorrer(path.join(RAIZ, DIRECTORIO), DIRECTORIO)

if (encontrados > 0) {
  console.error(`❌ Se encontraron ${encontrados} colores hexadecimales fijos. Usa tokens del tema.`)
  process.exit(1)
}
console.log('✅ No se detectaron colores hexadecimales fijos fuera de los temas.')
