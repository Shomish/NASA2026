/**
 * @fileoverview Pruebas del adaptador de almacenamiento (IndexedDB) con fake-indexeddb.
 * Cubre: guardar/leer un tripulante, pérdida de métodos del prototipo y carga con datos corruptos.
 * @module infraestructura/almacenamiento.test
 */

import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { AdaptadorAlmacenamiento } from './indice.js'
import { calcularIMC, sanitizarTripulante } from '../dominio/indice.js'

/** Datos planos de un tripulante de ejemplo. */
const datosAna = {
  id: 'ana-quispe',
  nombre: 'Ana Quispe',
  rol: 'Comandante',
  edad: 38,
  sexo: 'femenino',
  pesoKg: 62,
  alturaCm: 165,
  diaMision: 120,
  mision: 'Misión Artemis',
  destino: 'Tránsito a Marte',
  condiciones: ['perdida_osea'],
  alergias: ['lactosa'],
  objetivoSalud: 'Mantener densidad ósea',
}

describe('AdaptadorAlmacenamiento (IndexedDB)', () => {
  it('guarda y lee un tripulante; el IMC se calcula con datos planos sin depender de métodos', async () => {
    const adaptador = new AdaptadorAlmacenamiento('test_guardar_leer')
    await adaptador.guardar('tripulacion', datosAna)

    const leidos = await adaptador.obtenerTodos('tripulacion')
    expect(leidos).toHaveLength(1)

    // IndexedDB devuelve objetos planos: los métodos del prototipo se pierden.
    expect(typeof leidos[0].imc).toBe('undefined')

    // La función pura calcularIMC funciona con el objeto plano leído.
    expect(calcularIMC(leidos[0].pesoKg, leidos[0].alturaCm)).toBe(22.8)

    // La rehidratación restaura la instancia y su método.
    const persona = sanitizarTripulante(leidos[0])
    expect(persona.imc()).toBe(22.8)
  })

  it('filtra datos viejos o corruptos sin romper la carga', async () => {
    const adaptador = new AdaptadorAlmacenamiento('test_corruptos')
    await adaptador.guardar('tripulacion', { id: 'corrupto-sin-nombre' })
    await adaptador.guardar('tripulacion', 'dato-invalido')
    await adaptador.guardar('tripulacion', datosAna)

    const leidos = await adaptador.obtenerTodos('tripulacion')
    const validos = leidos.map(sanitizarTripulante).filter(Boolean)

    expect(validos).toHaveLength(1)
    expect(validos[0].nombre).toBe('Ana Quispe')
    expect(validos[0].imc()).toBe(22.8)
  })
})
