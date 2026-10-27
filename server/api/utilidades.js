/**
 * @fileoverview Utilidades de acceso y auditoría para la API.
 * @module server/api/utilidades
 */

import { randomBytes } from 'node:crypto'
import { modelos } from '../db/modelos.js'

const { Auditoria, Tripulante, Registro } = modelos

/**
 * Genera un código de registro (8 caracteres hexadecimales en mayúsculas).
 * @returns {string} Código.
 */
export function generarCodigo() {
  return randomBytes(4).toString('hex').toUpperCase()
}

/**
 * Genera un código de registro garantizando que no colisione con uno existente.
 * Reintenta (hasta 8 intentos) si el código generado ya está en uso; lanza si
 * no consigue un código libre (colisión persistente).
 * @param {() => string} [probar] - Generador inyectable para pruebas.
 * @returns {Promise<string>} Código único.
 */
export async function generarCodigoUnico(probar = generarCodigo) {
  for (let intento = 0; intento < 8; intento += 1) {
    const codigo = probar()
    const existe = await Registro.count({ where: { codigo } })
    if (!existe) return codigo
  }
  throw new Error('CODIGO_COLISION')
}

/**
 * Indica si el usuario autenticado es administrador.
 * @param {object} req - Petición.
 * @returns {boolean} Verdadero si es administrador.
 */
export function esAdministrador(req) {
  return req.usuario?.rol === 'administrador'
}

/**
 * Indica si el usuario autenticado es médico o administrador.
 * @param {object} req - Petición.
 * @returns {boolean} Verdadero si puede validar/cerrar.
 */
export function esMedicoOAdmin(req) {
  return req.usuario?.rol === 'medico' || req.usuario?.rol === 'administrador'
}

/**
 * Obtiene el tripulante vinculado al usuario autenticado (para el rol tripulante).
 * @param {object} req - Petición.
 * @returns {Promise<object | null>} Tripulante o null.
 */
export async function tripulanteDelUsuario(req) {
  return Tripulante.findOne({ where: { usuario_id: req.usuario?.id } })
}

/**
 * Registra una acción en auditoría (sin datos sensibles).
 * @param {object} parametros - Parámetros.
 * @param {object} [parametros.usuarioId] - Id del usuario.
 * @param {string} parametros.accion - Acción.
 * @param {string} parametros.entidad - Entidad.
 * @param {string | number} [parametros.entidadId] - Id de la entidad.
 * @param {object} [parametros.req] - Petición (para la IP).
 */
export async function auditar({ usuarioId, accion, entidad, entidadId, req }) {
  try {
    await Auditoria.create({
      usuario_id: usuarioId ?? null,
      accion,
      entidad,
      entidad_id: entidadId != null ? String(entidadId) : null,
      ip: req?.ip ?? null,
      detalle: null,
    })
  } catch {
    /* La auditoría no debe romper la operación principal. */
  }
}
