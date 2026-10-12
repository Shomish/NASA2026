/**
 * @fileoverview Componente base Entrada (Input)
 * Campo de texto con estados de error y deshabilitado.
 * @module presentacion/sistema/Entrada
 */

import { forwardRef } from 'react'
import { cn } from './cn.js'

/**
 * Campo de entrada reutilizable.
 * @param {object} props - Propiedades.
 * @param {boolean} [props.error] - Marca el campo con estado de error.
 * @param {string} [props.className] - Clases adicionales.
 * @param {import('react').InputHTMLAttributes<HTMLInputElement>} props.resto - Atributos nativos.
 * @returns {import('react').JSX.Element} Input.
 */
export const Entrada = forwardRef(function Entrada({ error = false, className, ...resto }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(
        'h-10 w-full rounded-boton border bg-superficie-elevada px-3 text-sm text-tinta ' +
          'placeholder:text-tinta-suave transition-colors duration-150 ' +
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primario ' +
          'disabled:opacity-50 disabled:pointer-events-none',
        error ? 'border-critico focus-visible:outline-critico' : 'border-borde',
        className,
      )}
      {...resto}
    />
  )
})
