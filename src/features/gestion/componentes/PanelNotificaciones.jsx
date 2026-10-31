/**
 * @fileoverview Panel de notificaciones (campana) con lista de alertas.
 * Muestra el conteo de alertas nuevas; las críticas resaltan en rojo, vibran y
 * reproducen una alerta sonora (tono + locución en es/en). Al hacer clic se
 * navega al perfil del tripulante para ver el resumen y se marca como leída.
 * @module features/gestion/componentes/PanelNotificaciones
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { listarAlertas, leerAlerta } from '../api.js'
import { reproducirAlertaSonora } from '../../../shared/alertaSonido.js'
import { useTraduccion } from '../../../shared/idioma.js'

/** Icono por severidad. */
const ICONO_SEVERIDAD = { critica: AlertTriangle, atencion: AlertCircle, info: Info }

/**
 * Panel de notificaciones.
 * @returns {import('react').JSX.Element} Panel.
 */
export function PanelNotificaciones() {
  const navigate = useNavigate()
  const t = useTraduccion()
  const [abierto, setAbierto] = useState(false)
  const cliente = useQueryClient()
  const { data } = useQuery({ queryKey: ['alertas'], queryFn: () => listarAlertas(), refetchInterval: 10000 })
  const alertas = Array.isArray(data) ? data : []
  const nuevas = alertas.filter((a) => a.estado === 'nueva')
  const criticasNuevas = nuevas.filter((a) => a.severidad === 'critica').length
  const marcar = useMutation({ mutationFn: leerAlerta, onSuccess: () => cliente.invalidateQueries({ queryKey: ['alertas'] }) })

  // Al detectar alertas críticas nuevas: vibra y reproduce el sonido de alerta.
  const prevCriticasRef = useRef(0)
  const ultimaAlertaRef = useRef(0)
  useEffect(() => {
    if (criticasNuevas > prevCriticasRef.current && Date.now() - ultimaAlertaRef.current > 10000) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
      reproducirAlertaSonora()
      ultimaAlertaRef.current = Date.now()
    }
    prevCriticasRef.current = criticasNuevas
  }, [criticasNuevas])

  /** Marca como leída y navega al módulo de Alertas. */
  const abrirAlerta = (a) => {
    if (a.estado === 'nueva') marcar.mutate(a.id)
    setAbierto(false)
    navigate('/app/alertas')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-boton p-2 text-tinta-suave hover:text-tinta"
        aria-label={t('shell.notificaciones')}
        aria-expanded={abierto}
      >
        <Bell size={18} className={criticasNuevas > 0 ? 'animate-pulse text-critico' : ''} />
        {nuevas.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critico px-1 text-[10px] font-bold text-white">
            {nuevas.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] origin-top-right overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-consola"
          >
            <div className="border-b border-borde px-4 py-2 text-sm font-semibold text-tinta">{t('alertas.titulo')}</div>
            <div className="max-h-80 overflow-y-auto">
              {alertas.length === 0 && <p className="px-4 py-6 text-center text-sm text-tinta-suave">{t('alertas.sinAlertas')}.</p>}
              {alertas.map((a) => {
                const Icono = ICONO_SEVERIDAD[a.severidad] ?? Info
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => abrirAlerta(a)}
                    className={`flex w-full items-start gap-2 border-b border-borde/60 px-4 py-2.5 text-left text-sm last:border-0 transition-colors hover:bg-superficie-alta ${a.severidad === 'critica' ? 'bg-critico/10' : ''}`}
                  >
                    <Icono size={15} className={`mt-0.5 shrink-0 ${a.severidad === 'critica' ? 'text-critico' : a.severidad === 'atencion' ? 'text-advertencia-fuerte' : 'text-tinta-suave'}`} />
                    <span className="text-tinta">
                      {a.tripulante_nombre ? <span className="font-semibold">{a.tripulante_nombre}: </span> : null}
                      {a.mensaje}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
