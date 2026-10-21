/**
 * @fileoverview Titular del access token (en memoria).
 * Permite que la capa de infraestructura adjunte el Bearer token sin acoplarse
 * a la feature de autenticación.
 * @module shared/tokenAcceso
 */

let tokenActual = null

/**
 * Fija el access token en memoria.
 * @param {string | null} token - Token de acceso o null.
 */
export function fijarTokenAcceso(token) {
  tokenActual = token
}

/**
 * Obtiene el access token actual.
 * @returns {string | null} Token de acceso o null.
 */
export function obtenerTokenAcceso() {
  return tokenActual
}
