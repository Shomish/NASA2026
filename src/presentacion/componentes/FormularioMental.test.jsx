// @vitest-environment jsdom
/**
 * @fileoverview Pruebas del formulario PHQ-9/GAD-7: bloqueo incompleto, 9/7 respuestas e ítem 9.
 * @module presentacion/componentes/FormularioMental.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import FormularioMental from './FormularioMental.jsx'
import { useIdioma } from '../../shared/idioma.js'

describe('FormularioMental', () => {
  let alAgregar

  beforeEach(() => {
    useIdioma.getState().fijarIdioma('es')
    alAgregar = vi.fn()
    render(<FormularioMental mentales={[]} alAgregar={alAgregar} alEliminar={vi.fn()} />)
  })

  afterEach(() => {
    cleanup()
  })

  it('bloquea el envío si falta alguna respuesta del PHQ-9', () => {
    fireEvent.click(screen.getByRole('button', { name: /Guardar evaluación/i }))
    expect(screen.getByText('Responde todas las preguntas')).toBeTruthy()
    expect(alAgregar).not.toHaveBeenCalled()
  })

  it('acepta el PHQ-9 con las 9 respuestas', () => {
    for (const boton of screen.getAllByRole('button', { name: 'Nunca' })) {
      fireEvent.click(boton)
    }
    fireEvent.click(screen.getByRole('button', { name: /Guardar evaluación/i }))
    expect(alAgregar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'mental', cuestionario: 'phq9', puntaje: 0 }))
  })

  it('acepta el GAD-7 con las 7 respuestas', () => {
    fireEvent.click(screen.getByRole('button', { name: /GAD-7/i }))
    for (const boton of screen.getAllByRole('button', { name: 'Nunca' })) {
      fireEvent.click(boton)
    }
    fireEvent.click(screen.getByRole('button', { name: /Guardar evaluación/i }))
    expect(alAgregar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'mental', cuestionario: 'gad7', puntaje: 0 }))
  })

  it('el ítem 9 positivo genera una alerta crítica y muestra ayuda inmediata', () => {
    const nunca = screen.getAllByRole('button', { name: 'Nunca' })
    for (const boton of nunca.slice(0, 8)) fireEvent.click(boton)
    const varios = screen.getAllByRole('button', { name: 'Varios días' })
    fireEvent.click(varios[8])
    fireEvent.click(screen.getByRole('button', { name: /Guardar evaluación/i }))
    expect(alAgregar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'alerta', severidad: 'critico' }))
    expect(screen.getByText(/Busca ayuda inmediata/i)).toBeTruthy()
  })
})
