/**
 * @fileoverview Componente TarjetaEstadoGlobal
 * Puntaje de salud compuesto (circular) y sparklines de FC y O₂ (Recharts).
 * Los colores provienen de los tokens del tema (cero colores a mano).
 * @module presentacion/componentes/TarjetaEstadoGlobal
 */

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { HeartPulse, Activity } from 'lucide-react'
import { Tarjeta, EncabezadoPanel, InsigniaEstado } from './UtilidadesUi.jsx'
import { vitales24Horas } from '../../datos/mockDatos.js'
import { useTema } from '../sistema/tema.jsx'

/**
 * Tarjeta de estado global con puntaje y tendencias.
 * @param {object} props - Propiedades.
 * @param {object} props.resultado - Resultado del puntaje de salud.
 * @returns {import('react').JSX.Element} Tarjeta.
 */
export default function TarjetaEstadoGlobal({ resultado }) {
  const { tema, modoEfectivo } = useTema()
  const tokens = tema[modoEfectivo] ?? tema.oscuro

  const puntaje = resultado?.puntaje ?? 0
  const nivel = resultado?.nivel ?? 'critico'

  // Color del radial según nivel, desde los tokens semánticos.
  const COLOR_NIVEL = {
    optimo: `rgb(${tokens.exito})`,
    atencion: `rgb(${tokens.advertencia})`,
    critico: `rgb(${tokens.critico})`,
  }
  const color = COLOR_NIVEL[nivel] ?? `rgb(${tokens.tinta})`
  const datoRadial = [{ nombre: 'Salud', valor: puntaje, relleno: color }]

  const estiloTooltip = {
    backgroundColor: `rgb(${tokens.superficie})`,
    border: `1px solid rgb(${tokens.borde})`,
    borderRadius: '8px',
    fontSize: '12px',
    color: `rgb(${tokens.tinta})`,
  }
  const colorFc = `rgb(${tokens.critico})`
  const colorO2 = `rgb(${tokens.exito})`

  return (
    <Tarjeta clase="p-5 flex flex-col gap-4">
      <EncabezadoPanel
        icono={<Activity size={18} />}
        titulo="Estado Global de Salud"
        subtitulo="Puntaje compuesto autónomo"
      />

      <div className="flex items-center gap-4">
        {/* Puntaje circular */}
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={datoRadial}
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="valor" cornerRadius={20} fill={color} background />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold text-tinta">{puntaje}</span>
            <span className="font-mono text-[10px] text-tinta-suave uppercase">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <InsigniaEstado estado={nivel} />
          <p className="text-sm text-tinta-suave leading-relaxed">
            Evaluación combinada de presión arterial, saturación de O₂, masa corporal y
            temperatura, procesada de forma autónoma sin conexión a control de misión.
          </p>
        </div>
      </div>

      {/* Sparklines de tendencias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-borde pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse size={14} className="text-critico" />
            <span className="text-xs font-mono text-tinta-suave">Frecuencia cardíaca · 24h</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitales24Horas} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradFc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorFc} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={colorFc} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hora" hide />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                <Tooltip contentStyle={estiloTooltip} />
                <Area type="monotone" dataKey="frecuenciaCardiaca" stroke={colorFc} strokeWidth={2} fill="url(#gradFc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-exito" />
            <span className="text-xs font-mono text-tinta-suave">Saturación O₂ · 24h</span>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitales24Horas} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradO2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorO2} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={colorO2} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hora" hide />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                <Tooltip contentStyle={estiloTooltip} />
                <Area type="monotone" dataKey="saturacion" stroke={colorO2} strokeWidth={2} fill="url(#gradO2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Tarjeta>
  )
}
