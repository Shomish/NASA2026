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

/** Conteo de alertas no leídas (para el badge del menú). */
export function useAlertasNoLeidas() {
  const { data } = useQuery({ queryKey: ['alertas', 'nueva'], queryFn: () => api.listarAlertas('nueva') })
  return Array.isArray(data) ? data.length : 0
}

/** Marca una alerta como leída y refresca el panel/badge. */
export function useLeerAlerta() {
  return useMutacion({ fn: api.leerAlerta, clave: ['alertas'], exito: 'Alerta marcada como leída.' })
}

/** Resuelve una alerta (médico/administrador) y refresca el panel/badge. */
export function useResolverAlerta() {
  return useMutacion({ fn: api.resolverAlerta, clave: ['alertas'], exito: 'Alerta resuelta.' })
}

/** Resumen de salud del tripulante activo. */
export function useResumen(tripulanteId) {
  return useQuery({
    queryKey: ['resumen', tripulanteId],
    queryFn: () => api.obtenerResumen(tripulanteId),
    enabled: tripulanteId != null,
  })
}

/** Avanza el día de misión (demo). */
export function useAvanzarDia() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: api.avanzarDiaDemo,
    onSuccess: () => {
      toast.success('Día de misión avanzado.')
      cliente.invalidateQueries({ queryKey: ['resumen'] })
      cliente.invalidateQueries({ queryKey: CLAVES.tripulantes })
      cliente.invalidateQueries({ queryKey: ['alertas'] })
    },
    onError: (e) => toast.error(e.message ?? 'No se pudo avanzar el día.'),
  })
}

/** Mutación genérica con invalidación y toast. */
function useMutacion({ fn, clave, clavesAdicionales = [], exito, errorMensaje = 'No se pudo completar la operación.' }) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      if (clave) cliente.invalidateQueries({ queryKey: clave })
      for (const k of clavesAdicionales) cliente.invalidateQueries({ queryKey: k })
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
export function useReactivarTripulante() {
  return useMutacion({ fn: api.reactivarTripulante, clave: CLAVES.tripulantes, exito: 'Tripulante reactivado.' })
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
export function useReactivarUsuario() {
  return useMutacion({ fn: api.reactivarUsuario, clave: CLAVES.usuarios, exito: 'Usuario reactivado.' })
}

export function useCrearRegistro() {
  return useMutacion({ fn: api.crearRegistro, clave: CLAVES.registros({}), clavesAdicionales: [['alertas'], ['resumen']], exito: 'Registro creado.' })
}
export function useValidarRegistro() {
  return useMutacion({ fn: api.validarRegistro, clave: CLAVES.registros({}), exito: 'Registro validado.' })
}
export function useCerrarRegistro() {
  return useMutacion({ fn: api.cerrarRegistro, clave: CLAVES.registros({}), exito: 'Registro cerrado.' })
}
export function useEliminarRegistro() {
  return useMutacion({ fn: api.eliminarRegistro, clave: CLAVES.registros({}), clavesAdicionales: [['alertas'], ['resumen']], exito: 'Registro eliminado.' })
}
export function useRestaurarRegistro() {
  return useMutacion({ fn: api.restaurarRegistro, clave: CLAVES.registros({}), clavesAdicionales: [['resumen']], exito: 'Registro restaurado.' })
}
