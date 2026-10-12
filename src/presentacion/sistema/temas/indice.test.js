/**
 * @fileoverview Pruebas del registro de temas (estructura y cambio de paleta).
 * @module presentacion/sistema/temas/indice.test
 */

import { describe, it, expect } from 'vitest'
import { temas, obtenerTema } from './indice.js'

/** Tokens de color que todo tema debe definir en claro y oscuro. */
const CLAVES_REQUERIDAS = [
  'fondo',
  'superficie',
  'superficie-elevada',
  'superficie-alta',
  'borde',
  'borde-fuerte',
  'tinta',
  'tinta-suave',
  'primario',
  'primario-fuerte',
  'secundario',
  'secundario-fuerte',
  'acento',
  'exito',
  'advertencia',
  'advertencia-fuerte',
  'critico',
  'andino-dorado',
  'andino-terracota',
]

describe('registro de temas', () => {
  it('tiene 3 temas (Cusco, Sacsayhuamán y Cosmos)', () => {
    expect(temas).toHaveLength(3)
  })

  it('cada tema define todos los tokens en modo claro y oscuro', () => {
    for (const tema of temas) {
      for (const clave of CLAVES_REQUERIDAS) {
        expect(tema.oscuro[clave], `${tema.id} · oscuro · ${clave}`).toBeTruthy()
        expect(tema.claro[clave], `${tema.id} · claro · ${clave}`).toBeTruthy()
      }
    }
  })

  it('cada tema tiene una secuencia de colores para gráficos', () => {
    for (const tema of temas) {
      expect(tema.series.length).toBeGreaterThan(0)
    }
  })

  it('obtenerTema devuelve el tema por defecto (Cusco) ante un id desconocido o ausente', () => {
    expect(obtenerTema('invalido').id).toBe('cusco')
    expect(obtenerTema(undefined).id).toBe('cusco')
  })

  it('obtenerTema devuelve la paleta solicitada (cambio de paleta)', () => {
    expect(obtenerTema('sacsayhuaman').id).toBe('sacsayhuaman')
    expect(obtenerTema('cosmos').id).toBe('cosmos')
  })
})
