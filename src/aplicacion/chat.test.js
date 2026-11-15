/**
 * @fileoverview Pruebas de integración del chat local (wrapper y aviso legal).
 * @module aplicacion/chat.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { responderChatbot } from './indice.js'
import { AVISO_LEGAL } from '../../shared/chatLocal.js'
import { useIdioma } from '../shared/idioma.js'

const contexto = { persona: { nombre: 'Ana', rol: 'Comandante', edad: 38, pesoKg: 62, alturaCm: 165 }, signos: {} }

describe('responderChatbot local', () => {
  beforeEach(() => {
    useIdioma.getState().fijarIdioma('es')
  })

  it('responde a dolor de cabeza y añade el aviso legal', () => {
    const respuesta = responderChatbot('me duele la cabeza', contexto)
    expect(respuesta).toMatch(/descansa/i)
    expect(respuesta.endsWith(AVISO_LEGAL.es)).toBe(true)
  })

  it('responde a insomnio con la meta de 7 horas', () => {
    const respuesta = responderChatbot('no puedo dormir', contexto)
    expect(respuesta).toMatch(/7 horas/i)
    expect(respuesta.endsWith(AVISO_LEGAL.es)).toBe(true)
  })

  it('responde a tristeza con PHQ-9 y GAD-7', () => {
    const respuesta = responderChatbot('estoy triste', contexto)
    expect(respuesta).toMatch(/PHQ-9/i)
    expect(respuesta.endsWith(AVISO_LEGAL.es)).toBe(true)
  })

  it('trata la ideación de daño como emergencia', () => {
    const respuesta = responderChatbot('quiero morir', contexto)
    expect(respuesta).toMatch(/Posible emergencia/i)
    expect(respuesta).toMatch(/No te automediques/i)
  })
})
