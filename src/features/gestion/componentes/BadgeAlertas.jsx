/**
 * @fileoverview Badge de alertas no leídas (carga diferida).
 * Muestra el conteo de alertas "nueva" del servidor; no infla el bundle inicial.
 * @module features/gestion/componentes/BadgeAlertas
 */

import { useAlertasNoLeidas } from '../consultas.js'

/**
 * Badge de alertas no leídas.
 * @returns {import('react').JSX.Element | null} Badge o null.
 */
export function BadgeAlertas() {
  const cantidad = useAlertasNoLeidas()
  if (cantidad <= 0) return null
  return <span className="rounded-full bg-critico px-1.5 py-0.5 text-[10px] font-bold text-white">{cantidad}</span>
}
