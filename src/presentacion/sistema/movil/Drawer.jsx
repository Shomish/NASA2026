/**
 * @fileoverview Componente Drawer (menú lateral) basado en vaul.
 * En móvil sustituye al sidebar de escritorio.
 * @module presentacion/sistema/movil/Drawer
 */

import { Drawer as DrawerVaul } from 'vaul'

/**
 * Drawer lateral izquierdo controlado.
 * @param {object} props - Propiedades.
 * @param {boolean} props.abierto - Si está visible.
 * @param {() => void} props.alCerrar - Callback de cierre.
 * @param {string} [props.titulo] - Título.
 * @param {import('react').ReactNode} props.children - Contenido.
 * @returns {import('react').JSX.Element} Drawer.
 */
export function Drawer({ abierto, alCerrar, titulo, children }) {
  return (
    <DrawerVaul.Root open={abierto} onOpenChange={(o) => !o && alCerrar()} direction="left">
      <DrawerVaul.Portal>
        <DrawerVaul.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <DrawerVaul.Content className="fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[85vw] border-r border-borde bg-superficie p-4 focus:outline-none">
          {titulo && <DrawerVaul.Title className="mb-4 text-lg font-semibold text-tinta">{titulo}</DrawerVaul.Title>}
          <div className="h-full overflow-y-auto">{children}</div>
        </DrawerVaul.Content>
      </DrawerVaul.Portal>
    </DrawerVaul.Root>
  )
}
