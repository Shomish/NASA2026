/**
 * @fileoverview Vista Dashboard con datos reales de MySQL.
 * Consume /api/v1/resumen del tripulante activo (TanStack Query) con skeletons y
 * estados vacíos. Muestra la misión de demostración de 120 días.
 * @module presentacion/componentes/VistaDashboard
 */

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, HeartPulse, Moon, AlertTriangle, FlaskConical } from 'lucide-react'
import { Esqueleto, EstadoVacio, Insignia } from '../sistema/indice.js'
import { useTema } from '../sistema/tema.jsx'
import { useAlmacenSesion } from '../../features/auth/almacenSesion.js'
import { useContextoTripulante } from '../../features/gestion/useContextoTripulante.js'
import { useResumen, useAvanzarDia } from '../../features/gestion/consultas.js'
import { useTraduccion } from '../../shared/idioma.js'

/** Saludo según la hora. */
function saludoPorHora() {
  const h = new Date().getHours()
  if (h < 12) return 'dash.buenosDias'
  if (h < 19) return 'dash.buenasTardes'
  return 'dash.buenasNoches'
}

/**
 * Dashboard principal con datos reales.
 * @returns {import('react').JSX.Element} Dashboard.
 */
export default function VistaDashboard() {
  const t = useTraduccion()
  const { tema, modoEfectivo } = useTema()
  const tokens = tema[modoEfectivo] ?? tema.oscuro
  const usuario = useAlmacenSesion((s) => s.usuario)
  const { tripulanteActivo, sinPerfil } = useContextoTripulante()
  const { data, isLoading, isError } = useResumen(tripulanteActivo?.id)
  const avanzarDia = useAvanzarDia()
  const [rango] = useState('14')

  const esDemo = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'
  const esAdmin = usuario?.rol === 'administrador'

  const estiloTooltip = { background: `rgb(${tokens.superficie})`, border: `1px solid rgb(${tokens.borde})`, borderRadius: 8, color: `rgb(${tokens.tinta})` }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Esqueleto className="h-36 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Esqueleto className="h-24" /><Esqueleto className="h-24" /><Esqueleto className="h-24" /><Esqueleto className="h-24" />
        </div>
        <Esqueleto className="h-56 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return <EstadoVacio icono={<HeartPulse size={22} />} titulo={t('dash.sinResumen')} descripcion={t('dash.revisarConexion')} />
  }

  if (sinPerfil || !data.tripulante) {
    return <EstadoVacio icono={<HeartPulse size={22} />} titulo={t('dash.sinTripulante')} descripcion={t('dash.sinPerfil')} />
  }

  const { tripulante, signos, sueno, glucosa, ejercicio, alertas, tendencias, totalRegistros } = data
  const estadoGlobal = alertas.criticas > 0 ? 'critico' : alertas.nuevas > 0 ? 'atencion' : 'optimo'

  const kpis = [
    { etiqueta: t('dash.frecuenciaCardiaca'), valor: signos?.frecuencia_cardiaca ?? '—', unidad: 'lpm', icono: HeartPulse, color: 'text-primario', fondo: 'bg-primario/10' },
    { etiqueta: t('dash.saturacion'), valor: signos?.spo2 ?? '—', unidad: '%', icono: Activity, color: 'text-secundario', fondo: 'bg-secundario/10' },
    { etiqueta: t('dash.sueno'), valor: sueno?.horas ?? '—', unidad: 'h', icono: Moon, color: 'text-exito', fondo: 'bg-exito/10' },
    { etiqueta: t('dash.alertasActivas'), valor: String(alertas.nuevas), unidad: '', icono: AlertTriangle, color: 'text-advertencia', fondo: 'bg-advertencia/10' },
  ]

  const serieFc = (tendencias.frecuenciaCardiaca ?? []).map((p, i) => ({ hora: i, valor: Number(p.valor) }))

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-tarjeta border border-borde bg-gradient-to-r from-teja to-teja-fuerte p-6">
        <div className="textura-andina absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              <span className="font-mono">{t('dash.enVivo')} {tripulante.entorno ?? 'Entorno no definido'}</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold text-white">{t(saludoPorHora())}, {tripulante.nombre.split(' ')[0]} 👋</h1>
            <p className="mt-1 text-white/80">{t('dash.dia')} {tripulante.dia_mision ?? '—'} {t('dash.diaMision')} · {totalRegistros} {t('dash.registrosRecientes')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Insignia variante={estadoGlobal === 'optimo' ? 'exito' : estadoGlobal === 'atencion' ? 'advertencia' : 'critico'} punto>
                {estadoGlobal === 'optimo' ? t('dash.estadoOptimo') : estadoGlobal === 'atencion' ? t('dash.requiereAtencion') : t('dash.critico')}
              </Insignia>
              {esDemo && (
                <Insignia variante="advertencia">Datos simulados con fines de demostración</Insignia>
              )}
              {(tripulante.origen === 'physionet-noneeg' || tripulante.origen === 'physionet-bigideas' || tripulante.origen === 'physionet-mmash' || tripulante.origen === 'nhanes') && (
                <Insignia variante="exito">Datos reales de referencia (PhysioNet / CDC)</Insignia>
              )}
              {esDemo && esAdmin && (
                <button type="button" onClick={() => avanzarDia.mutate()} disabled={avanzarDia.isPending} className="rounded-boton border border-white/40 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10" data-testid="avanzar-dia">
                  {avanzarDia.isPending ? t('dash.avanzando') : t('dash.avanzarDia')}
                </button>
              )}
            </div>
          </div>
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--andino-dorado))" strokeWidth="8" strokeDasharray="264" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xl font-bold text-white">{tripulante.dia_mision ?? '—'}</span>
              <span className="font-mono text-[10px] text-white/80">{t('dash.dia').toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de misión */}
      <div className="rounded-tarjeta border border-borde bg-superficie-elevada p-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-tinta-suave">
            <span className="h-2 w-2 rounded-full bg-exito" /> {tripulante.cargo ?? 'Tripulante'}
          </span>
          <span className="font-mono text-xs text-tinta-suave">{t('dash.entorno')} {tripulante.entorno ?? '—'}</span>
          {glucosa && <span className="flex items-center gap-1 font-mono text-xs text-tinta-suave"><FlaskConical size={12} /> {t('dash.glucosa')} {glucosa.glucosa_mgdl} mg/dL</span>}
          {ejercicio && <span className="font-mono text-xs text-tinta-suave">{t('dash.ejercicio')} {ejercicio.minutos} min ({ejercicio.tipo})</span>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.etiqueta} className="rounded-tarjeta border border-borde bg-superficie p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.fondo}`}>
              <kpi.icono size={18} className={kpi.color} />
            </div>
            <div className="mt-3 font-mono text-2xl font-bold">
              {kpi.valor} <span className="text-sm font-normal text-tinta-suave">{kpi.unidad}</span>
            </div>
            <div className="text-xs text-tinta-suave">{kpi.etiqueta}</div>
          </div>
        ))}
      </div>

      {/* Tendencia FC */}
      <div className="rounded-tarjeta border border-borde bg-superficie p-5">
        <h3 className="mb-3 font-semibold text-tinta">{t('dash.tendenciaFc')} {rango} {t('dash.dias')}</h3>
        {serieFc.length > 0 ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serieFc}>
                <defs>
                  <linearGradient id="gFc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={tema.series[0]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={tema.series[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hora" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={estiloTooltip} />
                <Area type="monotone" dataKey="valor" name="FC" stroke={tema.series[0]} strokeWidth={2} fill="url(#gFc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-tinta-suave">{t('dash.sinDatosFc')}</p>
        )}
      </div>

      {/* Alertas recientes */}
      {alertas.recientes?.length > 0 && (
        <div className="rounded-tarjeta border border-borde bg-superficie p-5">
          <h3 className="mb-3 font-semibold text-tinta">{t('dash.alertasRecientes')}</h3>
          <div className="space-y-2">
            {alertas.recientes.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <AlertTriangle size={14} className={a.severidad === 'critica' ? 'text-critico' : 'text-advertencia-fuerte'} />
                <span className="text-tinta">{a.mensaje}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
