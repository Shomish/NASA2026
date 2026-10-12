/**
 * @fileoverview Pruebas de la utilidad `cn` (tailwind-merge + clsx).
 * @module presentacion/sistema/cn.test
 */

import { describe, it, expect } from 'vitest'
import { cn } from './cn.js'

describe('cn (combinación de clases)', () => {
  it('concatena clases simples', () => {
    expect(cn('uno', 'dos', 'tres')).toBe('uno dos tres')
  })

  it('resuelve conflictos de Tailwind (gana la última)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    expect(cn('text-sm', 'text-lg', 'text-base')).toBe('text-base')
  })

  it('ignora valores falsos, null e undefined', () => {
    const condicionFalsa = false
    expect(cn('a', condicionFalsa && 'b', null, undefined, 'c')).toBe('a c')
  })
})
