/**
 * @fileoverview Caché en IndexedDB para los datos del servidor.
 * Solo caché de último recurso (stale-while-revalidate manual): nunca es fuente
 * de verdad. Los datos se versionan y se descartan si son viejos o malformados.
 * @module features/gestion/cache
 */

import { AdaptadorAlmacenamiento } from '../../infraestructura/indice.js'

/** Versión del formato de caché. Incrementar al cambiar la forma de los datos. */
const VERSION_CACHE = 1
/** Vida útil de una entrada de caché (ms). Pasada esta edad se considera vieja. */
const TTL_CACHE_MS = 24 * 60 * 60 * 1000

/** Tienda compartida de caché. */
const almacenamiento = new AdaptadorAlmacenamiento()

/**
 * Sanitiza una entrada de caché. Devuelve null si es inválida o demasiado vieja.
 * @param {unknown} entrada - Entrada leída de IndexedDB.
 * @returns {object | null} Datos válidos o null.
 */
export function sanitizarCache(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null
  if (entrada.version !== VERSION_CACHE) return null
  if (typeof entrada.guardado_en !== 'number') return null
  if (Date.now() - entrada.guardado_en > TTL_CACHE_MS) return null
  return entrada.datos ?? null
}

/**
 * Lee la caché de una colección (mejor esfuerzo; nunca lanza).
 * @param {string} clave - Clave de caché.
 * @returns {Promise<object | null>} Datos válidos o null.
 */
export async function leerCache(clave) {
  try {
    const entradas = await almacenamiento.obtenerTodos(clave)
    return sanitizarCache(entradas?.[0])
  } catch {
    return null
  }
}

/**
 * Escribe la caché de una colección (mejor esfuerzo; nunca lanza).
 * @param {string} clave - Clave de caché.
 * @param {object} datos - Datos a cachear.
 */
export async function escribirCache(clave, datos) {
  try {
    await almacenamiento.guardar(clave, { id: 'ultimo', version: VERSION_CACHE, guardado_en: Date.now(), datos })
  } catch {
    /* La caché no debe romper la experiencia. */
  }
}
