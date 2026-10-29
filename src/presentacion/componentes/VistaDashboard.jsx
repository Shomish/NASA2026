/**
 * @fileoverview Vista Dashboard (página principal del shell).
 * Hero con anillo Inti, tarjeta de estado de misión, KPIs y gráficos.
 * @module presentacion/componentes/VistaDashboard
 */

import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, HeartPulse, Moon, AlertTriangle, TrendingUp } from 'lucide-react'
import { vitales24Horas } from '../../datos/mockDatos.js'
import { SelectorSegmentado } from '../sistema/movil/SelectorSegmentado.jsx'
import { useTema } from '../sistema/tema.jsx'

/** Etiquetas de la dona (los colores vienen de `tema.series`). */
const ETIQUETAS_DONA = ['Signos', 'Sueño', 'Mental', 'Radiación']
const VALORES_DONA = [14, 7, 4, 3]

/**
 * Saludo según la hora.
 * @returns {string} Saludo.
 */
function saludoPorHora() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Dashboard principal.
 * @returns {import('react').JSX.Element} Dashboard.
 */
export default function VistaDashboard() {
  const [rango, setRango] = useState('7')
  const { tema, modoEfectivo } = useTema()
  const tokens = tema[modoEfectivo] ?? tema.oscuro
  const serie = tema.series

  const series = useMemo(() => vitales24Horas.map((v, i) => ({ ...v, indice: i })), [])

  const datosDona = ETIQUETAS_DONA.map((nombre, i) => ({ nombre, valor: VALORES_DONA[i], color: serie[i % serie.length] }))

  const estiloTooltip = { background: `rgb(${tokens.superficie})`, border: `1px solid rgb(${tokens.borde})`, borderRadius: 8, color: `rgb(${tokens.tinta})` }

  const kpis = [
    { etiqueta: 'Frecuencia cardíaca', valor: '72', unidad: 'lpm', icono: HeartPulse, color: 'text-primario', fondo: 'bg-primario/10', tendencia: '+2% vs ayer' },
    { etiqueta: 'Saturación de O₂', valor: '97', unidad: '%', icono: Activity, color: 'text-secundario', fondo: 'bg-secundario/10', tendencia: 'estable' },
    { etiqueta: 'Sueño', valor: '8h', unidad: 'calidad 8/10', icono: Moon, color: 'text-exito', fondo: 'bg-exito/10', tendencia: '+1h vs ayer' },
    { etiqueta: 'Alertas activas', valor: '0', unidad: '', icono: AlertTriangle, color: 'text-advertencia', fondo: 'bg-advertencia/10', tendencia: 'sin cambios' },
  ]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-tarjeta border border-borde bg-gradient-to-r from-teja to-teja-fuerte p-6">
        <div className="textura-andina absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              <span className="font-mono">En vivo · Sistema estable</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold text-white">{saludoPorHora()}, Ana 👋</h1>
            <p className="mt-1 text-white/80">Hoy llevas 2 mediciones registradas y 0 alertas. Tu estado global es óptimo.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-boton bg-white px-4 py-2 text-sm font-semibold text-teja-fuerte">Registrar medición</button>
              <button type="button" className="rounded-boton border border-white/40 px-4 py-2 text-sm font-medium text-white">Ver historial</button>
            </div>
          </div>
          {/* Anillo Inti */}
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--andino-dorado))" strokeWidth="8" strokeDasharray="264" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xl font-bold text-white">100</span>
              <span className="font-mono text-[10px] text-white/80">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de misión */}
      <div className="rounded-tarjeta border border-borde bg-superficie-elevada p-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-exito" />
          <span className="font-mono text-xs uppercase tracking-widest text-tinta-suave">Operativo</span>
        </div>
        <div className="mt-3 font-mono text-4xl font-bold text-tinta">Día 120</div>
        <div className="mt-2 space-y-1 font-mono text-xs text-tinta-suave">
          <div>IMC: 22.8</div>
          <div>Conexión: Autónomo · offline</div>
          <div>Última medición: 15:42</div>
        </div>
        <div className="mt-2 text-xs text-tinta-suave">Ana Quispe · Comandante · desde 05:42</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.etiqueta} className="rounded-tarjeta border border-borde bg-superficie p-5">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.fondo}`}>
                <kpi.icono size={20} className={kpi.color} />
              </div>
              <span className="flex items-center gap-1 font-mono text-[10px] text-tinta-suave"><TrendingUp size={12} /> {kpi.tendencia}</span>
            </div>
            <div className="mt-3 font-mono text-3xl font-bold">
              {kpi.valor} <span className="text-sm font-normal text-tinta-suave">{kpi.unidad}</span>
            </div>
            <div className="text-sm text-tinta-suave">{kpi.etiqueta}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-tarjeta border border-borde bg-superficie p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Signos vitales · evolución diaria</h3>
            <SelectorSegmentado
              opciones={[{ valor: '7', etiqueta: '7d' }, { valor: '30', etiqueta: '30d' }, { valor: '60', etiqueta: '60d' }]}
              valor={rango}
              alCambiar={setRango}
            />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gFc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={serie[0]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={serie[0]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gO2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={serie[3]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={serie[3]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hora" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={estiloTooltip} />
                <Area type="monotone" dataKey="frecuenciaCardiaca" name="FC" stroke={serie[0]} strokeWidth={2} fill="url(#gFc)" />
                <Area type="monotone" dataKey="saturacion" name="SpO₂" stroke={serie[3]} strokeWidth={2} fill="url(#gO2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-tarjeta border border-borde bg-superficie p-5">
          <h3 className="mb-3 font-semibold">Registros por tipo</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datosDona} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={70} paddingAngle={3}>
                  {datosDona.map((d) => (
                    <Cell key={d.nombre} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={estiloTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1">
            {datosDona.map((d) => (
              <div key={d.nombre} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-tinta-suave">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.nombre}
                </span>
                <span className="font-mono">{d.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
