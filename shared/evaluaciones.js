/**
 * @fileoverview Interpretación de escalas de salud mental (PHQ-9 y GAD-7).
 * Compartido entre el frontend (formularios) y el backend (validación y alertas).
 * Los rangos son fijos y públicos; los umbrales editables están en umbrales_clinicos.
 * @module shared/evaluaciones
 */

/**
 * Nivel de depresión según el puntaje PHQ-9.
 * @param {number} puntaje - Puntaje total (0-27).
 * @returns {string} Nivel (mínima, leve, moderada, moderadamente severa, severa).
 */
export function interpretarPhq9(puntaje) {
  if (puntaje <= 4) return 'mínima'
  if (puntaje <= 9) return 'leve'
  if (puntaje <= 14) return 'moderada'
  if (puntaje <= 19) return 'moderadamente severa'
  return 'severa'
}

/**
 * Nivel de ansiedad según el puntaje GAD-7.
 * @param {number} puntaje - Puntaje total (0-21).
 * @returns {string} Nivel (mínima, leve, moderada, severa).
 */
export function interpretarGad7(puntaje) {
  if (puntaje <= 4) return 'mínima'
  if (puntaje <= 9) return 'leve'
  if (puntaje <= 14) return 'moderada'
  return 'severa'
}

/**
 * Indica si la pregunta 9 del PHQ-9 (ideación) fue respondida distinta de "nunca".
 * Activa SIEMPRE una alerta de apoyo, sin depender del puntaje total.
 * @param {number[]} respuestas - Respuestas (0-3) de las 9 preguntas.
 * @returns {boolean} Verdadero si la pregunta 9 es positiva.
 */
export function item9Phq9Positivo(respuestas) {
  return Array.isArray(respuestas) && respuestas.length >= 9 && respuestas[8] > 0
}

/**
 * Suma las respuestas de un cuestionario (PHQ-9/GAD-7).
 * @param {number[]} respuestas - Respuestas (0-3).
 * @returns {number} Puntaje total.
 */
export function sumarRespuestas(respuestas) {
  return (respuestas ?? []).reduce((acc, r) => acc + (Number(r) || 0), 0)
}
