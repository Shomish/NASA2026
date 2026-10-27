/**
 * @fileoverview Script de verificación de secretos.
 * Busca patrones de claves de API en el código versionado y en dist/.
 * Falla si detecta alguno. `npm run verificar:secretos`.
 * @module scripts/verificar-secretos
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.join(__dirname, '..')

/** Directorios a inspeccionar (código versionado y build). */
const DIRECTORIOS = ['src', 'server', 'shared', 'scripts', 'docs', 'e2e', 'dist']

/** Patrones de claves de API / secretos. */
const PATRONES = [
  { nombre: 'Gemini (AIza)', regex: /AIza[0-9A-Za-z_-]{20,}/ },
  { nombre: 'OpenAI (sk-)', regex: /sk-[0-9A-Za-z]{20,}/ },
  { nombre: 'GitHub (ghp_)', regex: /ghp_[0-9A-Za-z]{20,}/ },
  { nombre: 'AWS (AKIA)', regex: /AKIA[0-9A-Z]{16}/ },
  { nombre: 'Clave privada', regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
]

/** Extensiones de archivo de texto a inspeccionar. */
const EXTENSIONES = new Set(['.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.html', '.css', '.sql', '.yml', '.yaml', '.mjs'])

let encontrados = 0

/**
 * Inspecciona un archivo en busca de patrones de secretos.
 * @param {string} ruta - Ruta del archivo.
 */
function inspeccionarArchivo(ruta) {
  const contenido = fs.readFileSync(ruta, 'utf8')
  for (const patron of PATRONES) {
    if (patron.regex.test(contenido)) {
      console.error(`❌ Secreto detectado (${patron.nombre}) en: ${ruta}`)
      encontrados += 1
    }
  }
}

/**
 * Recorre recursivamente un directorio inspeccionando archivos de texto.
 * @param {string} directorio - Ruta del directorio.
 */
function recorrer(directorio) {
  const rutaCompleta = path.join(RAIZ, directorio)
  if (!fs.existsSync(rutaCompleta)) return
  for (const entrada of fs.readdirSync(rutaCompleta, { withFileTypes: true })) {
    const ruta = path.join(rutaCompleta, entrada.name)
    if (entrada.isDirectory()) {
      recorrer(path.join(directorio, entrada.name))
    } else if (EXTENSIONES.has(path.extname(entrada.name))) {
      try {
        inspeccionarArchivo(ruta)
      } catch {
        /* Archivo binario o ilegible. */
      }
    }
  }
}

for (const directorio of DIRECTORIOS) {
  recorrer(directorio)
}

if (encontrados > 0) {
  console.error(`❌ Se encontraron ${encontrados} secretos. Revisa y elimínalos.`)
  process.exit(1)
}
console.log('✅ No se detectaron secretos en el código ni en dist/.')
