/**
 * @fileoverview Pruebas de detección compartida de emergencias.
 * @module shared/emergencia.test
 */

import { describe, it, expect } from 'vitest'
import { PROTOCOLO_EMERGENCIA, detectarEmergencia, normalizarTexto } from './emergencia.js'

describe('normalizarTexto', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizarTexto('DOLOR EN EL PECHO, Saturación 84%')).toBe('dolor en el pecho, saturacion 84%')
  })
})

describe('detectarEmergencia', () => {
  it('detecta dolor en el pecho en español', () => {
    const resultado = detectarEmergencia('Tengo dolor en el pecho y me falta el aire')
    expect(resultado.emergencia).toBe(true)
    expect(resultado.motivos).toContain('dolor en el pecho')
  })

  it('detecta síntomas en inglés', () => {
    const resultado = detectarEmergencia('I have chest pain and shortness of breath')
    expect(resultado.emergencia).toBe(true)
    expect(resultado.motivos).toContain('chest pain')
  })

  it('detecta SpO₂ escrita por el usuario', () => {
    const resultado = detectarEmergencia('Mi saturación es 84%')
    expect(resultado.emergencia).toBe(true)
    expect(resultado.motivos.some((m) => m.includes('84'))).toBe(true)
  })

  it('detecta crisis de presión arterial', () => {
    const resultado = detectarEmergencia('', { presion_sistolica: 185, presion_diastolica: 125 })
    expect(resultado.emergencia).toBe(true)
    expect(resultado.motivos.length).toBeGreaterThanOrEqual(2)
  })

  it('no activa emergencia con un mensaje normal', () => {
    const resultado = detectarEmergencia('¿Cómo está mi salud hoy?')
    expect(resultado.emergencia).toBe(false)
    expect(resultado.motivos).toHaveLength(0)
  })

  it('expone el protocolo exacto', () => {
    expect(PROTOCOLO_EMERGENCIA).toContain('Posible emergencia')
    expect(PROTOCOLO_EMERGENCIA).toContain('No te automediques')
  })
})
