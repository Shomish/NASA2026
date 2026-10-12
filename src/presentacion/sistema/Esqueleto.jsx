/**
 * @fileoverview Componente base Esqueleto (Skeleton)
 * Marcador de posición de carga animado (respeta prefers-reduced-motion).
 * @module presentacion/sistema/Esqueleto
 */

import { cn } from './cn.js'

/**
 * Esqueleto de carga reutilizable.
 * @param {object} props - Propiedades.
 * @param {string} [props.className] - Clases (dimensiones y forma).
 * @returns {import('react').JSX.Element} Esqueleto.
 */
export function Esqueleto({ className }) {
  return <div className={cn('animate-pulse rounded-boton bg-superficie-alta', className)} />
}
