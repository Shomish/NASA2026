/**
 * @fileoverview Almacén persistente para express-rate-limit (MySQL).
 * Sustituye el MemoryStore: los contadores de login sobreviven al reinicio del
 * servidor y se comparten entre instancias (necesario para el despliegue).
 * @module server/auth/almacenRateLimit
 */

import { Op } from 'sequelize'
import { modelos } from '../db/modelos.js'

const { RateLimit } = modelos

/** Frecuencia mínima (ms) entre limpiezas oportunistas de filas vencidas. */
const INTERVALO_LIMPIEZA_MS = 60_000

/**
 * Store de rate limit respaldado por la tabla `rate_limits` (Sequelize).
 */
export class AlmacenRateLimitMySQL {
  constructor() {
    /** Los contadores NO son locales a una instancia (compartidos en MySQL). */
    this.localKeys = false
    this.ventanaMs = 60_000
    this.ultimaLimpieza = 0
  }

  /**
   * Inicializa la ventana de tiempo desde las opciones del middleware.
   * @param {object} opciones - Opciones de express-rate-limit.
   */
  init(opciones) {
    this.ventanaMs = opciones.windowMs
  }

  /**
   * Limpia (oportunistamente) las filas cuya ventana ya venció.
   * @param {number} ahora - Marca de tiempo actual.
   * @returns {Promise<void>} Promesa.
   */
  async _limpiarVencidas(ahora) {
    if (ahora - this.ultimaLimpieza < INTERVALO_LIMPIEZA_MS) return
    this.ultimaLimpieza = ahora
    try {
      await RateLimit.destroy({ where: { vence_en: { [Op.lte]: new Date(ahora) } } })
    } catch {
      /* La limpieza no debe romper la operación principal. */
    }
  }

  /**
   * Incrementa el contador de una clave.
   * @param {string} clave - Clave (IP u otro identificador).
   * @returns {Promise<{totalHits: number, resetTime: Date}>} Total y hora de reseteo.
   */
  async increment(clave) {
    const ahora = Date.now()
    await this._limpiarVencidas(ahora)
    const fila = await RateLimit.findByPk(clave)

    if (!fila || fila.vence_en.getTime() <= ahora) {
      const venceEn = new Date(ahora + this.ventanaMs)
      await RateLimit.upsert({ clave, total: 1, vence_en: venceEn })
      return { totalHits: 1, resetTime: venceEn }
    }

    await RateLimit.increment('total', { by: 1, where: { clave } })
    return { totalHits: fila.total + 1, resetTime: fila.vence_en }
  }

  /**
   * Decrementa el contador de una clave (p. ej. tras un intento fallido de otro límite).
   * @param {string} clave - Clave.
   * @returns {Promise<void>} Promesa.
   */
  async decrement(clave) {
    const fila = await RateLimit.findByPk(clave)
    if (!fila) return
    if (fila.total <= 1) await RateLimit.destroy({ where: { clave } })
    else await RateLimit.decrement('total', { by: 1, where: { clave } })
  }

  /**
   * Elimina el contador de una clave.
   * @param {string} clave - Clave.
   * @returns {Promise<void>} Promesa.
   */
  async resetKey(clave) {
    await RateLimit.destroy({ where: { clave } })
  }

  /**
   * Elimina todos los contadores.
   * @returns {Promise<void>} Promesa.
   */
  async resetAll() {
    await RateLimit.destroy({ where: {} })
  }
}
