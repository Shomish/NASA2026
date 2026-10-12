/**
 * @fileoverview Componente SelectorSegmentado (segmented control).
 * Selector de opciones exclusivas con áreas táctiles de al menos 44px.
 * @module presentacion/sistema/movil/SelectorSegmentado
 */

import { cn } from '../cn.js'

/**
 * Selector segmentado.
 * @param {object} props - Propiedades.
 * @param {Array<{valor: string, etiqueta: string}>} props.opciones - Opciones.
 * @param {string} props.valor - Valor seleccionado.
 * @param {(valor: string) => void} props.alCambiar - Callback.
 * @param {string} [props.className] - Clases adicionales.
 * @returns {import('react').JSX.Element} Selector.
 */
export function SelectorSegmentado({ opciones, valor, alCambiar, className }) {
  return (
    <div className={cn('inline-flex rounded-boton border border-borde bg-superficie-alta p-1', className)} role="tablist">
      {opciones.map((opcion) => {
        const activa = valor === opcion.valor
        return (
          <button
            key={opcion.valor}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => alCambiar(opcion.valor)}
            className={cn(
              'min-h-[44px] rounded-boton px-3 py-2 text-sm font-medium transition-colors',
              activa ? 'bg-primario text-white' : 'text-tinta-suave hover:text-tinta',
            )}
          >
            {opcion.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
