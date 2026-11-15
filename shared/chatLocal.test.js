/**
 * @fileoverview Pruebas de las respuestas locales del chat por intención.
 * @module shared/chatLocal.test
 */

import { describe, it, expect } from 'vitest'
import { AVISO_LEGAL, detectarIntencionLocal, respuestaLocal } from './chatLocal.js'

describe('detectarIntencionLocal', () => {
  it('detecta síntomas leves', () => {
    expect(detectarIntencionLocal('me duele la cabeza')).toBe('sintomas')
    expect(detectarIntencionLocal('tengo nausea y mareo')).toBe('sintomas')
    expect(detectarIntencionLocal('I have a headache')).toBe('sintomas')
  })

  it('detecta alimentación e hidratación', () => {
    expect(detectarIntencionLocal('¿qué comida me recomiendas?')).toBe('alimentacion')
    expect(detectarIntencionLocal('necesito hidratación')).toBe('alimentacion')
    expect(detectarIntencionLocal('what should I eat?')).toBe('alimentacion')
  })

  it('detecta sueño', () => {
    expect(detectarIntencionLocal('no puedo dormir')).toBe('sueno')
    expect(detectarIntencionLocal('tengo insomnio')).toBe('sueno')
    expect(detectarIntencionLocal('I cannot sleep')).toBe('sueno')
  })

  it('detecta ánimo bajo', () => {
    expect(detectarIntencionLocal('estoy triste')).toBe('animo')
    expect(detectarIntencionLocal('me siento solo')).toBe('animo')
    expect(detectarIntencionLocal('I feel anxious')).toBe('animo')
  })

  it('detecta la emergencia por ideación de daño', () => {
    expect(detectarIntencionLocal('quiero morir')).toBe('emergencia')
    expect(detectarIntencionLocal('pienso en hacerme daño')).toBe('emergencia')
    expect(detectarIntencionLocal('I want to die')).toBe('emergencia')
  })

  it('usa el mensaje por defecto para texto desconocido', () => {
    expect(detectarIntencionLocal('xyz')).toBe('defecto')
  })
})

describe('respuestaLocal', () => {
  it('responde a síntomas leves en español', () => {
    const { intencion, texto } = respuestaLocal('me duele la cabeza', 'es')
    expect(intencion).toBe('sintomas')
    expect(texto).toMatch(/descansa/i)
    expect(texto).toMatch(/médico de vuelo/i)
  })

  it('responde a sueño con la meta de 7 horas', () => {
    const { texto } = respuestaLocal('no puedo dormir', 'es')
    expect(texto).toMatch(/7 horas/i)
    expect(texto).toMatch(/Watson/i)
  })

  it('responde a ánimo bajo con PHQ-9 y GAD-7', () => {
    const { texto } = respuestaLocal('estoy triste', 'es')
    expect(texto).toMatch(/PHQ-9/i)
    expect(texto).toMatch(/GAD-7/i)
  })

  it('responde a alimentación con hidratación y plan nutricional', () => {
    const { texto } = respuestaLocal('comida', 'es')
    expect(texto).toMatch(/hidratación/i)
    expect(texto).toMatch(/plan nutricional/i)
  })

  it('responde a la emergencia con el protocolo', () => {
    const { intencion, texto } = respuestaLocal('quiero morir', 'es')
    expect(intencion).toBe('emergencia')
    expect(texto).toMatch(/Posible emergencia/i)
  })

  it('responde por defecto', () => {
    const { texto } = respuestaLocal('xyz', 'es')
    expect(texto).toMatch(/No entendí bien/i)
  })

  it('responde en inglés', () => {
    const { texto } = respuestaLocal('I cannot sleep', 'en')
    expect(texto).toMatch(/7 hours/i)
    expect(AVISO_LEGAL.en).toMatch(/health professional/i)
  })
})
