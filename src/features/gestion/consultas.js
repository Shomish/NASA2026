/**
 * @fileoverview Hooks de TanStack Query para el núcleo (tripulantes, registros, usuarios).
 * Usan la caché de IndexedDB como respaldo de último recurso (stale-while-revalidate).
 * @module features/gestion/consultas
 */

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../presentacion/sistema/Tostada.jsx'
import * as api from './api.js'
import { leerCache, escribirCache } from './cache.js'

/** Claves de consulta. */
export const CLAVES = {
  tripulantes: ['tripulantes'],
  registros: (filtros) => ['registros', filtros],
  usuarios: ['usuarios'],
}

/**
 * Consulta con respaldo de caché IndexedDB (hidrata y luego refresca).
 * @param {string[]} clave - Clave de consulta.
 * @param {() => Promise<any>} fn - Función de consulta.
 * @param {string} claveCache - Clave de caché.
 */
function useConsultaCaché(clave, fn, claveCache) {
  const cliente = useQueryClient()
  const consulta = useQuery({ queryKey: clave, queryFn: fn })

  // Hidrata una sola vez al montar (respaldo de último recurso, no fuente de verdad).
  useEffect(() => {
    let activo = true
    leerCache(claveCache).then((datos) => {
      if (activo && datos) cliente.setQueryData(clave, datos)
    })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (consulta.data !== undefined) escribirCache(claveCache, consulta.data)
  }, [consulta.data, claveCache])

  return consulta
}

/** Lista de tripulantes. */
export function useTripulantes() {
  return useConsultaCaché(CLAVES.tripulantes, api.listarTripulantes, 'cache-tripulantes')
}

/** Lista de usuarios (administrador). */
export function useUsuarios() {
  return useConsultaCaché(CLAVES.usuarios, api.listarUsuarios, 'cache-usuarios')
}

/** Lista de registros con filtros. */
export function useRegistros(filtros = {}) {
  return useConsultaCaché(CLAVES.registros(filtros), () => api.listarRegistros(filtros), 'cache-registros')
}

/** Mutación genérica con invalidación y toast. */
function useMutacion({ fn, clave, exito, errorMensaje = 'No se pudo completar la operación.' }) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      if (clave) cliente.invalidateQueries({ queryKey: clave })
      if (exito) toast.success(exito)
    },
    onError: (error) => {
      toast.error(error.message ?? errorMensaje)
    },
  })
}

export function useCrearTripulante() {
  return useMutacion({ fn: api.crearTripulante, clave: CLAVES.tripulantes, exito: 'Tripulante creado.' })
}
export function useEditarTripulante() {
  return useMutacion({ fn: ({ id, datos }) => api.editarTripulante(id, datos), clave: CLAVES.tripulantes, exito: 'Tripulante actualizado.' })
}
export function useEliminarTripulante() {
  return useMutacion({ fn: api.eliminarTripulante, clave: CLAVES.tripulantes, exito: 'Tripulante desactivado.' })
}

export function useCrearUsuario() {
  return useMutacion({ fn: api.crearUsuario, clave: CLAVES.usuarios, exito: 'Usuario creado.' })
}
export function useCambiarRolUsuario() {
  return useMutacion({ fn: ({ id, rol }) => api.cambiarRolUsuario(id, rol), clave: CLAVES.usuarios, exito: 'Rol actualizado.' })
}
export function useDesactivarUsuario() {
  return useMutacion({ fn: api.desactivarUsuario, clave: CLAVES.usuarios, exito: 'Usuario desactivado.' })
}

export function useCrearRegistro() {
  return useMutacion({ fn: api.crearRegistro, clave: CLAVES.registros({}), exito: 'Registro creado.' })
}
export function useValidarRegistro() {
  return useMutacion({ fn: api.validarRegistro, clave: CLAVES.registros({}), exito: 'Registro validado.' })
}
export function useCerrarRegistro() {
  return useMutacion({ fn: api.cerrarRegistro, clave: CLAVES.registros({}), exito: 'Registro cerrado.' })
}
export function useEliminarRegistro() {
  return useMutacion({ fn: api.eliminarRegistro, clave: CLAVES.registros({}), exito: 'Registro eliminado.' })
}
export function useRestaurarRegistro() {
  return useMutacion({ fn: api.restaurarRegistro, clave: CLAVES.registros({}), exito: 'Registro restaurado.' })
}
