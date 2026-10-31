/**
 * @fileoverview Proveedores del chatbot (interfaz ChatProvider).
 * Permite abstraer el proveedor de LLM (hoy Gemini; mañana otro) sin tocar la UI.
 * @module server/chat/proveedores
 */

/**
 * Contrato de un proveedor de chat.
 * @abstract
 */
export class ChatProvider {
  /**
   * Genera una respuesta a partir de un prompt de sistema, un mensaje y contexto.
   * @param {object} parametros - Parámetros.
   * @param {string} parametros.promptSistema - Instrucciones de sistema.
   * @param {string} parametros.mensaje - Mensaje del usuario.
   * @param {string} parametros.contexto - Contexto sanitizado (métricas).
   * @returns {Promise<string | null>} Respuesta o null si no está disponible.
   */
  // eslint-disable-next-line no-unused-vars
  async generar({ promptSistema, mensaje, contexto }) {
    throw new Error('ChatProvider.generar debe implementarse.')
  }
}

/**
 * Proveedor Gemini (Google), vía backend. La API key nunca sale del servidor.
 */
export class GeminiChatProvider extends ChatProvider {
  /**
   * @param {string} claveApi - Clave de la API de Gemini.
   * @param {string} [modelo] - Nombre del modelo (por defecto gemini-flash-latest).
   */
  constructor(claveApi, modelo = 'gemini-flash-latest') {
    super()
    this.claveApi = claveApi
    this.modelo = modelo
  }

  /**
   * Genera una respuesta con Gemini.
   * @param {object} parametros - Parámetros.
   * @returns {Promise<string | null>} Respuesta o null.
   */
  async generar({ promptSistema, mensaje, contexto }) {
    if (!this.claveApi) return null
    try {
      const respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelo}:generateContent?key=${this.claveApi}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${promptSistema}\n\nContexto del tripulante:\n${contexto}\n\nPregunta: ${mensaje}` }] },
            ],
          }),
        },
      )
      const datos = await respuesta.json()
      return datos?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    } catch {
      return null
    }
  }
}

/**
 * Proveedor compatible con la API de OpenAI (OpenRouter, Groq, etc.).
 * Permite configurar cualquier IA gratuita o de pago con formato OpenAI.
 */
export class OpenAICompatibleProvider extends ChatProvider {
  /**
   * @param {string} claveApi - Clave de API.
   * @param {string} modelo - Modelo.
   * @param {string} [urlBase] - URL base (por defecto https://api.openai.com/v1).
   */
  constructor(claveApi, modelo = 'gpt-4o-mini', urlBase = 'https://api.openai.com/v1') {
    super()
    this.claveApi = claveApi
    this.modelo = modelo
    this.urlBase = urlBase.replace(/\/$/, '')
  }

  /**
   * @param {object} parametros - Parámetros.
   * @returns {Promise<string | null>} Respuesta o null.
   */
  async generar({ promptSistema, mensaje, contexto }) {
    if (!this.claveApi) return null
    try {
      const respuesta = await fetch(`${this.urlBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.claveApi}`,
        },
        body: JSON.stringify({
          model: this.modelo,
          messages: [
            { role: 'system', content: promptSistema },
            { role: 'user', content: `Contexto del tripulante:\n${contexto}\n\nPregunta: ${mensaje}` },
          ],
          temperature: 0.4,
        }),
      })
      const datos = await respuesta.json()
      const msg = datos?.choices?.[0]?.message
      return msg?.content ?? msg?.reasoning ?? null
    } catch {
      return null
    }
  }
}

/**
 * Motor local de respaldo (sin red). No llama a ningún proveedor externo.
 */
export class ProveedorLocal extends ChatProvider {
  /**
   * @param {object} parametros - Parámetros.
   * @returns {Promise<string>} Respuesta local.
   */
  async generar({ mensaje }) {
    const texto = String(mensaje ?? '').toLowerCase()
    if (texto.includes('sueño') || texto.includes('dormir')) {
      return 'Sin conexión a la nube, te respondo en modo local: prioriza 7-9 horas de sueño, evita cafeína antes de dormir y mantén una rutina estable. Si el cansancio persiste, avisa al oficial médico.'
    }
    if (texto.includes('comer') || texto.includes('nutrición') || texto.includes('aliment')) {
      return 'Modo local: mantén una alimentación variada con superalimentos andinos (quinua, maca, muña) y una hidratación adecuada. Consulta la guía de nutrición para más detalle.'
    }
    return 'Estoy en modo local (sin conexión a la nube). Revisa tu historial de salud y, ante cualquier síntoma grave, contacta de inmediato al oficial médico.'
  }
}
