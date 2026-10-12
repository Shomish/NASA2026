/**
 * @fileoverview Pruebas del cálculo de contraste WCAG.
 * @module presentacion/sistema/temas/contraste.test
 */

import { describe, it, expect } from 'vitest'
import { contrasteWCAG, cumpleAA, rgbAHex, hexARgb } from './contraste.js'

describe('contrasteWCAG', () => {
  it('calcula el contraste entre blanco y negro como 21:1', () => {
    expect(contrasteWCAG('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('calcula el contraste entre colores iguales como 1:1', () => {
    expect(contrasteWCAG('#888888', '#888888')).toBeCloseTo(1, 1)
  })

  it('verifica que el texto claro sobre el fondo oscuro de Cusco cumple AA', () => {
    const cumple = cumpleAA('#F7F1E8', '#12100E')
    expect(cumple).toBe(true)
  })
})

describe('conversiones', () => {
  it('convierte canal RGB a hexadecimal y viceversa', () => {
    expect(rgbAHex('18 16 14')).toBe('#12100e')
    expect(hexARgb('#12100e')).toBe('18 16 14')
  })
})
