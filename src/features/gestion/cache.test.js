/**
 * @fileoverview Pruebas del sanitizador de caché de IndexedDB.
 * Verifica que los datos viejos o malformados se descartan y no se usan como
 * fuente de verdad (la caché nunca sustituye al servidor).
 * @module features/gestion/cache.test
 */

import { describe, it, expect } from 'vitest'
import { sanitizarCache } from './cache.js'

describe('sanitizarCache', () => {
  it('acepta una entrada válida y reciente', () => {
    const entrada = { version: 1, guardado_en: Date.now(), datos: { lista: [1, 2, 3] } }
    expect(sanitizarCache(entrada)).toEqual({ lista: [1, 2, 3] })
  })

  it('descarta datos de una versión vieja del esquema', () => {
    const entrada = { version: 0, guardado_en: Date.now(), datos: { viejo: true } }
    expect(sanitizarCache(entrada)).toBeNull()
  })

  it('descarta datos demasiado viejos (TTL vencido)', () => {
    const entrada = { version: 1, guardado_en: Date.now() - 48 * 3600 * 1000, datos: { lista: [] } }
    expect(sanitizarCache(entrada)).toBeNull()
  })

  it('descarta entradas malformadas sin romper', () => {
    expect(sanitizarCache(null)).toBeNull()
    expect(sanitizarCache(undefined)).toBeNull()
    expect(sanitizarCache('no-objeto')).toBeNull()
    expect(sanitizarCache([1, 2, 3])).toBeNull()
    expect(sanitizarCache({ version: 1 })).toBeNull()
  })
})
