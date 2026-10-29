/**
 * @fileoverview Repositorio de usuarios y sesiones contra MySQL (Sequelize).
 * Oculta Sequelize a los servicios. Sustituye el repositorio en memoria.
 * @module server/auth/repositorioUsuarios
 */

import { createHash } from 'node:crypto'
import { modelos } from '../db/modelos.js'

const { Usuario, SesionRefresh } = modelos

/**
 * Busca un usuario por email.
 * @param {string} email - Email del usuario.
 * @returns {Promise<object | null>} Usuario o null.
 */
export async function encontrarPorEmail(email) {
  return Usuario.findOne({ where: { email } })
}

/**
 * Busca un usuario por id.
 * @param {number} id - Id del usuario.
 * @returns {Promise<object | null>} Usuario o null.
 */
export async function buscarPorId(id) {
  return Usuario.findByPk(id)
}

/**
 * Crea un usuario.
 * @param {object} datos - Datos del usuario.
 * @returns {Promise<object>} Usuario creado.
 */
export async function crearUsuario(datos) {
  return Usuario.create(datos)
}

/**
 * Registra un intento de login fallido de forma persistente.
 * Al alcanzar `maxIntentos` bloquea la cuenta (`bloqueado_hasta`) y reinicia el
 * contador. Si el email no existe no hace nada (anti-enumeración y anti-DoS).
 * @param {string} email - Email del usuario.
 * @param {number} maxIntentos - Intentos máximos antes de bloquear.
 * @param {number} bloqueoMs - Duración del bloqueo en milisegundos.
 * @returns {Promise<void>} Promesa.
 */
export async function registrarIntentoFallido(email, maxIntentos, bloqueoMs) {
  const usuario = await Usuario.findOne({ where: { email } })
  if (!usuario) return
  const intentos = (usuario.intentos_fallidos ?? 0) + 1
  if (intentos >= maxIntentos) {
    await usuario.update({ intentos_fallidos: 0, bloqueado_hasta: new Date(Date.now() + bloqueoMs) })
  } else {
    await usuario.update({ intentos_fallidos: intentos })
  }
}

/**
 * Limpia los intentos fallidos y el bloqueo de un usuario (login correcto).
 * @param {string} email - Email del usuario.
 * @returns {Promise<void>} Promesa.
 */
export async function limpiarIntentosFallidos(email) {
  await Usuario.update({ intentos_fallidos: 0, bloqueado_hasta: null }, { where: { email } })
}

/**
 * Lista todos los usuarios (sin la contraseña).
 * @returns {Promise<object[]>} Usuarios.
 */
export async function listarUsuarios() {
  const usuarios = await Usuario.findAll({ attributes: ['id', 'nombre', 'email', 'rol', 'activo'] })
  return usuarios.map((u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo }))
}

/**
 * Calcula el hash SHA-256 de un token.
 * @param {string} token - Token.
 * @returns {string} Hash.
 */
export function hashearToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Guarda una sesión de refresh token.
 * @param {object} datos - Datos de la sesión.
 * @returns {Promise<object>} Sesión.
 */
export async function guardarSesionRefresh(datos) {
  return SesionRefresh.create(datos)
}

/**
 * Busca una sesión de refresh por hash de token.
 * @param {string} tokenHash - Hash del token.
 * @returns {Promise<object | null>} Sesión o null.
 */
export async function encontrarSesionRefresh(tokenHash) {
  return SesionRefresh.findOne({ where: { token_hash: tokenHash } })
}

/**
 * Revoca una sesión de refresh.
 * @param {number} id - Id de la sesión.
 * @returns {Promise<void>} Promesa.
 */
export async function revocarSesionRefresh(id) {
  await SesionRefresh.update({ revocado_en: new Date() }, { where: { id } })
}

/**
 * Revoca todas las sesiones de una familia (reutilización detectada).
 * @param {string} familia - Identificador de familia.
 * @returns {Promise<void>} Promesa.
 */
export async function revocarFamilia(familia) {
  await SesionRefresh.update({ revocado_en: new Date() }, { where: { familia, revocado_en: null } })
}

/**
 * Revoca todas las sesiones de un usuario (logout global).
 * @param {number} usuarioId - Id del usuario.
 * @returns {Promise<void>} Promesa.
 */
export async function revocarTodasDeUsuario(usuarioId) {
  await SesionRefresh.update({ revocado_en: new Date() }, { where: { usuario_id: usuarioId, revocado_en: null } })
}
