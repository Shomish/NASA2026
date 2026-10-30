/**
 * @fileoverview Pruebas de exportación CSV y protección contra inyección de fórmulas.
 * @module features/gestion/exportacion.test
 */

import { describe, it, expect } from 'vitest'
import { protegerCelda, aCsv } from './exportacion.js'

describe('protegerCelda', () => {
  it('prefija con comilla las celdas que empiezan con =, +, - o @', () => {
    expect(protegerCelda('=1+1')).toBe("'=1+1")
    expect(protegerCelda('+cmd')).toBe("'+cmd")
    expect(protegerCelda('-2')).toBe("'-2")
    expect(protegerCelda('@import')).toBe("'@import")
  })

  it('no altera celdas normales', () => {
    expect(protegerCelda('hola')).toBe('hola')
    expect(protegerCelda(123)).toBe('123')
    expect(protegerCelda(null)).toBe('')
  })
})

describe('aCsv', () => {
  it('serializa filas con cabecera y BOM', () => {
    const csv = aCsv([{ codigo: 'ABC', nota: '=1' }], ['codigo', 'nota'])
    expect(csv).toContain('codigo,nota')
    expect(csv).toContain("ABC,'=1")
    expect(csv.startsWith('\uFEFF')).toBe(true)
  })
})
