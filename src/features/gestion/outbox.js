/**
 * @fileoverview Cola outbox para escrituras sin conexión.
 * Las escrituras se encolan en IndexedDB con idempotency_key y se reintentan contra
 * /api/v1/sync al reconectar. IndexedDB es cola y caché, nunca fuente de verdad.
 * @module features/gestion/outbox
 */

import { AdaptadorAlmacenamiento, generarId } from '../../infraestructura/indice.js'
import * as api from './api.js'

const almacenamiento = new AdaptadorAlmacenamiento()

/**
 * Encola una operación de escritura (con idempotency_key).
 * @param {string} operacion - Tipo de operación (p. ej. 'crear_registro').
 * @param {object} datos - Datos de la operación.
 * @returns {Promise<object>} Entrada encolada.
 */
export async function encolar(operacion, datos) {
  const entrada = { id: generarId(), operacion, datos, creado_en: Date.now() }
  await almacenamiento.guardar('outbox', entrada)
  return entrada
}

/**
 * Devuelve las operaciones pendientes.
 * @returns {Promise<object[]>} Operaciones pendientes.
 */
export async function operacionesPendientes() {
  try {
    return await almacenamiento.obtenerTodos('outbox')
  } catch {
    return []
  }
}

/**
 * Elimina todas las operaciones pendientes (útil para pruebas y para descartar).
 * @returns {Promise<void>} Promesa.
 */
export async function limpiarOutbox() {
  const items = await operacionesPendientes()
  for (const item of items) await almacenamiento.eliminar('outbox', item.id)
}

/**
 * Intenta vaciar la cola enviando cada operación a /api/v1/sync (idempotente).
 * @returns {Promise<{exitosas: number, fallidas: number}>} Resumen.
 */
export async function vaciarOutbox() {
  const items = await operacionesPendientes()
  let exitosas = 0
  let fallidas = 0
  for (const item of items) {
    try {
      await api.sincronizar({ idempotency_key: item.id, operacion: item.operacion, datos: item.datos })
      await almacenamiento.eliminar('outbox', item.id)
      exitosas += 1
    } catch {
      fallidas += 1
    }
  }
  return { exitosas, fallidas }
}
