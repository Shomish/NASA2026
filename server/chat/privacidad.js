/**
 * @fileoverview Privacidad y costo del chat: consentimiento revocable, límites de uso
 * y sanitización. El contenido de los mensajes NUNCA se audita; solo los cambios de
 * consentimiento y configuración.
 * @module server/chat/privacidad
 */

import { Op } from 'sequelize'
import { modelos } from '../db/modelos.js'

const { ConsentimientoIA, UsoIA, ConfiguracionIA } = modelos

/**
 * Indica si existe consentimiento vigente para enviar datos a la nube.
 * @param {number} usuarioId - Id del usuario.
 * @param {number} tripulanteId - Id del tripulante.
 * @returns {Promise<boolean>} Verdadero si hay consentimiento vigente.
 */
export async function consentimientoVigente(usuarioId, tripulanteId) {
  const consentimiento = await ConsentimientoIA.findOne({
    where: { usuario_id: usuarioId, tripulante_id: tripulanteId, acepta_nube: true, revocado_en: null },
  })
  return Boolean(consentimiento)
}

/**
 * Establece (o revoca) el consentimiento de nube para un usuario + tripulante.
 * @param {number} usuarioId - Id del usuario.
 * @param {number} tripulanteId - Id del tripulante.
 * @param {boolean} acepta - Si acepta enviar datos a la nube.
 * @returns {Promise<object>} Consentimiento actualizado.
 */
export async function fijarConsentimiento(usuarioId, tripulanteId, acepta) {
  const [consentimiento] = await ConsentimientoIA.findOrCreate({
    where: { usuario_id: usuarioId, tripulante_id: tripulanteId },
    defaults: { acepta_nube: acepta, fecha_aceptacion: new Date() },
  })
  if (acepta) {
    await consentimiento.update({ acepta_nube: true, revocado_en: null, fecha_aceptacion: new Date() })
  } else {
    await consentimiento.update({ acepta_nube: false, revocado_en: new Date() })
  }
  return consentimiento
}

/**
 * Verifica si el usuario está dentro de los límites diario/mensual.
 * @param {number} usuarioId - Id del usuario.
 * @returns {Promise<boolean>} Verdadero si puede usar la nube.
 */
export async function dentroDeLimites(usuarioId) {
  const config = await ConfiguracionIA.findOne({ where: { proveedor: 'gemini' } })
  const hoy = new Date().toISOString().slice(0, 10)

  const usoHoy = await UsoIA.findOne({ where: { usuario_id: usuarioId, fecha: hoy } })
  if (config && usoHoy && usoHoy.solicitudes >= config.limite_diario_por_usuario) return false

  const inicioMes = new Date()
  inicioMes.setDate(1)
  const totalMes = (await UsoIA.sum('solicitudes', { where: { fecha: { [Op.gte]: inicioMes.toISOString().slice(0, 10) } } })) ?? 0
  if (config && totalMes >= config.limite_mensual_global) return false

  return true
}

/**
 * Registra una solicitud en el uso diario (solo cuando se usó la nube).
 * @param {number} usuarioId - Id del usuario.
 * @returns {Promise<void>} Promesa.
 */
export async function registrarUso(usuarioId) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [uso, creado] = await UsoIA.findOrCreate({ where: { usuario_id: usuarioId, fecha: hoy }, defaults: { solicitudes: 1 } })
  if (!creado) await uso.increment('solicitudes', { by: 1 })
}

/**
 * Sanitiza la entrada del usuario (defensa ligera contra prompt injection):
 * elimina caracteres de control y limita la longitud.
 * @param {string} texto - Texto del usuario.
 * @returns {string} Texto sanitizado.
 */
export function sanitizarEntrada(texto) {
  return String(texto ?? '')
    .split('')
    .filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127)
    .join('')
    .trim()
    .slice(0, 1000)
}

/**
 * Sanitiza la salida del modelo: elimina HTML/scripts y etiquetas Markdown peligrosas.
 * @param {string} texto - Respuesta del modelo.
 * @returns {string} Texto sanitizado.
 */
export function sanitizarSalida(texto) {
  return String(texto ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .trim()
}
