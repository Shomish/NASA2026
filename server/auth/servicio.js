/**
 * @fileoverview Servicio de autenticación (contra MySQL).
 * Login, generación/rotación de tokens y logout. No depende de Express.
 * @module server/auth/servicio
 */

import { compare, hash } from 'bcrypt'
import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import {
  encontrarPorEmail,
  buscarPorId,
  crearUsuario,
  guardarSesionRefresh,
  encontrarSesionRefresh,
  revocarSesionRefresh,
  revocarFamilia,
  hashearToken,
} from './repositorioUsuarios.js'

/** Vida del access token (15 minutos). */
const ACCESO_EXPIRA = '15m'
/** Vida del refresh token (7 días). */
const REFRESH_EXPIRA_MS = 7 * 24 * 3600 * 1000
/** Coste de bcrypt (ver ADR-0006). */
const COSTE_BCRYPT = 12

/**
 * Genera el access token JWT.
 * @param {object} usuario - Usuario.
 * @returns {string} JWT firmado.
 */
export function generarAccessToken(usuario) {
  return jwt.sign({ sub: String(usuario.id), rol: usuario.rol }, config.JWT_SECRET, { expiresIn: ACCESO_EXPIRA })
}

/**
 * Genera un refresh token y guarda su sesión (hash + familia).
 * @param {number} usuarioId - Id del usuario.
 * @param {string} [familia] - Familia a la que pertenece (para rotación).
 * @returns {Promise<{token: string, familia: string}>} Token en claro y familia.
 */
async function generarRefreshToken(usuarioId, familia = null) {
  const token = randomBytes(32).toString('hex')
  const familiaToken = familia ?? randomBytes(16).toString('hex')
  await guardarSesionRefresh({
    usuario_id: usuarioId,
    token_hash: hashearToken(token),
    familia: familiaToken,
    expira_en: new Date(Date.now() + REFRESH_EXPIRA_MS),
  })
  return { token, familia: familiaToken }
}

/**
 * Datos públicos del usuario.
 * @param {object} usuario - Usuario.
 * @returns {object} Usuario público.
 */
function usuarioPublico(usuario) {
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
}

/**
 * Hash dummy para igualar el tiempo ante email inexistente.
 * @returns {Promise<string>} Hash.
 */
function hashDummy() {
  return hash('contrasena-dummy-inexistente', COSTE_BCRYPT)
}

/**
 * Inicia sesión. Devuelve null si las credenciales son inválidas.
 * @param {string} email - Email.
 * @param {string} contrasena - Contraseña.
 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object} | null>} Sesión o null.
 */
export async function iniciarSesion(email, contrasena) {
  const usuario = await encontrarPorEmail(email)
  const hashComparar = usuario ? usuario.password : await hashDummy()
  const valida = await compare(contrasena, hashComparar)
  if (!usuario || !valida) return null

  const accessToken = generarAccessToken(usuario)
  const { token: refreshToken } = await generarRefreshToken(usuario.id)
  return { accessToken, refreshToken, usuario: usuarioPublico(usuario) }
}

/**
 * Registra un usuario (rol tripulante por defecto) con su perfil.
 * @param {object} datos - Datos del registro.
 * @returns {Promise<object>} Usuario creado.
 */
export async function registrarUsuario(datos) {
  const hashContrasena = await hash(datos.contrasena, COSTE_BCRYPT)
  return crearUsuario({
    nombre: datos.nombre,
    email: datos.email,
    password: hashContrasena,
    rol: 'tripulante',
  })
}

/**
 * Rota el refresh token. Reutilización revoca la familia.
 * @param {string} refreshToken - Refresh token en claro.
 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object} | null>} Nueva sesión o null.
 */
export async function rotarRefreshToken(refreshToken) {
  const tokenHash = hashearToken(refreshToken)
  const sesion = await encontrarSesionRefresh(tokenHash)
  if (!sesion) return null

  // Reutilización: token ya revocado → revocar toda la familia.
  if (sesion.revocado_en) {
    await revocarFamilia(sesion.familia)
    return null
  }

  const usuario = await buscarPorId(sesion.usuario_id)
  if (!usuario) return null

  await revocarSesionRefresh(sesion.id)
  const accessToken = generarAccessToken(usuario)
  const { token: nuevoRefresh } = await generarRefreshToken(usuario.id, sesion.familia)
  return { accessToken, refreshToken: nuevoRefresh, usuario: usuarioPublico(usuario) }
}

/**
 * Cierra la sesión revocando el refresh token.
 * @param {string} refreshToken - Refresh token en claro.
 * @returns {Promise<void>} Promesa.
 */
export async function cerrarSesion(refreshToken) {
  if (!refreshToken) return
  const sesion = await encontrarSesionRefresh(hashearToken(refreshToken))
  if (sesion) await revocarSesionRefresh(sesion.id)
}

/** Vida del refresh token en ms (para la cookie). */
export const TIEMPO_REFRESH_MS = REFRESH_EXPIRA_MS
