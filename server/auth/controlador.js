/**
 * @fileoverview Controlador de autenticación.
 * Maneja las peticiones HTTP y delega la lógica al servicio. Sin lógica de negocio.
 * @module server/auth/controlador
 */

import { config } from '../config.js'
import { esquemaLogin } from '../../shared/esquemaLogin.js'
import { iniciarSesion, rotarRefreshToken, cerrarSesion, TIEMPO_REFRESH_MS } from './servicio.js'

/** Nombre de la cookie del refresh token. */
const COOKIE_REFRESH = 'refresh_token'
/** Intentos fallidos por usuario (bloqueo temporal). */
const intentosFallidos = new Map()
/** Máximo de intentos fallidos antes del bloqueo. */
const MAX_INTENTOS = 5
/** Duración del bloqueo (15 minutos). */
const BLOQUEO_MS = 15 * 60 * 1000

/**
 * Opciones de la cookie del refresh token (httpOnly, Secure en producción, SameSite=Strict).
 * @returns {object} Opciones de cookie.
 */
function opcionesCookie() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TIEMPO_REFRESH_MS,
    path: '/api/v1/auth',
  }
}

/**
 * Opciones para limpiar la cookie (sin maxAge, que está deprecado en clearCookie).
 * @returns {object} Opciones de limpieza.
 */
function opcionesLimpiezaCookie() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  }
}

/**
 * Indica si un usuario está temporalmente bloqueado por intentos fallidos.
 * @param {string} username - Usuario.
 * @returns {boolean} Verdadero si está bloqueado.
 */
function estaBloqueado(username) {
  const registro = intentosFallidos.get(username)
  return Boolean(registro && registro.bloqueadoHasta > Date.now())
}

/**
 * Registra un intento fallido y, si supera el máximo, bloquea temporalmente.
 * @param {string} username - Usuario.
 */
function registrarFallo(username) {
  const registro = intentosFallidos.get(username) ?? { contador: 0, bloqueadoHasta: 0 }
  registro.contador += 1
  if (registro.contador >= MAX_INTENTOS) {
    registro.bloqueadoHasta = Date.now() + BLOQUEO_MS
    registro.contador = 0
  }
  intentosFallidos.set(username, registro)
}

/**
 * Limpia los intentos fallidos de un usuario tras un login correcto.
 * @param {string} username - Usuario.
 */
function limpiarIntentos(username) {
  intentosFallidos.delete(username)
}

/**
 * POST /api/v1/auth/login
 * @param {import('express').Request} req - Petición.
 * @param {import('express').Response} res - Respuesta.
 */
export async function login(req, res) {
  const validacion = esquemaLogin.safeParse(req.body ?? {})
  if (!validacion.success) {
    return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  }
  const { username, contrasena } = validacion.data

  if (estaBloqueado(username)) {
    return res.status(429).json({ codigo: 'BLOQUEO_TEMPORAL', mensaje: 'Demasiados intentos. Inténtalo más tarde.' })
  }

  const sesion = await iniciarSesion(username, contrasena)

  if (!sesion) {
    registrarFallo(username)
    // Mensaje genérico: no revela si falló usuario o contraseña.
    return res.status(401).json({ codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Usuario o contraseña incorrectos.' })
  }

  limpiarIntentos(username)
  res.cookie(COOKIE_REFRESH, sesion.refreshToken, opcionesCookie())
  return res.json({ accessToken: sesion.accessToken, usuario: sesion.usuario })
}

/**
 * POST /api/v1/auth/refresh
 * @param {import('express').Request} req - Petición.
 * @param {import('express').Response} res - Respuesta.
 */
export function refresh(req, res) {
  const token = req.cookies?.[COOKIE_REFRESH]
  if (!token) return res.status(401).json({ codigo: 'SIN_SESION', mensaje: 'No autenticado.' })

  const sesion = rotarRefreshToken(token)
  if (!sesion) {
    res.clearCookie(COOKIE_REFRESH, opcionesLimpiezaCookie())
    return res.status(401).json({ codigo: 'SESION_EXPIRADA', mensaje: 'Sesión expirada.' })
  }

  res.cookie(COOKIE_REFRESH, sesion.refreshToken, opcionesCookie())
  return res.json({ accessToken: sesion.accessToken, usuario: sesion.usuario })
}

/**
 * POST /api/v1/auth/logout
 * @param {import('express').Request} req - Petición.
 * @param {import('express').Response} res - Respuesta.
 */
export function logout(req, res) {
  cerrarSesion(req.cookies?.[COOKIE_REFRESH])
  res.clearCookie(COOKIE_REFRESH, opcionesLimpiezaCookie())
  return res.status(204).end()
}

/**
 * GET /api/v1/auth/me (requiere autenticación).
 * @param {import('express').Request} req - Petición.
 * @param {import('express').Response} res - Respuesta.
 */
export function me(req, res) {
  return res.json({ usuario: req.usuario })
}
