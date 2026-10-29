/**
 * @fileoverview Pruebas de estabilidad de referencias de los selectores derivados.
 * Verifica que los hooks devuelven referencias estables entre renders (uso de useMemo)
 * y no arreglos/objetos nuevos en cada llamada, que provocarían un bucle infinito.
 * @module features/salud/selectores.test
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSaludStore, usePersona, useRegistrosPersona, useSignos } from './almacen.js'

describe('selectores derivados (referencias estables)', () => {
  beforeEach(() => {
    useSaludStore.setState({
      tripulacion: [{ id: 'ana-quispe', nombre: 'Ana Quispe' }, { id: 'diego-mamani', nombre: 'Diego Mamani' }],
      personaId: 'ana-quispe',
      historial: [
        { id: 'r1', personaId: 'ana-quispe', tipo: 'signo', signoTipo: 'frecuencia_cardiaca', valor: 72, instante: new Date().toISOString() },
        { id: 'r2', personaId: 'diego-mamani', tipo: 'signo', signoTipo: 'saturacion_oxigeno', valor: 96, instante: new Date().toISOString() },
      ],
    })
  })

  it('useRegistrosPersona devuelve la misma referencia entre renders', () => {
    const { result, rerender } = renderHook(() => useRegistrosPersona())
    const primera = result.current
    rerender()
    expect(result.current).toBe(primera)
  })

  it('useSignos devuelve la misma referencia entre renders', () => {
    const { result, rerender } = renderHook(() => useSignos())
    const primera = result.current
    rerender()
    expect(result.current).toBe(primera)
  })

  it('usePersona devuelve la misma referencia entre renders', () => {
    const { result, rerender } = renderHook(() => usePersona())
    const primera = result.current
    rerender()
    expect(result.current).toBe(primera)
  })

  it('recalcula (nueva referencia) cuando cambia el historial', () => {
    const { result } = renderHook(() => useRegistrosPersona())
    const antes = result.current
    act(() => {
      useSaludStore.getState().agregarRegistro({ tipo: 'signo', signoTipo: 'frecuencia_cardiaca', valor: 80 })
    })
    expect(result.current).not.toBe(antes)
  })
})
