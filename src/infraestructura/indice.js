/**
 * @fileoverview Capa de infraestructura: IndexedDB (CRUD), cliente de API y conector LLM.
 * @module infraestructura/indice
 */

/**
 * Genera un identificador único.
 * @returns {string} Identificador.
 */
export function generarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Almacenamiento local con IndexedDB (CRUD completo).
 */
export class AdaptadorAlmacenamiento {
  /**
   * @param {string} [nombre] - Nombre de la base.
   */
  constructor(nombre = 'salud_astronauta_db') {
    this.nombre = nombre
    this.base = null
  }

  /**
   * Abre la base de datos.
   * @returns {Promise<IDBDatabase>} Base.
   */
  async _abrir() {
    if (this.base) return this.base
    return new Promise((resolver, rechazar) => {
      const solicitud = indexedDB.open(this.nombre, 1)
      solicitud.onupgradeneeded = (evento) => {
        const base = evento.target.result
        if (!base.objectStoreNames.contains('tripulacion')) {
          base.createObjectStore('tripulacion', { keyPath: 'id' })
        }
        if (!base.objectStoreNames.contains('historial')) {
          base.createObjectStore('historial', { keyPath: 'id' })
        }
      }
      solicitud.onsuccess = (evento) => {
        this.base = evento.target.result
        resolver(this.base)
      }
      solicitud.onerror = () => rechazar(solicitud.error)
    })
  }

  /**
   * Ejecuta una transacción.
   * @param {string} almacen - Nombre del almacén.
   * @param {'readonly' | 'readwrite'} modo - Modo.
   * @param {(store: IDBObjectStore) => IDBRequest} operacion - Operación.
   * @returns {Promise<any>} Resultado.
   */
  async _transaccion(almacen, modo, operacion) {
    const base = await this._abrir()
    return new Promise((resolver, rechazar) => {
      const tx = base.transaction(almacen, modo)
      const solicitud = operacion(tx.objectStore(almacen))
      solicitud.onsuccess = () => resolver(solicitud.result)
      solicitud.onerror = () => rechazar(solicitud.error)
    })
  }

  /**
   * Guarda un objeto (upsert).
   * @param {string} almacen - Almacén.
   * @param {object} objeto - Objeto.
   * @returns {Promise<object>} Objeto guardado.
   */
  async guardar(almacen, objeto) {
    if (!objeto.id) objeto.id = generarId()
    await this._transaccion(almacen, 'readwrite', (store) => store.put(objeto))
    return objeto
  }

  /**
   * Obtiene todos los objetos de un almacén.
   * @param {string} almacen - Almacén.
   * @returns {Promise<object[]>} Objetos.
   */
  async obtenerTodos(almacen) {
    return this._transaccion(almacen, 'readonly', (store) => store.getAll())
  }

  /**
   * Elimina un objeto.
   * @param {string} almacen - Almacén.
   * @param {string} id - Identificador.
   * @returns {Promise<void>} Promesa.
   */
  async eliminar(almacen, id) {
    await this._transaccion(almacen, 'readwrite', (store) => store.delete(id))
  }
}

/**
 * Cliente HTTP hacia el backend Express.
 */
export class AdaptadorApi {
  /**
   * @param {string} [base] - URL base. Usa VITE_API_URL si está definida, o /api (proxy) por defecto.
   */
  constructor(base = import.meta.env.VITE_API_URL || '/api') {
    this.base = base
  }

  /**
   * Envía un registro de signos vitales.
   * @param {object} registro - Registro.
   * @returns {Promise<object|null>} Respuesta o null.
   */
  async guardarRegistro(registro) {
    try {
      const respuesta = await fetch(`${this.base}/registros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro),
      })
      return respuesta.ok ? respuesta.json() : null
    } catch {
      return null
    }
  }
}

/**
 * Conector LLM opcional (usa una API key si está disponible).
 * Si no hay key, devuelve null y el motor local responde.
 */
export class ConectorLLM {
  /**
   * @param {string} [claveApi] - Clave de API (opcional, desde .env).
   */
  constructor(claveApi = import.meta.env.VITE_GEMINI_API_KEY) {
    this.claveApi = claveApi
  }

  /**
   * Indica si hay un LLM real disponible.
   * @returns {boolean} Verdadero si hay clave.
   */
  disponible() {
    return Boolean(this.claveApi)
  }

  /**
   * Consulta el LLM con contexto del astronauta.
   * @param {string} mensaje - Mensaje del usuario.
   * @param {string} contexto - Contexto (perfil + vitales).
   * @returns {Promise<string|null>} Respuesta del LLM o null.
   */
  async consultar(mensaje, contexto) {
    if (!this.claveApi) return null
    try {
      const respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.claveApi}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `Eres el médico de IA de una misión espacial. Contexto del astronauta:\n${contexto}\n\nPregunta del astronauta: ${mensaje}\nResponde en español, breve y accionable.` },
                ],
              },
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
