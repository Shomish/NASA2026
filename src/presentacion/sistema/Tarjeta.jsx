/**
 * @fileoverview Componente base Tarjeta (Card)
 * Contenedor de superficie con borde, radio y sombra del sistema de diseño.
 * @module presentacion/sistema/Tarjeta
 */

import { cva } from 'class-variance-authority'
import { cn } from './cn.js'

/** Estilos de la tarjeta según variante. */
const estilosTarjeta = cva('rounded-tarjeta border bg-superficie', {
  variants: {
    variante: {
      plano: 'border-borde',
      elevado: 'border-borde shadow-consola',
      andino: 'border-andino-dorado/30',
    },
    relleno: {
      ninguno: '',
      compacto: 'p-4',
      normal: 'p-5',
      amplio: 'p-6',
    },
  },
  defaultVariants: {
    variante: 'plano',
    relleno: 'normal',
  },
})

/**
 * Tarjeta reutilizable.
 * @param {object} props - Propiedades.
 * @param {'plano'|'elevado'|'andino'} [props.variante] - Estilo de borde/sombra.
 * @param {'ninguno'|'compacto'|'normal'|'amplio'} [props.relleno] - Espaciado interior.
 * @param {string} [props.className] - Clases adicionales.
 * @param {import('react').HTMLAttributes<HTMLDivElement>} props.resto - Atributos nativos.
 * @returns {import('react').JSX.Element} Tarjeta.
 */
export function Tarjeta({ variante, relleno, className, ...resto }) {
  return <div className={cn(estilosTarjeta({ variante, relleno }), className)} {...resto} />
}
