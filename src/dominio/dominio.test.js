/**
 * @fileoverview Pruebas del dominio: cálculo de IMC y rehidratación de tripulantes.
 * @module dominio/dominio.test
 */

import { describe, it, expect } from 'vitest'
import { Astronauta, calcularIMC, crearPersona, sanitizarTripulante } from './indice.js'

describe('calcularIMC (función pura)', () => {
  it('calcula el IMC correctamente a partir de peso y talla', () => {
    expect(calcularIMC(62, 165)).toBe(22.8)
    expect(calcularIMC(78, 178)).toBe(24.6)
    expect(calcularIMC(58, 160)).toBe(22.7)
  })

  it('devuelve 0 cuando faltan peso o talla (no lanza error)', () => {
    expect(calcularIMC(0, 165)).toBe(0)
    expect(calcularIMC(62, 0)).toBe(0)
    expect(calcularIMC(undefined, undefined)).toBe(0)
  })
})

describe('sanitizarTripulante (rehidratación + validación)', () => {
  it('rehidrata un objeto plano válido a una instancia de Astronauta', () => {
    const plano = { id: 'ana', nombre: 'Ana Quispe', pesoKg: 62, alturaCm: 165 }
    const persona = sanitizarTripulante(plano)
    expect(persona).toBeInstanceOf(Astronauta)
    expect(persona.imc()).toBe(22.8)
  })

  it('descarta registros corruptos o con campos obligatorios ausentes', () => {
    expect(sanitizarTripulante(null)).toBe(null)
    expect(sanitizarTripulante(undefined)).toBe(null)
    expect(sanitizarTripulante('texto')).toBe(null)
    expect(sanitizarTripulante({})).toBe(null)
    expect(sanitizarTripulante({ id: 'sin-nombre' })).toBe(null)
  })
})

describe('crearPersona (rehidratación simple)', () => {
  it('restaura una instancia a partir de datos planos', () => {
    const persona = crearPersona({ id: 'diego', nombre: 'Diego', pesoKg: 78, alturaCm: 178 })
    expect(persona.imc()).toBe(24.6)
  })
})
