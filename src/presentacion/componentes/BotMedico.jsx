/**
 * @fileoverview Componente BotMedico
 * Asistente de IA predictivo (panel lateral tipo chat/feed de alertas).
 * @module presentacion/componentes/BotMedico
 */

import { Bot, Sparkles } from 'lucide-react'
import { Tarjeta, CLASES_ESTADO } from './UtilidadesUi.jsx'

/** Configuración visual por severidad. */
const SEVERIDAD_ESTADO = {
  optimo: 'optimo',
  informativo: 'neutro',
  atencion: 'atencion',
  critico: 'critico',
}

/**
 * Bot médico predictivo.
 * @param {object} props - Propiedades.
 * @param {Array<{id: string, severidad: string, mensaje: string, instante: string}>} props.mensajes - Mensajes.
 * @param {boolean} props.analizando - Si está analizando.
 * @returns {import('react').JSX.Element} Panel del bot.
 */
export default function BotMedico({ mensajes = [], analizando = false }) {
  return (
    <Tarjeta clase="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-100 leading-tight">Asistente de IA Predictivo</h3>
            <p className="text-xs font-mono text-neutral-500">Bot Médico · análisis continuo</p>
          </div>
        </div>
        <Sparkles size={16} className="text-violet-400 animate-pulso-suave" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[560px] pr-1">
        {mensajes.map((mensaje) => {
          const estado = SEVERIDAD_ESTADO[mensaje.severidad] ?? 'neutro'
          const clases = CLASES_ESTADO[estado] ?? CLASES_ESTADO.neutro
          return (
            <div
              key={mensaje.id}
              className={`p-3 rounded-xl border text-sm ${clases.borde} bg-neutral-900/70`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Bot size={12} className={clases.texto} />
                <span className={`font-mono text-[10px] uppercase tracking-wider ${clases.texto}`}>
                  {mensaje.severidad}
                </span>
                <span className="ml-auto font-mono text-[10px] text-neutral-600">{mensaje.instante}</span>
              </div>
              <p className="text-neutral-300 leading-relaxed text-[13px]">{mensaje.mensaje}</p>
            </div>
          )
        })}

        {analizando && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-neutral-800 text-neutral-500 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Analizando signos vitales...
          </div>
        )}
      </div>
    </Tarjeta>
  )
}
