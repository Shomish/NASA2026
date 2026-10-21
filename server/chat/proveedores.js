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
   */
  constructor(claveApi) {
    super()
    this.claveApi = claveApi
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.claveApi}`,
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
