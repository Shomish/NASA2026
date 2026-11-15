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
  temperatura: { normalMin: 36, normalMax: 37.5, criticoMin: 34, criticoMax: 100 },
  phq9: { normalMin: 0, normalMax: 9, criticoMin: 20, criticoMax: 27 },
  glucosa: { normalMin: 70, normalMax: 99, criticoMin: 54, criticoMax: 250 },
  presion_sistolica: { normalMin: 90, normalMax: 120, criticoMin: 0, criticoMax: 180 },
  presion_diastolica: { normalMin: 60, normalMax: 80, criticoMin: 0, criticoMax: 120 },
  radiacion_acumulada: { normalMin: 0, normalMax: 479, criticoMin: 0, criticoMax: 599.99 },
  radiacion_evento: { normalMin: 0, normalMax: 249, criticoMin: 0, criticoMax: 249.99 },
  sueno: { normalMin: 7, normalMax: 24, criticoMin: 0, criticoMax: 24 },
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
 * Umbral crítico de presión sistólica (crisis hipertensiva).
 * @returns {number} Valor crítico en mmHg.
 */
export function umbralCriticoPresionSistolica() {
  return umbrales.presion_sistolica?.criticoMax ?? 180
}

/**
 * Umbral crítico de presión diastólica (crisis hipertensiva).
 * @returns {number} Valor crítico en mmHg.
 */
export function umbralCriticoPresionDiastolica() {
  return umbrales.presion_diastolica?.criticoMax ?? 120
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
