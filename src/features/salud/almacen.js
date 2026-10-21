/**
 * @fileoverview Almacén de salud (Zustand): tripulación, historial y CRUD.
 * Sustituye el estado que vivía en App.jsx, para que cada feature lo consuma.
 * @module features/salud/almacen
 */

import { create } from 'zustand'
import { tripulacionInicial } from '../../datos/mockDatos.js'
import { AdaptadorAlmacenamiento, AdaptadorApi, generarId } from '../../infraestructura/indice.js'
import { evaluarSignoVital, sanitizarTripulante } from '../../dominio/indice.js'

/** Historial inicial de demostración. */
function historialInicial() {
  const ahora = Date.now()
  const dia = 86400000
  return [
    { id: generarId(), personaId: 'ana-quispe', tipo: 'signo', signoTipo: 'frecuencia_cardiaca', valor: 72, instante: new Date(ahora - 2 * dia).toISOString() },
    { id: generarId(), personaId: 'ana-quispe', tipo: 'signo', signoTipo: 'saturacion_oxigeno', valor: 97, instante: new Date(ahora - 2 * dia).toISOString() },
    { id: generarId(), personaId: 'ana-quispe', tipo: 'sueno', horas: 8, calidad: 8, interrupciones: 1, instante: new Date(ahora - 1 * dia).toISOString() },
    { id: generarId(), personaId: 'ana-quispe', tipo: 'mental', cuestionario: 'phq9', puntaje: 4, instante: new Date(ahora - 1 * dia).toISOString() },
    { id: generarId(), personaId: 'diego-mamani', tipo: 'signo', signoTipo: 'saturacion_oxigeno', valor: 96, instante: new Date(ahora - 1 * dia).toISOString() },
  ]
}

const almacenamiento = new AdaptadorAlmacenamiento()
const api = new AdaptadorApi()

/**
 * Store de salud.
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<object>>}
 */
export const useSaludStore = create((set, get) => ({
  tripulacion: tripulacionInicial,
  personaId: 'ana-quispe',
  historial: historialInicial(),

  /**
   * Carga los datos persistidos desde IndexedDB.
   */
  cargar: async () => {
    try {
      const [tripulacionGuardada, historialGuardado] = await Promise.all([
        almacenamiento.obtenerTodos('tripulacion'),
        almacenamiento.obtenerTodos('historial'),
      ])
      set({
        tripulacion: tripulacionGuardada?.length ? tripulacionGuardada.map(sanitizarTripulante).filter(Boolean) : get().tripulacion,
        historial: historialGuardado?.length ? historialGuardado : get().historial,
      })
    } catch {
      /* Conserva datos de demostración. */
    }
  },

  /**
   * Fija el tripulante activo.
   * @param {string} id - Identificador.
   */
  setPersonaId: (id) => set({ personaId: id }),

  /**
   * Crea o actualiza un tripulante.
   * @param {object} datos - Datos del tripulante.
   */
  guardarPersona: (datos) => {
    set((estado) => ({
      tripulacion: estado.tripulacion.some((p) => p.id === datos.id)
        ? estado.tripulacion.map((p) => (p.id === datos.id ? { ...p, ...datos } : p))
        : [...estado.tripulacion, datos],
      personaId: datos.id,
    }))
    almacenamiento.guardar('tripulacion', datos).catch(() => {})
  },

  /**
   * Elimina un tripulante y sus registros.
   * @param {string} id - Identificador.
   */
  eliminarPersona: (id) => {
    set((estado) => ({
      tripulacion: estado.tripulacion.filter((p) => p.id !== id),
      historial: estado.historial.filter((r) => r.personaId !== id),
      personaId: estado.personaId === id ? estado.tripulacion.find((p) => p.id !== id)?.id ?? '' : estado.personaId,
    }))
  },

  /**
   * Agrega un registro de salud (y genera alerta si es crítico).
   * @param {object} registro - Registro.
   */
  agregarRegistro: (registro) => {
    const personaId = get().personaId
    const nuevo = { id: generarId(), personaId, instante: new Date().toISOString(), ...registro }
    set((estado) => ({ historial: [...estado.historial, nuevo] }))
    almacenamiento.guardar('historial', nuevo).catch(() => {})

    if (registro.tipo === 'signo') {
      const estado = evaluarSignoVital(registro.signoTipo, registro.valor)
      if (estado === 'critico') {
        const alerta = { id: generarId(), personaId, tipo: 'alerta', severidad: 'critico', mensaje: `Signo vital crítico: ${registro.signoTipo} = ${registro.valor}`, leida: false, instante: new Date().toISOString() }
        set((s) => ({ historial: [...s.historial, alerta] }))
        almacenamiento.guardar('historial', alerta).catch(() => {})
      }
      const signos = calcularSignos(get().historial, personaId)
      api.guardarRegistro({ ...signos, [registro.signoTipo]: registro.valor }).catch(() => {})
    }
  },

  /**
   * Elimina un registro.
   * @param {string} id - Identificador.
   */
  eliminarRegistro: (id) => {
    set((estado) => ({ historial: estado.historial.filter((r) => r.id !== id) }))
  },

  /**
   * Marca una alerta como leída.
   * @param {string} id - Identificador.
   */
  marcarAlertaLeida: (id) => {
    set((estado) => ({
      historial: estado.historial.map((r) => (r.id === id && r.tipo === 'alerta' ? { ...r, leida: true } : r)),
    }))
  },
}))

/**
 * Calcula los signos vitales actuales de un tripulante a partir del historial.
 * @param {object[]} historial - Registros.
 * @param {string} personaId - Id del tripulante.
 * @returns {object} Signos vitales actuales.
 */
export function calcularSignos(historial, personaId) {
  const resultado = {}
  for (const r of historial) {
    if (r.personaId === personaId && r.tipo === 'signo') resultado[r.signoTipo] = r.valor
  }
  return resultado
}

/**
 * Hook: tripulante activo.
 * @returns {object | null} Persona activa.
 */
export function usePersona() {
  return useSaludStore((s) => s.tripulacion.find((p) => p.id === s.personaId) ?? s.tripulacion[0] ?? null)
}

/**
 * Hook: registros del tripulante activo (ordenados).
 * @returns {object[]} Registros.
 */
export function useRegistrosPersona() {
  return useSaludStore((s) =>
    s.historial.filter((r) => r.personaId === s.personaId).sort((a, b) => new Date(a.instante) - new Date(b.instante)),
  )
}

/**
 * Hook: signos vitales del tripulante activo.
 * @returns {object} Signos vitales.
 */
export function useSignos() {
  return useSaludStore((s) => calcularSignos(s.historial, s.personaId))
}
