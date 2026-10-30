/**
 * @fileoverview Panel de notificaciones (campana) con lista de alertas.
 * Muestra el conteo de alertas nuevas; las críticas resaltan en rojo y hacen vibrar
 * el dispositivo (si lo soporta). Al abrir se pueden marcar como leídas.
 * @module features/gestion/componentes/PanelNotificaciones
 */

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { listarAlertas, leerAlerta } from '../api.js'

/** Icono por severidad. */
const ICONO_SEVERIDAD = { critica: AlertTriangle, atencion: AlertCircle, info: Info }

/**
 * Panel de notificaciones.
 * @returns {import('react').JSX.Element} Panel.
 */
export function PanelNotificaciones() {
  const [abierto, setAbierto] = useState(false)
  const cliente = useQueryClient()
  const { data } = useQuery({ queryKey: ['alertas'], queryFn: () => listarAlertas(), refetchInterval: 30000 })
  const alertas = Array.isArray(data) ? data : []
  const nuevas = alertas.filter((a) => a.estado === 'nueva')
  const criticasNuevas = nuevas.filter((a) => a.severidad === 'critica').length
  const marcar = useMutation({ mutationFn: leerAlerta, onSuccess: () => cliente.invalidateQueries({ queryKey: ['alertas'] }) })

  // Vibra una vez al detectar alertas críticas nuevas (si el dispositivo lo soporta).
  const vibradoPor = useRef(0)
  useEffect(() => {
    if (criticasNuevas > 0 && typeof navigator !== 'undefined' && navigator.vibrate && Date.now() - vibradoPor.current > 10000) {
      navigator.vibrate(200)
      vibradoPor.current = Date.now()
    }
  }, [criticasNuevas])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-boton p-2 text-tinta-suave hover:text-tinta"
        aria-label="Notificaciones"
        aria-expanded={abierto}
      >
        <Bell size={18} className={criticasNuevas > 0 ? 'animate-pulse text-critico' : ''} />
        {nuevas.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critico px-1 text-[10px] font-bold text-white">
            {nuevas.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-consola">
          <div className="border-b border-borde px-4 py-2 text-sm font-semibold text-tinta">Alertas</div>
          <div className="max-h-80 overflow-y-auto">
            {alertas.length === 0 && <p className="px-4 py-6 text-center text-sm text-tinta-suave">Sin alertas.</p>}
            {alertas.map((a) => {
              const Icono = ICONO_SEVERIDAD[a.severidad] ?? Info
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { if (a.estado === 'nueva') marcar.mutate(a.id) }}
                  className={`flex w-full items-start gap-2 border-b border-borde/60 px-4 py-2.5 text-left text-sm last:border-0 ${a.severidad === 'critica' ? 'bg-critico/10' : ''}`}
                >
                  <Icono size={15} className={`mt-0.5 shrink-0 ${a.severidad === 'critica' ? 'text-critico' : a.severidad === 'atencion' ? 'text-advertencia-fuerte' : 'text-tinta-suave'}`} />
                  <span className="text-tinta">{a.mensaje}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
