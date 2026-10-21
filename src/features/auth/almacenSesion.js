/**
 * @fileoverview Almacén de sesión en memoria (Zustand).
 * El access token vive SOLO en memoria (nunca en localStorage), según ADR-007.
 * @module features/auth/almacenSesion
 */

import { create } from 'zustand'
import { fijarTokenAcceso } from '../../shared/tokenAcceso.js'

/**
 * Estado de la sesión de autenticación.
 * @typedef {object} EstadoSesion
 * @property {string | null} accessToken - Token de acceso en memoria.
 * @property {object | null} usuario - Usuario autenticado.
 * @property {(token: string, usuario: object) => void} iniciar - Guarda la sesión.
 * @property {() => void} cerrar - Limpia la sesión.
 */

/**
 * Store de sesión (Zustand).
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<EstadoSesion>>}
 */
export const useAlmacenSesion = create((set) => ({
  accessToken: null,
  usuario: null,
  iniciar: (token, usuario) => {
    fijarTokenAcceso(token)
    set({ accessToken: token, usuario })
  },
  cerrar: () => {
    fijarTokenAcceso(null)
    set({ accessToken: null, usuario: null })
  },
}))
