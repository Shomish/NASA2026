/**
 * @fileoverview Utilidad `cn`
 * Combina clases con tailwind-merge (resuelve conflictos) y clsx (condicionales).
 * @module presentacion/sistema/cn
 */

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases CSS resolviendo conflictos de Tailwind.
 * @param {...import('clsx').ClassValue} entradas - Clases o condiciones.
 * @returns {string} Cadena de clases fusionada.
 */
export function cn(...entradas) {
  return twMerge(clsx(entradas))
}
