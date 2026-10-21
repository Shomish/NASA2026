/**
 * @fileoverview Pruebas adversariales del servicio del chatbot.
 * Prompt injection, datos de otros tripulantes y escalamiento.
 * @module server/chat/servicio.test
 */

import { describe, it, expect } from 'vitest'
import { seudonimizarContexto, detectarEscalamiento, generarRespuestaChat } from './servicio.js'
import { actualizarUmbrales, restablecerUmbrales } from '../configuracion/umbrales.js'

describe('seudonimizarContexto', () => {
  it('no incluye el nombre real del tripulante', () => {
    const texto = seudonimizarContexto({ nombre: 'Ana Quispe', rol: 'Comandante', edad: 38 })
    expect(texto).not.toContain('Ana Quispe')
    expect(texto).toContain('Tripulante')
  })

  it('envía solo las métricas necesarias (sin datos personales)', () => {
    const texto = seudonimizarContexto({ nombre: 'Ana', contrasena: 'secreta', signosVitales: { saturacion_oxigeno: 97 } })
    expect(texto).not.toContain('contrasena')
    expect(texto).toContain('saturacion_oxigeno')
  })
})

describe('detectarEscalamiento', () => {
  it('detecta saturación de O₂ críticamente baja', () => {
    const aviso = detectarEscalamiento({ signosVitales: { saturacion_oxigeno: 85 } })
    expect(aviso).toContain('saturación de O₂')
  })

  it('detecta PHQ-9 alto', () => {
    const aviso = detectarEscalamiento({ saludMental: { phq9: 22 } })
    expect(aviso).toContain('PHQ-9')
  })

  it('no activa escalamiento con métricas normales', () => {
    expect(detectarEscalamiento({ signosVitales: { saturacion_oxigeno: 98 } })).toBeNull()
  })

  it('el escalamiento usa el umbral editable de Configuración', () => {
    // Bajar el umbral crítico de SpO₂ a 85: un valor de 88 ya no es crítico.
    actualizarUmbrales({ saturacion_oxigeno: { criticoMin: 85 } })
    expect(detectarEscalamiento({ signosVitales: { saturacion_oxigeno: 88 } })).toBeNull()
    restablecerUmbrales()
    // Con el umbral por defecto (90), 88 sí es crítico.
    expect(detectarEscalamiento({ signosVitales: { saturacion_oxigeno: 88 } })).toContain('saturación')
  })
})

describe('generarRespuestaChat (sin proveedor)', () => {
  it('devuelve una respuesta de respaldo si no hay proveedor', async () => {
    const resultado = await generarRespuestaChat({ mensaje: '¿cómo estoy?', contexto: {} })
    expect(resultado.respuesta).toBeTruthy()
  })

  it('añade aviso de escalamiento ante síntomas graves', async () => {
    const resultado = await generarRespuestaChat({
      mensaje: 'me siento mal',
      contexto: { signosVitales: { saturacion_oxigeno: 85 } },
    })
    expect(resultado.escalamiento).toContain('saturación de O₂')
    expect(resultado.respuesta).toContain('Escalamiento')
  })
})
