/**
 * @fileoverview Indicador visible del estado de sincronización.
 * "Sin conexión · N pendientes" o "Sincronizado".
 * @module features/gestion/componentes/IndicadorSincronizacion
 */

import { CloudOff, CheckCircle2 } from 'lucide-react'
import { useSincronizacion } from '../useSincronizacion.js'

/**
 * Indicador de sincronización.
 * @returns {import('react').JSX.Element} Indicador.
 */
export function IndicadorSincronizacion() {
  const { enLinea, pendientes } = useSincronizacion()
  const sincronizado = enLinea && pendientes === 0

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-insignia border border-borde bg-superficie-alta px-2.5 py-1 text-xs font-medium"
      data-testid="indicador-sincronizacion"
    >
      {sincronizado ? (
        <>
          <CheckCircle2 size={13} className="text-exito" />
          <span className="text-tinta-suave">Sincronizado</span>
        </>
      ) : (
        <>
          <CloudOff size={13} className="text-advertencia-fuerte" />
          <span className="text-tinta-suave">
            {enLinea ? `${pendientes} pendientes` : `Sin conexión · ${pendientes} pendientes`}
          </span>
        </>
      )}
    </span>
  )
}
