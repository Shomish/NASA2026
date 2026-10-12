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
 * Versión del esquema de la base de datos IndexedDB.
 * Incrementar al cambiar la estructura de los stores para disparar `onupgradeneeded`.
 */
const VERSION_ESQUEMA = 2

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
      const solicitud = indexedDB.open(this.nombre, VERSION_ESQUEMA)
      solicitud.onupgradeneeded = (evento) => {
        this._aplicarMigracion(evento.target.result, evento.oldVersion)
      }
      solicitud.onsuccess = (evento) => {
        this.base = evento.target.result
        resolver(this.base)
      }
      solicitud.onerror = () => rechazar(solicitud.error)
    })
  }

  /**
   * Aplica las migraciones del esquema según la versión anterior.
   * @param {IDBDatabase} base - Base de datos en actualización.
   * @param {number} versionAnterior - Versión previa del esquema (0 si es nueva).
   */
  _aplicarMigracion(base, versionAnterior) {
    if (versionAnterior < 1) {
      if (!base.objectStoreNames.contains('tripulacion')) {
        base.createObjectStore('tripulacion', { keyPath: 'id' })
      }
      if (!base.objectStoreNames.contains('historial')) {
        base.createObjectStore('historial', { keyPath: 'id' })
      }
    }
    // v1 → v2: a partir de ahora los tripulantes se rehidratan a entidades al leer
    // (los objetos planos de IndexedDB ya no se usan directamente). No hay cambio
    // estructural, por lo que no se requiere migración de datos.
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
   * Ignora valores que no sean objetos (p. ej., datos corruptos) sin lanzar error.
   * @param {string} almacen - Almacén.
   * @param {object} objeto - Objeto.
   * @returns {Promise<object | null>} Objeto guardado o null si es inválido.
   */
  async guardar(almacen, objeto) {
    if (!objeto || typeof objeto !== 'object' || Array.isArray(objeto)) return null
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
 * Conector LLM (nivel 3 · online).
 * Delega al backend Express (`/api/chat`), que oculta la API key del proveedor.
 * La key NUNCA viaja al navegador ni aparece en el bundle del cliente.
 */
export class ConectorLLM {
  /**
   * @param {string} [base] - URL base de la API.
   */
  constructor(base = import.meta.env.VITE_API_URL || '/api') {
    this.base = base
  }

  /**
   * Verifica si el proveedor de IA está configurado en el servidor.
   * @returns {Promise<boolean>} Verdadero si hay LLM en la nube disponible.
   */
  async disponible() {
    try {
      const respuesta = await fetch(`${this.base}/chat/estado`)
      if (!respuesta.ok) return false
      const datos = await respuesta.json()
      return Boolean(datos?.disponible)
    } catch {
      return false
    }
  }

  /**
   * Consulta el LLM (mediante el backend) con contexto del astronauta.
   * @param {string} mensaje - Mensaje del usuario.
   * @param {string} contexto - Contexto (perfil + vitales).
   * @returns {Promise<string|null>} Respuesta del LLM o null (para usar el motor local).
   */
  async consultar(mensaje, contexto) {
    try {
      const respuesta = await fetch(`${this.base}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, contexto }),
      })
      if (!respuesta.ok) return null
      const datos = await respuesta.json()
      return datos?.respuesta ?? null
    } catch {
      return null
    }
  }
}
