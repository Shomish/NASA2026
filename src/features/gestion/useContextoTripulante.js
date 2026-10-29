/**
 * @fileoverview Hook de contexto de tripulante (saber siempre a quién se registra).
 * Combina la lista de tripulantes del servidor, el rol del usuario y el id activo
 * persistido por usuario en localStorage. Para el rol tripulante el contexto queda
 * fijo en su propio perfil (sin selector).
 * @module features/gestion/useContextoTripulante
 */

import { useEffect, useMemo } from 'react'
import { useTripulantes } from './consultas.js'
import { useContextoTripulante as useContextoStore } from './almacenContexto.js'
import { useAlmacenSesion } from '../auth/almacenSesion.js'

/**
 * Contexto de tripulante activo.
 * @returns {object} { usuario, esTripulante, tripulantes, tripulanteActivo, cambiar, sinPerfil }.
 */
export function useContextoTripulante() {
  const usuario = useAlmacenSesion((s) => s.usuario)
  const esTripulante = usuario?.rol === 'tripulante'
  const { data } = useTripulantes()
  const tripulantes = Array.isArray(data) ? data : []

  const tripulanteActivoId = useContextoStore((s) => s.tripulanteActivoId)

  // Carga el tripulante activo del usuario actual (o limpia si no hay sesión).
  useEffect(() => {
    useContextoStore.getState().cargarPara(usuario?.id ?? null)
  }, [usuario?.id])

  // Resuelve el tripulante activo: el id guardado o el primero de la lista.
  const tripulanteActivo = useMemo(() => {
    if (tripulantes.length === 0) return null
    const porId = tripulantes.find((t) => String(t.id) === String(tripulanteActivoId))
    return porId ?? tripulantes[0]
  }, [tripulantes, tripulanteActivoId])

  // Si el id guardado ya no existe (eliminado), vuelve al primero y lo persiste.
  useEffect(() => {
    if (!esTripulante && tripulanteActivo && String(tripulanteActivo.id) !== String(tripulanteActivoId) && usuario?.id) {
      useContextoStore.getState().fijar(usuario.id, String(tripulanteActivo.id))
    }
  }, [esTripulante, tripulanteActivo, tripulanteActivoId, usuario?.id])

  return {
    usuario,
    esTripulante,
    tripulantes,
    tripulanteActivo,
    sinPerfil: esTripulante && tripulantes.length === 0,
    cambiar: (id) => {
      if (usuario?.id) useContextoStore.getState().fijar(usuario.id, String(id))
    },
  }
}
