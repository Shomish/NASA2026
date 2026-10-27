/**
 * @fileoverview Prueba de regresión: rehidratación de datos viejos de IndexedDB.
 * Escenario que originó la pantalla negra: datos planos (sin métodos) leídos de
 * IndexedDB. Verifica que el store de Zustand los rehidrata y no rompe.
 *
 * Procedimiento manual para reproducir:
 * 1. Guardar datos en la app (tripulantes y mediciones) → se persisten en IndexedDB.
 * 2. Recargar la página (F5): el store llama a `cargar()`, que lee objetos planos
 *    (sin los métodos del prototipo) y los rehidrata con `sanitizarTripulante`.
 * 3. Verificar que el dashboard y el monitor muestran los datos sin error
 *    "imc is not a function".
 * @module features/salud/almacen.test
 */

import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { useSaludStore } from './almacen.js'
import { calcularIMC, Astronauta } from '../../dominio/indice.js'

/** Nombre de la base que usa el adaptador del store. */
const NOMBRE_BASE = 'salud_astronauta_db'

/**
 * Siembra IndexedDB con datos planos del esquema anterior (v1/v2, sin métodos).
 * @returns {Promise<void>} Promesa.
 */
async function sembrarDatosViejos() {
  return new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open(NOMBRE_BASE, 2)
    solicitud.onupgradeneeded = () => {
      const base = solicitud.result
      if (!base.objectStoreNames.contains('tripulacion')) base.createObjectStore('tripulacion', { keyPath: 'id' })
      if (!base.objectStoreNames.contains('historial')) base.createObjectStore('historial', { keyPath: 'id' })
    }
    solicitud.onsuccess = () => {
      const base = solicitud.result
      const tx = base.transaction(['tripulacion', 'historial'], 'readwrite')
      // Objeto PLANO (sin métodos del prototipo), como lo devuelve IndexedDB.
      tx.objectStore('tripulacion').put({ id: 'ana-quispe', nombre: 'Ana Quispe', rol: 'Comandante', edad: 38, sexo: 'femenino', pesoKg: 62, alturaCm: 165, diaMision: 120, mision: 'Artemis', destino: 'Marte', condiciones: ['perdida_osea'], alergias: ['lactosa'], objetivoSalud: 'densidad ósea' })
      tx.objectStore('historial').put({ id: 'r1', personaId: 'ana-quispe', tipo: 'signo', signoTipo: 'frecuencia_cardiaca', valor: 72, instante: new Date().toISOString() })
      tx.oncomplete = () => { base.close(); resolver() }
      tx.onerror = () => rechazar(tx.error)
    }
    solicitud.onerror = () => rechazar(solicitud.error)
  })
}

describe('rehidratación de datos viejos de IndexedDB', () => {
  it('rehidrata tripulantes planos y registros sin romper (sin "imc is not a function")', async () => {
    useSaludStore.setState({ tripulacion: [], personaId: '', historial: [] })
    await sembrarDatosViejos()
    await useSaludStore.getState().cargar()

    const tripulacion = useSaludStore.getState().tripulacion
    expect(tripulacion).toHaveLength(1)
    const persona = tripulacion[0]
    // El objeto plano fue rehidratado a una entidad con métodos.
    expect(persona).toBeInstanceOf(Astronauta)
    // El IMC se calcula sin lanzar "imc is not a function".
    expect(persona.imc()).toBe(22.8)
    expect(calcularIMC(persona.pesoKg, persona.alturaCm)).toBe(22.8)

    const historial = useSaludStore.getState().historial
    expect(historial).toHaveLength(1)
    expect(historial[0].signoTipo).toBe('frecuencia_cardiaca')
  })
})
