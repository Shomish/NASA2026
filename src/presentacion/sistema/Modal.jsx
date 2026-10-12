/**
 * @fileoverview Componente base Modal (accesible)
 * Diálogo modal con focus-trap, aria-modal, cierre con Escape y restauración de foco.
 * @module presentacion/sistema/Modal
 */

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from './cn.js'

/** Selector de elementos enfocables dentro del modal. */
const SELECTOR_ENFOCABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Modal accesible.
 * @param {object} props - Propiedades.
 * @param {boolean} props.abierto - Si el modal está visible.
 * @param {() => void} props.alCerrar - Callback de cierre.
 * @param {string} [props.titulo] - Título (para aria-labelledby).
 * @param {string} [props.tituloId] - Id del elemento que titula el diálogo.
 * @param {import('react').ReactNode} props.children - Contenido.
 * @param {string} [props.className] - Clases adicionales del panel.
 * @returns {import('react').JSX.Element | null} Modal o null si está cerrado.
 */
export function Modal({ abierto, alCerrar, titulo, tituloId = 'modal-titulo', children, className }) {
  const panelRef = useRef(null)

  // Bloquea el scroll del body y restaura el foco al cerrar.
  useEffect(() => {
    if (!abierto) return undefined
    const focoPrevio = document.activeElement
    document.body.style.overflow = 'hidden'

    // Enfoca el panel (o el primer elemento enfocable).
    const panel = panelRef.current
    const primerEnfocable = panel?.querySelector(SELECTOR_ENFOCABLE)
    ;(primerEnfocable ?? panel)?.focus()

    return () => {
      document.body.style.overflow = ''
      focoPrevio?.focus?.()
    }
  }, [abierto])

  if (!abierto) return null

  /**
   * Atrapa el foco dentro del modal al pulsar Tab.
   * @param {import('react').KeyboardEvent} evento - Evento de teclado.
   */
  const atraparFoco = (evento) => {
    if (evento.key !== 'Tab') return
    const enfocables = panelRef.current?.querySelectorAll(SELECTOR_ENFOCABLE)
    if (!enfocables || enfocables.length === 0) return
    const primero = enfocables[0]
    const ultimo = enfocables[enfocables.length - 1]
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primero.focus()
    }
  }

  /**
   * Cierra el modal con Escape.
   * @param {import('react').KeyboardEvent} evento - Evento de teclado.
   */
  const manejarEscape = (evento) => {
    if (evento.key === 'Escape') alCerrar()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onKeyDown={manejarEscape}>
      <div className="absolute inset-0" onClick={alCerrar} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onKeyDown={atraparFoco}
        className={cn(
          'relative w-full max-w-lg rounded-tarjeta border border-borde bg-superficie shadow-consola outline-none',
          className,
        )}
      >
        {titulo && (
          <div className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 id={tituloId} className="text-lg font-semibold text-tinta">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={alCerrar}
              className="rounded-boton p-1.5 text-tinta-suave hover:bg-superficie-alta hover:text-tinta transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
