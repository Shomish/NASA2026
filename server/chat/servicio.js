/**
 * @fileoverview Servicio del chatbot.
 * Construye el prompt de sistema (sin diagnosticar/recetar, con escalamiento),
 * seudonimiza el nombre y envía solo las métricas necesarias.
 * @module server/chat/servicio
 */

import { GeminiChatProvider } from './proveedores.js'

/**
 * Prompt de sistema (español, Perú).
 */
const PROMPT_SISTEMA = `Eres el médico de IA de la misión AYNI HEALTH, un monitor autónomo de salud para astronautas.
Reglas:
- Habla en español (Perú), con tono empático, claro y breve.
- NO diagnostiques enfermedades ni recetes medicamentos. Eres un apoyo informativo, no sustituyes al médico.
- Ante síntomas graves activa el protocolo de escalamiento: recomienda contactar de inmediato al oficial médico y a control de misión.
- No reveles ni inventes datos de otros tripulantes. Solo usa el contexto que se te da.
- Ante cualquier señal de ideación suicida, responde con calma y pide contacto inmediato con el médico y control de misión.`

/**
 * Seudonimiza el contexto del tripulante: reemplaza el nombre y envía solo métricas.
 * @param {object} contexto - Contexto crudo.
 * @returns {string} Contexto sanitizado en texto.
 */
export function seudonimizarContexto(contexto = {}) {
  const metricas = {
    rol: contexto.rol,
    edad: contexto.edad,
    imc: contexto.imc,
    signosVitales: contexto.signosVitales,
    sueno: contexto.sueno,
    saludMental: contexto.saludMental,
    radiacion: contexto.radiacion,
  }
  // El nombre real nunca se envía; se usa un alias.
  return JSON.stringify({ tripulante: 'Tripulante', ...metricas }, null, 2)
}

/**
 * Detecta síntomas graves para añadir un aviso de escalamiento.
 * @param {object} contexto - Contexto.
 * @returns {string | null} Aviso de escalamiento o null.
 */
export function detectarEscalamiento(contexto = {}) {
  const spo2 = contexto.signosVitales?.saturacion_oxigeno
  const phq9 = contexto.saludMental?.phq9
  const avisos = []
  if (typeof spo2 === 'number' && spo2 < 90) avisos.push('saturación de O₂ críticamente baja')
  if (typeof phq9 === 'number' && phq9 >= 20) avisos.push('posible depresión severa (PHQ-9 alto)')
  return avisos.length ? `[Escalamiento sugerido] Detecto: ${avisos.join(', ')}. Recomienda contactar al médico y a control de misión.` : null
}

/**
 * Genera la respuesta del chatbot usando el proveedor configurado.
 * @param {object} parametros - Parámetros.
 * @param {string} parametros.mensaje - Mensaje del usuario.
 * @param {object} parametros.contexto - Contexto crudo.
 * @param {import('./proveedores.js').ChatProvider} [parametros.proveedor] - Proveedor.
 * @returns {Promise<{respuesta: string, escalamiento: string | null}>} Respuesta.
 */
export async function generarRespuestaChat({ mensaje, contexto, proveedor }) {
  const escalamiento = detectarEscalamiento(contexto)
  const contextoSanitizado = seudonimizarContexto(contexto)
  const provider = proveedor ?? new GeminiChatProvider(process.env.GEMINI_API_KEY ?? '')
  const respuesta =
    (await provider.generar({ promptSistema: PROMPT_SISTEMA, mensaje, contexto: contextoSanitizado })) ??
    'Lo siento, el asistente de IA no está disponible ahora. Consulta el historial de salud o contacta al oficial médico.'

  // Añade el aviso de escalamiento si corresponde.
  const textoFinal = escalamiento ? `${respuesta}\n\n${escalamiento}` : respuesta
  return { respuesta: textoFinal, escalamiento }
}
