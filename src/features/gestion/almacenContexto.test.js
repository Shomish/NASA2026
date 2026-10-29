/**
 * @fileoverview Pruebas del almacén de contexto de tripulante (persistencia por usuario).
 * @module features/gestion/almacenContexto.test
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { useContextoTripulante } from './almacenContexto.js'

describe('almacenContexto (tripulante activo por usuario)', () => {
  beforeEach(() => {
    localStorage.clear()
    useContextoTripulante.setState({ tripulanteActivoId: null })
  })

  it('fija el tripulante activo y lo persiste en la clave del usuario', () => {
    useContextoTripulante.getState().fijar('u1', '5')
    expect(useContextoTripulante.getState().tripulanteActivoId).toBe('5')
    expect(localStorage.getItem('ayni-tripulante-activo:u1')).toBe('5')
  })

  it('no comparte la selección entre usuarios distintos', () => {
    useContextoTripulante.getState().fijar('u1', '5')
    useContextoTripulante.getState().fijar('u2', '7')
    expect(localStorage.getItem('ayni-tripulante-activo:u1')).toBe('5')
    expect(localStorage.getItem('ayni-tripulante-activo:u2')).toBe('7')
  })

  it('limpia la selección de un usuario al cerrar sesión', () => {
    useContextoTripulante.getState().fijar('u1', '5')
    useContextoTripulante.getState().limpiar('u1')
    expect(localStorage.getItem('ayni-tripulante-activo:u1')).toBeNull()
    expect(useContextoTripulante.getState().tripulanteActivoId).toBeNull()
  })

  it('carga la selección persistida de un usuario', () => {
    localStorage.setItem('ayni-tripulante-activo:u9', '12')
    useContextoTripulante.getState().cargarPara('u9')
    expect(useContextoTripulante.getState().tripulanteActivoId).toBe('12')
  })
})
