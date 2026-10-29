/**
 * @fileoverview Almacén del tripulante activo (contexto de registro), asociado al
 * id del usuario. Se persiste en localStorage con clave por usuario y se limpia al
 * cerrar sesión. Todo acceso a localStorage está protegido con try/catch.
 * @module features/gestion/almacenContexto
 */

import { create } from 'zustand'

/** Prefijo de la clave por usuario. */
const PREFIJO = 'ayni-tripulante-activo:'

/**
 * Clave de localStorage para un usuario.
 * @param {string | number | null} usuarioId - Id del usuario.
 * @returns {string} Clave.
 */
function clave(usuarioId) {
  return `${PREFIJO}${usuarioId ?? ''}`
}

/**
 * Lee el tripulante activo de un usuario de forma segura.
 * @param {string | number | null} usuarioId - Id del usuario.
 * @returns {string | null} Id guardado o null.
 */
function leer(usuarioId) {
  try {
    return localStorage.getItem(clave(usuarioId))
  } catch {
    return null
  }
}

/**
 * Guarda (o borra si es null) el tripulante activo de un usuario.
 * @param {string | number | null} usuarioId - Id del usuario.
 * @param {string | null} id - Id del tripulante activo.
 */
function persistir(usuarioId, id) {
  try {
    if (id) localStorage.setItem(clave(usuarioId), id)
    else localStorage.removeItem(clave(usuarioId))
  } catch {
    /* Almacenamiento no disponible. */
  }
}

/**
 * Store del tripulante activo (estado en memoria, persistencia por usuario).
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<object>>}
 */
export const useContextoTripulante = create((set) => ({
  tripulanteActivoId: null,
  /** Carga el valor persistido de un usuario (o lo limpia si es null). */
  cargarPara: (usuarioId) => set({ tripulanteActivoId: leer(usuarioId) }),
  /** Fija y persiste el tripulante activo de un usuario. */
  fijar: (usuarioId, id) => {
    persistir(usuarioId, id)
    set({ tripulanteActivoId: id })
  },
  /** Borra la selección de un usuario y limpia el estado en memoria. */
  limpiar: (usuarioId) => {
    persistir(usuarioId, null)
    set({ tripulanteActivoId: null })
  },
}))
