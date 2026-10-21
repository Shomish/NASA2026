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

/** Datos de la dona (registros por tipo). */
const DATOS_DONA = [
  { nombre: 'Signos', valor: 14, color: '#E8894F' },
  { nombre: 'Sueño', valor: 7, color: '#E0B04F' },
  { nombre: 'Mental', valor: 4, color: '#2BB3A3' },
  { nombre: 'Radiación', valor: 3, color: '#3FA37A' },
]

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

  const series = useMemo(() => vitales24Horas.map((v, i) => ({ ...v, indice: i })), [])

  const kpis = [
    { etiqueta: 'Frecuencia cardíaca', valor: '72', unidad: 'lpm', icono: HeartPulse, color: 'text-primario', fondo: 'bg-primario/10', tendencia: '+2% vs ayer' },
    { etiqueta: 'Saturación de O₂', valor: '97', unidad: '%', icono: Activity, color: 'text-secundario', fondo: 'bg-secundario/10', tendencia: 'estable' },
    { etiqueta: 'Sueño', valor: '8h', unidad: 'calidad 8/10', icono: Moon, color: 'text-exito', fondo: 'bg-exito/10', tendencia: '+1h vs ayer' },
    { etiqueta: 'Alertas activas', valor: '0', unidad: '', icono: AlertTriangle, color: 'text-advertencia', fondo: 'bg-advertencia/10', tendencia: 'sin cambios' },
  ]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-tarjeta border border-borde bg-gradient-to-r from-primario to-primario-fuerte p-6">
        <div className="textura-andina absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              <span className="font-mono">● En vivo · Sistema estable</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold text-white">{saludoPorHora()}, Ana 👋</h1>
            <p className="mt-1 text-white/80">Hoy llevas 2 mediciones registradas y 0 alertas. Tu estado global es óptimo.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-boton bg-white px-4 py-2 text-sm font-semibold text-primario-fuerte">Registrar medición</button>
              <button type="button" className="rounded-boton border border-white/40 px-4 py-2 text-sm font-medium text-white">Ver historial</button>
            </div>
          </div>
          {/* Anillo Inti */}
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E0B04F" strokeWidth="8" strokeDasharray="264" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xl font-bold text-white">100</span>
              <span className="font-mono text-[10px] text-white/80">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de misión */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-tarjeta border border-borde bg-[#0E1A2B] p-5 text-white">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-widest">Operativo</span>
          </div>
          <div className="mt-3 font-mono text-4xl font-bold">Día 120</div>
          <div className="mt-2 space-y-1 font-mono text-xs text-white/70">
            <div>IMC: 22.8</div>
            <div>Conexión: Autónomo · offline</div>
            <div>Última medición: 15:42</div>
          </div>
          <div className="mt-2 text-xs text-white/60">Ana Quispe · Comandante · desde 05:42</div>
        </div>

        {/* KPIs */}
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
                    <stop offset="0%" stopColor="#E8894F" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#E8894F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gO2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3FA37A" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3FA37A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hora" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={{ background: '#1A1613', border: '1px solid #3A322A', borderRadius: 8, color: '#F7F1E8' }} />
                <Area type="monotone" dataKey="frecuenciaCardiaca" name="FC" stroke="#E8894F" strokeWidth={2} fill="url(#gFc)" />
                <Area type="monotone" dataKey="saturacion" name="SpO₂" stroke="#3FA37A" strokeWidth={2} fill="url(#gO2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-tarjeta border border-borde bg-superficie p-5">
          <h3 className="mb-3 font-semibold">Registros por tipo</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DATOS_DONA} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={70} paddingAngle={3}>
                  {DATOS_DONA.map((d) => (
                    <Cell key={d.nombre} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1613', border: '1px solid #3A322A', borderRadius: 8, color: '#F7F1E8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1">
            {DATOS_DONA.map((d) => (
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
