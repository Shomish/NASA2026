/**
 * @fileoverview Respuestas locales del chat por intención (sin IA externa).
 * Reutiliza la detección de emergencia compartida. No diagnostica ni receta.
 * @module shared/chatLocal
 */

import { normalizarTexto, detectarEmergencia, PROTOCOLO_EMERGENCIA } from './emergencia.js'

/** Aviso legal que acompaña a toda respuesta local no urgente. */
export const AVISO_LEGAL = {
  es: 'Esto no reemplaza a un profesional de salud.',
  en: 'This does not replace a health professional.',
}

/** Patrones de intención (texto normalizado, sin tildes). */
const PATRONES = {
  sintomas: /(dolor de cabeza|duele la cabeza|jaqueca|mareo|nausea|nauseas|cansancio|headache|dizzy|nausea|tired)/,
  alimentacion: /(comida|comer|dieta|aliment|nutri|agua|hidrat|food|eat|diet|nutrition|water|hydrat)/,
  sueno: /(dormir|sueno|insomnio|descanso|cansado|sleep|insomnia|rest|tired)/,
  animo: /(triste|solo|sola|ansios|ansiedad|no puedo mas|desanim|bajon|deprimid|sad|lonely|anxious|overwhelmed|depression)/,
}

/** Respuestas por intención e idioma. */
const RESPUESTAS = {
  es: {
    sintomas: 'Para síntomas leves como dolor de cabeza, mareo, náuseas o cansancio: descansa, hidrátate y registra tus signos vitales en la app. Si persiste o empeora, consulta al médico de vuelo.',
    alimentacion: 'Mantén una hidratación adecuada (2.5–3 L de agua al día, ajusta según actividad) y comidas balanceadas con proteínas, carbohidratos y vegetales. Revisa tu plan nutricional personalizado en la sección Nutrición de la app.',
    sueno: 'Mantén una rutina de sueño regular, evita cafeína y pantallas antes de dormir, y apunta a 7 horas o más (Watson et al., 2015). Registra tu sueño en la app.',
    animo: 'Siento que estés pasando por esto. No estás solo: puedes completar el PHQ-9 o GAD-7 en la app y hablar con tu equipo o un profesional de salud. Si tienes pensamientos de hacerte daño, busca ayuda inmediata.',
    defecto: 'No entendí bien. Puedo ayudarte con síntomas, sueño, alimentación o ánimo. Si es una emergencia, escribe "emergencia".',
  },
  en: {
    sintomas: 'For mild symptoms such as headache, dizziness, nausea, or tiredness: rest, hydrate, and record your vital signs in the app. If they persist or worsen, consult the flight surgeon.',
    alimentacion: 'Stay hydrated (2.5–3 L of water per day, adjust for activity) and eat balanced meals with protein, carbohydrates, and vegetables. Check your personalized nutrition plan in the Nutrition section of the app.',
    sueno: 'Keep a regular sleep routine, avoid caffeine and screens before bed, and aim for 7 hours or more (Watson et al., 2015). Record your sleep in the app.',
    animo: "I'm sorry you're going through this. You are not alone: you can complete the PHQ-9 or GAD-7 in the app and talk to your team or a health professional. If you have thoughts of self-harm, seek immediate help.",
    defecto: 'I did not quite understand. I can help with symptoms, sleep, nutrition, or mood. If this is an emergency, type "emergency".',
  },
}

/**
 * Detecta la intención local de un mensaje.
 * La emergencia siempre tiene prioridad.
 * @param {string} mensaje - Mensaje del usuario.
 * @returns {'emergencia'|'sintomas'|'alimentacion'|'sueno'|'animo'|'defecto'} Intención.
 */
export function detectarIntencionLocal(mensaje) {
  if (detectarEmergencia(mensaje, {}).emergencia) return 'emergencia'
  const texto = normalizarTexto(mensaje)
  for (const [intencion, patron] of Object.entries(PATRONES)) {
    if (patron.test(texto)) return intencion
  }
  return 'defecto'
}

/**
 * Devuelve la respuesta local para un mensaje.
 * @param {string} mensaje - Mensaje del usuario.
 * @param {'es'|'en'} [idioma] - Idioma de la respuesta.
 * @returns {{intencion: string, texto: string}} Intención y respuesta.
 */
export function respuestaLocal(mensaje, idioma = 'es') {
  const intencion = detectarIntencionLocal(mensaje)
  if (intencion === 'emergencia') return { intencion, texto: PROTOCOLO_EMERGENCIA }
  const textos = RESPUESTAS[idioma] ?? RESPUESTAS.es
  return { intencion, texto: textos[intencion] }
}
