/**
 * @fileoverview Detección compartida de posibles emergencias médicas.
 * Se usa en el motor local del chat y en el backend. No diagnostica:
 * solo activa el protocolo de escalamiento y avisa al oficial médico.
 * @module shared/emergencia
 */

/** Texto exacto del protocolo de emergencia. */
export const PROTOCOLO_EMERGENCIA = `⚠️ Posible emergencia. 1) Detén toda actividad y siéntate o recuéstate. 2) Avisa de inmediato a un compañero de la tripulación. 3) Contacta al oficial médico y a control de misión. 4) Sigue el procedimiento de emergencia de la misión. No te automediques. Esta herramienta no reemplaza la evaluación médica.`

/** Palabras clave de emergencia (sin tildes). */
const PALABRAS_CLAVE = [
  'dolor en el pecho',
  'dolor de pecho',
  'falta de aire',
  'no puedo respirar',
  'me desmaye',
  'desmayo',
  'confusion',
  'sangrado',
  'pensamientos de hacerme dano',
  'chest pain',
  'shortness of breath',
  'fainted',
  'confusion',
  'mareo',
  'dizziness',
]

/**
 * Normaliza un texto: minúsculas, sin tildes y sin diacríticos.
 * @param {string} texto - Texto original.
 * @returns {string} Texto normalizado.
 */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Detecta una posible emergencia en el texto o en los signos vitales.
 * @param {string} texto - Mensaje del usuario.
 * @param {object} [signos] - Signos vitales disponibles.
 * @returns {{emergencia: boolean, motivos: string[]}} Resultado.
 */
export function detectarEmergencia(texto, signos = {}) {
  const normalizado = normalizarTexto(texto)
  const motivos = []

  for (const palabra of PALABRAS_CLAVE) {
    if (normalizado.includes(palabra)) motivos.push(palabra)
  }

  // SpO₂ escrita por el usuario: "saturación 84%", "spo2: 88", etc.
  const coincidencia = normalizado.match(/(?:saturacion(?:\s+de\s+oxigeno)?|spo2)[^0-9]{0,20}(\d{2,3})/)
  if (coincidencia) {
    const valor = Number(coincidencia[1])
    if (Number.isFinite(valor) && valor < 90) motivos.push(`saturacion ${valor}%`)
  }

  const sistolica = Number(signos?.sistolica ?? signos?.presion_sistolica)
  const diastolica = Number(signos?.diastolica ?? signos?.presion_diastolica)
  if (Number.isFinite(sistolica) && sistolica > 180) motivos.push(`presion sistolica ${sistolica} mmHg`)
  if (Number.isFinite(diastolica) && diastolica > 120) motivos.push(`presion diastolica ${diastolica} mmHg`)

  const spo2 = Number(signos?.saturacion_oxigeno ?? signos?.spo2)
  if (Number.isFinite(spo2) && spo2 < 90) motivos.push(`saturacion ${spo2}%`)

  return { emergencia: motivos.length > 0, motivos: [...new Set(motivos)] }
}
