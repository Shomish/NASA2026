/**
 * @fileoverview Almacén de umbrales clínicos (servidor).
 * Única fuente de verdad para la configuración y el escalamiento del chatbot.
 * En memoria hasta la Fase 10 (PostgreSQL).
 * @module server/configuracion/umbrales
 */

/**
 * Umbrales por defecto (coinciden con el dominio del front).
 * @type {Record<string, {normalMin: number, normalMax: number, criticoMin: number, criticoMax: number}>}
 */
const UMBRALES_POR_DEFECTO = {
  saturacion_oxigeno: { normalMin: 95, normalMax: 100, criticoMin: 90, criticoMax: 100 },
  frecuencia_cardiaca: { normalMin: 60, normalMax: 100, criticoMin: 40, criticoMax: 150 },
  temperatura: { normalMin: 36, normalMax: 37.5, criticoMin: 34, criticoMax: 40 },
  phq9: { normalMin: 0, normalMax: 9, criticoMin: 20, criticoMax: 27 },
}

/** Umbrales actuales. */
let umbrales = structuredClone(UMBRALES_POR_DEFECTO)

/**
 * Obtiene los umbrales clínicos actuales.
 * @returns {object} Umbrales.
 */
export function obtenerUmbrales() {
  return umbrales
}

/**
 * Obtiene el umbral crítico de saturación de O₂ (para escalamiento).
 * @returns {number} Valor crítico de SpO₂.
 */
export function umbralCriticoSpo2() {
  return umbrales.saturacion_oxigeno?.criticoMin ?? 90
}

/**
 * Obtiene el umbral crítico de PHQ-9 (para escalamiento).
 * @returns {number} Valor crítico de PHQ-9.
 */
export function umbralCriticoPhq9() {
  return umbrales.phq9?.criticoMin ?? 20
}

/**
 * Actualiza los umbrales (fusionando sobre los actuales).
 * @param {object} nuevos - Umbrales nuevos.
 * @returns {object} Umbrales resultantes.
 */
export function actualizarUmbrales(nuevos) {
  umbrales = { ...umbrales, ...(nuevos ?? {}) }
  return umbrales
}

/**
 * Restablece los umbrales a sus valores por defecto.
 * @returns {object} Umbrales por defecto.
 */
export function restablecerUmbrales() {
  umbrales = structuredClone(UMBRALES_POR_DEFECTO)
  return umbrales
}
