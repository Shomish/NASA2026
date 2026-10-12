/**
 * @fileoverview Componente base Insignia (Badge)
 * Etiqueta de estado con variantes semánticas.
 * @module presentacion/sistema/Insignia
 */

import { cva } from 'class-variance-authority'
import { cn } from './cn.js'

/** Estilos de la insignia según variante semántica. */
const estilosInsignia = cva('inline-flex items-center gap-1.5 rounded-insignia px-2.5 py-1 text-xs font-medium', {
  variants: {
    variante: {
      neutro: 'bg-superficie-alta text-tinta-suave',
      exito: 'bg-exito/15 text-exito',
      advertencia: 'bg-advertencia/15 text-advertencia-fuerte',
      critico: 'bg-critico/15 text-critico',
      primario: 'bg-primario/15 text-primario',
      andino: 'bg-andino-dorado/15 text-andino-dorado',
    },
    conPunto: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    variante: 'neutro',
  },
})

/**
 * Insignia reutilizable (con punto de estado opcional).
 * @param {object} props - Propiedades.
 * @param {'neutro'|'exito'|'advertencia'|'critico'|'primario'|'andino'} [props.variante] - Semántica.
 * @param {boolean} [props.punto] - Muestra un punto pulsante de estado.
 * @param {string} [props.className] - Clases adicionales.
 * @param {import('react').HTMLAttributes<HTMLSpanElement>} props.resto - Atributos nativos.
 * @returns {import('react').JSX.Element} Insignia.
 */
export function Insignia({ variante, punto = false, className, children, ...resto }) {
  return (
    <span className={cn(estilosInsignia({ variante }), className)} {...resto}>
      {punto && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
