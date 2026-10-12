/**
 * @fileoverview Componente HojaInferior (bottom sheet) basado en vaul.
 * Usado para formularios y filtros en móvil.
 * @module presentacion/sistema/movil/HojaInferior
 */

import { Drawer } from 'vaul'

/**
 * Hoja inferior (bottom sheet) controlada.
 * @param {object} props - Propiedades.
 * @param {boolean} props.abierto - Si está visible.
 * @param {() => void} props.alCerrar - Callback de cierre.
 * @param {string} [props.titulo] - Título.
 * @param {import('react').ReactNode} props.children - Contenido.
 * @returns {import('react').JSX.Element} Hoja inferior.
 */
export function HojaInferior({ abierto, alCerrar, titulo, children }) {
  return (
    <Drawer.Root open={abierto} onOpenChange={(o) => !o && alCerrar()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-lg rounded-t-2xl border-t border-borde bg-superficie p-4 pb-[env(safe-area-inset-bottom)] focus:outline-none">
          <Drawer.Handle className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-borde-fuerte" />
          {titulo && <Drawer.Title className="mb-2 text-lg font-semibold text-tinta">{titulo}</Drawer.Title>}
          <div className="max-h-[70dvh] overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
