/**
 * @fileoverview Componente base Tostada (Toast con sonner)
 * Reexporta sonner y monta el contenedor de notificaciones.
 * @module presentacion/sistema/Tostada
 */

import { Toaster, toast } from 'sonner'

/**
 * Contenedor de notificaciones (toasts).
 * Debe montarse una sola vez, normalmente en la raíz de la aplicación.
 * @returns {import('react').JSX.Element} Toaster.
 */
export function ContenedorTostadas() {
  return <Toaster position="bottom-right" theme="dark" richColors closeButton />
}

/**
 * Reexporta la función `toast` de sonner para disparar notificaciones.
 */
export { toast }
