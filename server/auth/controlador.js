/**
 * @fileoverview Controlador de autenticación (contra MySQL).
 * @module server/auth/controlador
 */

import { config } from '../config.js'
import { esquemaLogin, esquemaRegistro } from '../../shared/esquemaLogin.js'
import { iniciarSesion, registrarUsuario, rotarRefreshToken, cerrarSesion, TIEMPO_REFRESH_MS } from './servicio.js'
import { encontrarPorEmail, registrarIntentoFallido, limpiarIntentosFallidos } from './repositorioUsuarios.js'

const COOKIE_REFRESH = 'refresh_token'

/** Bloqueo temporal por intentos fallidos (persistente en MySQL). */
const MAX_INTENTOS = 5
const BLOQUEO_MS = 15 * 60 * 1000

function opcionesCookie() {
  return { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'strict', maxAge: TIEMPO_REFRESH_MS, path: '/api/v1/auth' }
}
function opcionesLimpiezaCookie() {
  return { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth' }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req, res) {
  const validacion = esquemaLogin.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  const { email, contrasena } = validacion.data

  // Bloqueo temporal persistente (sobrevive al reinicio del servidor).
  const usuario = await encontrarPorEmail(email)
  if (usuario?.bloqueado_hasta && new Date(usuario.bloqueado_hasta).getTime() > Date.now()) {
    return res.status(429).json({ codigo: 'BLOQUEO_TEMPORAL', mensaje: 'Demasiados intentos. Inténtalo más tarde.' })
  }

  const sesion = await iniciarSesion(email, contrasena)
  if (!sesion) {
    await registrarIntentoFallido(email, MAX_INTENTOS, BLOQUEO_MS)
    return res.status(401).json({ codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Usuario o contraseña incorrectos.' })
  }
  await limpiarIntentosFallidos(email)
  res.cookie(COOKIE_REFRESH, sesion.refreshToken, opcionesCookie())
  return res.json({ accessToken: sesion.accessToken, usuario: sesion.usuario })
}

/**
 * POST /api/v1/auth/register
 */
export async function register(req, res) {
  const validacion = esquemaRegistro.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  const { nombre, email, contrasena } = validacion.data
  try {
    const usuario = await registrarUsuario({ nombre, email, contrasena })
    return res.status(201).json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
  } catch {
    // Respuesta genérica ante email repetido (anti-enumeración).
    return res.status(409).json({ codigo: 'CONFLICTO', mensaje: 'No se pudo registrar el usuario.' })
  }
}

/**
 * POST /api/v1/auth/refresh
 */
export async function refresh(req, res) {
  const token = req.cookies?.[COOKIE_REFRESH]
  if (!token) return res.status(401).json({ codigo: 'SIN_SESION', mensaje: 'No autenticado.' })
  const sesion = await rotarRefreshToken(token)
  if (!sesion) {
    res.clearCookie(COOKIE_REFRESH, opcionesLimpiezaCookie())
    return res.status(401).json({ codigo: 'SESION_EXPIRADA', mensaje: 'Sesión expirada.' })
  }
  res.cookie(COOKIE_REFRESH, sesion.refreshToken, opcionesCookie())
  return res.json({ accessToken: sesion.accessToken, usuario: sesion.usuario })
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(req, res) {
  await cerrarSesion(req.cookies?.[COOKIE_REFRESH])
  res.clearCookie(COOKIE_REFRESH, opcionesLimpiezaCookie())
  return res.status(204).end()
}

/**
 * GET /api/v1/auth/me
 */
export function me(req, res) {
  return res.json({ usuario: req.usuario })
}
