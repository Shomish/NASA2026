/**
 * @fileoverview Utilidades de acceso y auditoría para la API.
 * @module server/api/utilidades
 */

import { randomBytes } from 'node:crypto'
import { modelos } from '../db/modelos.js'

const { Auditoria, Tripulante } = modelos

/**
 * Genera un código único de registro (8 caracteres hexadecimales en mayúsculas).
 * @returns {string} Código único.
 */
export function generarCodigo() {
  return randomBytes(4).toString('hex').toUpperCase()
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
