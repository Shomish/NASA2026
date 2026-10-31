/**
 * @fileoverview Sonido y voz de alerta para datos atípicos.
 * Reproduce un tono fuerte (Web Audio API) y una locución "warning/advertencia"
 * (Web Speech API) en el idioma actual de la interfaz.
 * @module shared/alertaSonido
 */

import { idiomaActual } from './idioma.js'

let contextoAudio = null

/**
 * Obtiene (o crea) el AudioContext, reanudándolo si está suspendido.
 * @returns {AudioContext | null} Contexto de audio o null si no está disponible.
 */
function obtenerContexto() {
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return null
  if (!contextoAudio) contextoAudio = new AC()
  if (contextoAudio.state === 'suspended') contextoAudio.resume().catch(() => {})
  return contextoAudio
}

/**
 * Reproduce un tono de alerta fuerte (tres pitidos ascendentes).
 * @param {AudioContext} contexto - Contexto de audio.
 */
function tonoAlerta(contexto) {
  try {
    const ahora = contexto.currentTime
    for (let i = 0; i < 3; i += 1) {
      const osc = contexto.createOscillator()
      const ganancia = contexto.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(880 + i * 220, ahora + i * 0.28)
      ganancia.gain.setValueAtTime(0.0001, ahora + i * 0.28)
      ganancia.gain.exponentialRampToValueAtTime(0.4, ahora + i * 0.28 + 0.02)
      ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + i * 0.28 + 0.24)
      osc.connect(ganancia)
      ganancia.connect(contexto.destination)
      osc.start(ahora + i * 0.28)
      osc.stop(ahora + i * 0.28 + 0.25)
    }
  } catch {
    /* El audio puede fallar sin interacción previa; se ignora. */
  }
}

/**
 * Pronuncia una frase de advertencia en el idioma actual.
 */
function locucionAlerta() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const es = idiomaActual() === 'es'
    const texto = es
      ? 'Advertencia, se detectaron datos atípicos. Revisa las alertas de salud.'
      : 'Warning, atypical data detected. Check your health alerts.'
    const enunciado = new SpeechSynthesisUtterance(texto)
    enunciado.lang = es ? 'es-PE' : 'en-US'
    enunciado.rate = 0.95
    enunciado.pitch = 1
    enunciado.volume = 1
    window.speechSynthesis.speak(enunciado)
  } catch {
    /* Sin síntesis de voz disponible. */
  }
}

/**
 * Reproduce la alerta sonora (tono + locución).
 * Es idempotente y segura ante entornos sin audio/voz.
 */
export function reproducirAlertaSonora() {
  const contexto = obtenerContexto()
  if (contexto) tonoAlerta(contexto)
  locucionAlerta()
}
