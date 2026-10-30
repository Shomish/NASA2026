/**
 * @fileoverview Pruebas de interpretación de PHQ-9 y GAD-7.
 * @module shared/evaluaciones.test
 */

import { describe, it, expect } from 'vitest'
import { interpretarPhq9, interpretarGad7, item9Phq9Positivo, sumarRespuestas } from './evaluaciones.js'

describe('interpretarPhq9', () => {
  it('clasifica por rangos 0-4, 5-9, 10-14, 15-19, 20-27', () => {
    expect(interpretarPhq9(0)).toBe('mínima')
    expect(interpretarPhq9(4)).toBe('mínima')
    expect(interpretarPhq9(5)).toBe('leve')
    expect(interpretarPhq9(9)).toBe('leve')
    expect(interpretarPhq9(10)).toBe('moderada')
    expect(interpretarPhq9(14)).toBe('moderada')
    expect(interpretarPhq9(15)).toBe('moderadamente severa')
    expect(interpretarPhq9(19)).toBe('moderadamente severa')
    expect(interpretarPhq9(20)).toBe('severa')
    expect(interpretarPhq9(27)).toBe('severa')
  })
})

describe('interpretarGad7', () => {
  it('clasifica por rangos 0-4, 5-9, 10-14, 15+', () => {
    expect(interpretarGad7(3)).toBe('mínima')
    expect(interpretarGad7(8)).toBe('leve')
    expect(interpretarGad7(12)).toBe('moderada')
    expect(interpretarGad7(20)).toBe('severa')
  })
})

describe('item9Phq9Positivo', () => {
  it('detecta la pregunta 9 positiva', () => {
    expect(item9Phq9Positivo([0, 0, 0, 0, 0, 0, 0, 0, 1])).toBe(true)
    expect(item9Phq9Positivo([0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(false)
    expect(item9Phq9Positivo([])).toBe(false)
  })
})

describe('sumarRespuestas', () => {
  it('suma las respuestas', () => {
    expect(sumarRespuestas([1, 2, 3])).toBe(6)
    expect(sumarRespuestas([])).toBe(0)
  })
})
