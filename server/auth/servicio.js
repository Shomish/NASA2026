/**
 * @fileoverview Servicio de autenticación.
 * Lógica de negocio: login, generación/rotación de tokens y logout.
 * No depende de Express (puro, testeable con Supertest).
 * @module server/auth/servicio
 */

import { compare, hash } from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import {
  encontrarPorUsername,
  buscarPorId,
  guardarRefreshToken,
  estadoRefresh,
  usuarioDeRefresh,
  revocarRefreshToken,
  revocarTodosDeUsuario,
  hashearToken,
} from './repositorioUsuarios.js'

/** Vida del access token (15 minutos). */
const ACCESO_EXPIRA = '15m'
/** Vida del refresh token (7 días). */
const REFRESH_EXPIRA_MS = 7 * 24 * 3600 * 1000

/**
 * Genera el access token JWT (vida corta).
 * @param {object} usuario - Usuario.
 * @returns {string} JWT firmado.
 */
export function generarAccessToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol }, config.JWT_SECRET, { expiresIn: ACCESO_EXPIRA })
}

/**
 * Genera un refresh token opaco y lo registra (hasheado) en el repositorio.
 * @param {string} usuarioId - Id del usuario.
 * @returns {string} Refresh token en claro (para la cookie).
 */
function generarRefreshToken(usuarioId) {
  const token = randomBytes(32).toString('hex')
  guardarRefreshToken(hashearToken(token), usuarioId)
  return token
}

/**
 * Datos públicos del usuario (sin hash ni datos sensibles).
 * @param {object} usuario - Usuario.
 * @returns {{id: string, username: string, rol: string, nombre: string}} Usuario público.
 */
function usuarioPublico(usuario) {
  return { id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre }
}

/**
 * Hash dummy para igualar el tiempo de respuesta ante usuario inexistente (anti-enumeración).
 * @returns {Promise<string>} Hash bcrypt de un valor fijo.
 */
function hashDummy() {
  return hash('contrasena-dummy-inexistente', 12)
}

/**
 * Inicia sesión. Devuelve null si las credenciales son inválidas (mensaje genérico,
 * sin revelar si falló usuario o contraseña).
 * @param {string} username - Nombre de usuario.
 * @param {string} contrasena - Contraseña.
 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object} | null>} Sesión o null.
 */
export async function iniciarSesion(username, contrasena) {
  const usuario = encontrarPorUsername(username)
  const hashComparar = usuario ? usuario.hashContrasena : await hashDummy()
  const valida = await compare(contrasena, hashComparar)
  if (!usuario || !valida) return null

  const accessToken = generarAccessToken(usuario)
  const refreshToken = generarRefreshToken(usuario.id)
  return { accessToken, refreshToken, usuario: usuarioPublico(usuario) }
}

/**
 * Rota el refresh token: valida el actual, lo revoca y emite uno nuevo.
 * Si el token ya fue usado (reutilización), revoca toda la familia del usuario.
 * @param {string} refreshToken - Refresh token en claro.
 * @returns {{accessToken: string, refreshToken: string, usuario: object} | null} Nueva sesión o null.
 */
export function rotarRefreshToken(refreshToken) {
  const tokenHash = hashearToken(refreshToken)
  const estado = estadoRefresh(tokenHash)

  if (estado === 'inexistente') return null

  if (estado === 'reutilizado') {
    // Detección de reutilización: revocar toda la familia de tokens del usuario.
    const usuarioId = usuarioDeRefresh(tokenHash)
    if (usuarioId) revocarTodosDeUsuario(usuarioId)
    return null
  }

  const usuarioId = usuarioDeRefresh(tokenHash)
  const usuario = buscarPorId(usuarioId)
  if (!usuario) return null

  // Rotación: revocar el refresh actual y emitir uno nuevo.
  revocarRefreshToken(tokenHash)
  const nuevoAccess = generarAccessToken(usuario)
  const nuevoRefresh = generarRefreshToken(usuario.id)
  return { accessToken: nuevoAccess, refreshToken: nuevoRefresh, usuario: usuarioPublico(usuario) }
}

/**
 * Cierra la sesión revocando el refresh token enviado.
 * @param {string} refreshToken - Refresh token en claro.
 */
export function cerrarSesion(refreshToken) {
  if (refreshToken) revocarRefreshToken(hashearToken(refreshToken))
}

/**
 * Revoca todos los refresh tokens de un usuario (logout global).
 * @param {string} usuarioId - Id del usuario.
 */
export function revocarSesionesDeUsuario(usuarioId) {
  revocarTodosDeUsuario(usuarioId)
}

/** Vida del refresh token en milisegundos (para la cookie). */
export const TIEMPO_REFRESH_MS = REFRESH_EXPIRA_MS
