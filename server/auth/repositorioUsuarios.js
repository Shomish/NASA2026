/**
 * @fileoverview Repositorio de usuarios y refresh tokens.
 * Oculta el motor de almacenamiento: hoy es en memoria (Fase 10 → PostgreSQL).
 * @module server/auth/repositorioUsuarios
 */

import { createHash } from 'node:crypto'
import { hash } from 'bcryptjs'

/** Coste de bcrypt (ver ADR-0006). */
const COSTE_BCRYPT = 12

/** @type {Map<string, {id: string, username: string, hashContrasena: string, rol: string, nombre: string}>} */
const usuarios = new Map()

/** @type {Map<string, {usuarioId: string, revocado: boolean}>} */
const refreshTokens = new Map()

/**
 * Siembra el usuario de demostración (admin/admin123) cuando el modo demo está activo.
 * @param {boolean} demoMode - Si el modo demo está habilitado.
 * @returns {Promise<void>} Promesa.
 */
export async function sembrarUsuarios(demoMode) {
  if (!demoMode || usuarios.has('admin')) return
  const hashContrasena = await hash('admin123', COSTE_BCRYPT)
  usuarios.set('admin', {
    id: '1',
    username: 'admin',
    hashContrasena,
    rol: 'administrador',
    nombre: 'Administrador',
  })
}

/**
 * Busca un usuario por nombre de usuario.
 * @param {string} username - Nombre de usuario.
 * @returns {object | null} Usuario o null.
 */
export function encontrarPorUsername(username) {
  return usuarios.get(username) ?? null
}

/**
 * Busca un usuario por su id.
 * @param {string} id - Identificador del usuario.
 * @returns {object | null} Usuario o null.
 */
export function buscarPorId(id) {
  for (const usuario of usuarios.values()) {
    if (usuario.id === id) return usuario
  }
  return null
}

/**
 * Calcula el hash SHA-256 de un token (para no guardar el token en claro).
 * @param {string} token - Token.
 * @returns {string} Hash del token.
 */
export function hashearToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Guarda un refresh token (hasheado) asociado a un usuario.
 * @param {string} tokenHash - Hash del refresh token.
 * @param {string} usuarioId - Identificador del usuario.
 */
export function guardarRefreshToken(tokenHash, usuarioId) {
  refreshTokens.set(tokenHash, { usuarioId, revocado: false })
}

/**
 * Indica si un refresh token (hasheado) sigue siendo válido.
 * @param {string} tokenHash - Hash del refresh token.
 * @returns {boolean} Verdadero si es válido y no revocado.
 */
export function esRefreshValido(tokenHash) {
  const registro = refreshTokens.get(tokenHash)
  return Boolean(registro && !registro.revocado)
}

/**
 * Estado de un refresh token: valido, reutilizado (revocado) o inexistente.
 * @param {string} tokenHash - Hash del refresh token.
 * @returns {'valido' | 'reutilizado' | 'inexistente'} Estado.
 */
export function estadoRefresh(tokenHash) {
  const registro = refreshTokens.get(tokenHash)
  if (!registro) return 'inexistente'
  return registro.revocado ? 'reutilizado' : 'valido'
}

/**
 * Obtiene el id de usuario asociado a un refresh token.
 * @param {string} tokenHash - Hash del refresh token.
 * @returns {string | null} Id del usuario o null.
 */
export function usuarioDeRefresh(tokenHash) {
  return refreshTokens.get(tokenHash)?.usuarioId ?? null
}

/**
 * Revoca un refresh token (rotación).
 * @param {string} tokenHash - Hash del refresh token.
 */
export function revocarRefreshToken(tokenHash) {
  const registro = refreshTokens.get(tokenHash)
  if (registro) registro.revocado = true
}

/**
 * Revoca todos los refresh tokens de un usuario (logout).
 * @param {string} usuarioId - Identificador del usuario.
 */
export function revocarTodosDeUsuario(usuarioId) {
  for (const registro of refreshTokens.values()) {
    if (registro.usuarioId === usuarioId) registro.revocado = true
  }
}
