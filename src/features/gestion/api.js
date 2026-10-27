/**
 * @fileoverview Cliente de API del núcleo (tripulantes, registros, usuarios).
 * Adjunta el access token en memoria y traduce errores a mensajes legibles.
 * @module features/gestion/api
 */

import { obtenerTokenAcceso } from '../../shared/tokenAcceso.js'

/** Base de la API versionada. */
const BASE = import.meta.env.VITE_API_URL || '/api/v1'

/**
 * Petición autenticada. Lanza un Error con `codigo` y `estado` si falla.
 * @param {string} ruta - Ruta relativa.
 * @param {object} [opciones] - Opciones.
 * @param {string} [opciones.metodo] - Método HTTP.
 * @param {object} [opciones.cuerpo] - Cuerpo JSON.
 * @returns {Promise<any>} Respuesta parseada (null si 204).
 */
async function peticion(ruta, { metodo = 'GET', cuerpo } = {}) {
  const token = obtenerTokenAcceso()
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  if (respuesta.status === 204) return null
  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje ?? 'Error en la petición')
    error.codigo = datos.codigo
    error.estado = respuesta.status
    throw error
  }
  return datos
}

/* ============ Tripulantes ============ */

/** Lista los tripulantes (el servidor filtra por rol). */
export function listarTripulantes() {
  return peticion('/tripulantes')
}

/** Crea un tripulante (solo administrador). */
export function crearTripulante(datos) {
  return peticion('/tripulantes', { metodo: 'POST', cuerpo: datos })
}

/** Edita un tripulante (solo administrador). */
export function editarTripulante(id, datos) {
  return peticion(`/tripulantes/${id}`, { metodo: 'PUT', cuerpo: datos })
}

/** Desactiva un tripulante (borrado lógico, solo administrador). */
export function eliminarTripulante(id) {
  return peticion(`/tripulantes/${id}`, { metodo: 'DELETE' })
}

/* ============ Registros ============ */

/**
 * Lista registros con filtros y paginación.
 * @param {object} [filtros] - Filtros.
 */
export function listarRegistros(filtros = {}) {
  const parametros = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, valor)
  }
  const cadena = parametros.toString()
  return peticion(`/registros${cadena ? `?${cadena}` : ''}`)
}

/** Crea un registro (cabecera + detalle) y devuelve código y estado. */
export function crearRegistro(datos) {
  return peticion('/registros', { metodo: 'POST', cuerpo: datos })
}

/** Edita el detalle de un registro (no cerrado). */
export function editarRegistro(id, detalle) {
  return peticion(`/registros/${id}`, { metodo: 'PUT', cuerpo: { detalle } })
}

/** Valida un registro (médico o administrador). */
export function validarRegistro(id) {
  return peticion(`/registros/${id}/validar`, { metodo: 'PUT' })
}

/** Cierra un registro validado (médico o administrador). */
export function cerrarRegistro(id) {
  return peticion(`/registros/${id}/cerrar`, { metodo: 'PUT' })
}

/** Borra lógicamente un registro. */
export function eliminarRegistro(id) {
  return peticion(`/registros/${id}`, { metodo: 'DELETE' })
}

/** Restaura un registro borrado lógicamente. */
export function restaurarRegistro(id) {
  return peticion(`/registros/${id}/restaurar`, { metodo: 'POST' })
}

/* ============ Usuarios ============ */

/** Lista los usuarios (solo administrador). */
export function listarUsuarios() {
  return peticion('/usuarios')
}

/** Crea un usuario con rol (solo administrador). */
export function crearUsuario(datos) {
  return peticion('/usuarios', { metodo: 'POST', cuerpo: datos })
}

/** Cambia el rol de un usuario (solo administrador). */
export function cambiarRolUsuario(id, rol) {
  return peticion(`/usuarios/${id}/rol`, { metodo: 'PUT', cuerpo: { rol } })
}

/** Desactiva un usuario (solo administrador). */
export function desactivarUsuario(id) {
  return peticion(`/usuarios/${id}/desactivar`, { metodo: 'PUT' })
}
