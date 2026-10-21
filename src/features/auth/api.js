/**
 * @fileoverview Cliente de API de autenticación (frontend).
 * Todas las llamadas usan credentials:'include' para enviar la cookie httpOnly.
 * @module features/auth/api
 */

/** Base de la API versionada. */
const BASE = import.meta.env.VITE_API_URL || '/api/v1'

/**
 * Inicia sesión.
 * @param {string} username - Usuario.
 * @param {string} contrasena - Contraseña.
 * @returns {Promise<{accessToken: string, usuario: object}>} Sesión.
 */
export async function apiLogin(username, contrasena) {
  const respuesta = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, contrasena }),
  })
  const datos = await respuesta.json()
  if (!respuesta.ok) throw new Error(datos.mensaje ?? 'Error al iniciar sesión')
  return datos
}

/**
 * Refresca el access token usando la cookie httpOnly.
 * @returns {Promise<{accessToken: string, usuario: object}>} Nueva sesión.
 */
export async function apiRefresh() {
  const respuesta = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  const datos = await respuesta.json()
  if (!respuesta.ok) throw new Error(datos.mensaje ?? 'Sesión expirada')
  return datos
}

/**
 * Cierra la sesión (revoca el refresh token y limpia la cookie).
 */
export async function apiLogout() {
  await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
}

/**
 * Obtiene el usuario actual.
 * @param {string} accessToken - Token de acceso.
 * @returns {Promise<{usuario: object}>} Usuario.
 */
export async function apiMe(accessToken) {
  const respuesta = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  })
  if (!respuesta.ok) throw new Error('No autenticado')
  return respuesta.json()
}
