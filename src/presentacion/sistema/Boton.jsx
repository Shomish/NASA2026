/**
 * @fileoverview Componente base Boton (Button)
 * Botón reutilizable con variantes definidas mediante class-variance-authority.
 * @module presentacion/sistema/Boton
 */

import { cva } from 'class-variance-authority'
import { cn } from './cn.js'

/** Estilos del botón con variantes de apariencia y tamaño. */
const estilosBoton = cva(
  'inline-flex items-center justify-center gap-2 rounded-boton font-medium transition-all duration-150 ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ' +
    'disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variante: {
        primario: 'bg-primario text-white hover:bg-primario-fuerte shadow-glow',
        secundario: 'bg-superficie-alta text-tinta border border-borde hover:bg-superficie-elevada',
        fantasma: 'text-tinta hover:bg-superficie-alta',
        contorno: 'border border-primario text-primario hover:bg-primario/10',
        peligro: 'bg-critico text-white hover:bg-critico/90',
        exito: 'bg-exito text-white hover:bg-exito/90',
      },
      tamaño: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icono: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variante: 'primario',
      tamaño: 'md',
    },
  },
)

/**
 * Botón reutilizable del sistema de diseño.
 * @param {object} props - Propiedades.
 * @param {'primario'|'secundario'|'fantasma'|'contorno'|'peligro'|'exito'} [props.variante] - Apariencia.
 * @param {'sm'|'md'|'lg'|'icono'} [props.tamaño] - Tamaño.
 * @param {string} [props.className] - Clases adicionales.
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement>} props.resto - Atributos nativos.
 * @returns {import('react').JSX.Element} Botón.
 */
export function Boton({ variante, tamaño, className, ...resto }) {
  return <button className={cn(estilosBoton({ variante, tamaño }), className)} {...resto} />
}
