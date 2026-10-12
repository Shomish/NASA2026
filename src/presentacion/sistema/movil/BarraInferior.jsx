/**
 * @fileoverview Componente BarraInferior
 * Barra de navegación inferior fija (mobile-first) con acción central destacada.
 * @module presentacion/sistema/movil/BarraInferior
 */

import { cn } from '../cn.js'

/**
 * Barra de navegación inferior con 5 destinos (el central puede ser destacado).
 * @param {object} props - Propiedades.
 * @param {Array<{id: string, etiqueta: string, icono: import('react').ReactNode, destacado?: boolean}>} props.destinos - Destinos.
 * @param {string} props.activo - Destino activo.
 * @param {(id: string) => void} props.alCambiar - Callback.
 * @returns {import('react').JSX.Element} Barra inferior.
 */
export function BarraInferior({ destinos, activo, alCambiar }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center">
        {destinos.map((destino) => {
          const activoDestino = activo === destino.id
          if (destino.destacado) {
            return (
              <button
                key={destino.id}
                type="button"
                onClick={() => alCambiar(destino.id)}
                aria-label={destino.etiqueta}
                className="relative flex items-center justify-center"
              >
                <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primario text-white shadow-glow">
                  {destino.icono}
                </span>
                <span className="sr-only">{destino.etiqueta}</span>
              </button>
            )
          }
          return (
            <button
              key={destino.id}
              type="button"
              onClick={() => alCambiar(destino.id)}
              className={cn(
                'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium',
                activoDestino ? 'text-primario' : 'text-tinta-suave',
              )}
            >
              {destino.icono}
              <span>{destino.etiqueta}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
