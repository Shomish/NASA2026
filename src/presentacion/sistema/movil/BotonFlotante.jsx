/**
 * @fileoverview Componente BotonFlotante (FAB)
 * Botón de acción flotante para la acción principal, accesible con una mano.
 * @module presentacion/sistema/movil/BotonFlotante
 */

import { cn } from '../cn.js'

/**
 * Botón flotante de acción (FAB).
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.icono - Icono.
 * @param {string} props.etiqueta - Etiqueta accesible.
 * @param {() => void} props.alHacerClic - Callback.
 * @param {string} [props.className] - Clases adicionales.
 * @returns {import('react').JSX.Element} FAB.
 */
export function BotonFlotante({ icono, etiqueta, alHacerClic, className }) {
  return (
    <button
      type="button"
      onClick={alHacerClic}
      aria-label={etiqueta}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full ' +
          'bg-primario text-white shadow-glow transition-colors hover:bg-primario-fuerte ' +
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario',
        className,
      )}
    >
      {icono}
    </button>
  )
}
