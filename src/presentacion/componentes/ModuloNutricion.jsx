/**
 * @fileoverview Componente ModuloNutricion
 * Nutrición inteligente personalizada: plan por perfil + despensa + contramedidas.
 * @module presentacion/componentes/ModuloNutricion
 */

import { useState } from 'react'
import { Utensils, Leaf, Sparkles, ImageOff } from 'lucide-react'
import { Tarjeta, EncabezadoPanel } from './UtilidadesUi.jsx'
import { despensaGlobal, contramedidasAndinas } from '../../datos/mockDatos.js'
import { generarRecomendacionNutricional } from '../../aplicacion/indice.js'

/** Colores de placeholder por contramedida. */
const COLOR_PLACEHOLDER = {
  violet: 'from-violet-600 to-violet-900',
  emerald: 'from-emerald-600 to-emerald-900',
  teal: 'from-teal-600 to-teal-900',
  orange: 'from-orange-600 to-orange-900',
  rose: 'from-rose-600 to-rose-900',
  amber: 'from-amber-600 to-amber-900',
}

/**
 * Módulo de nutrición inteligente.
 * @param {object} props - Propiedades.
 * @param {import('../../dominio/indice.js').Astronauta} props.persona - Persona.
 * @param {object} props.signos - Signos vitales.
 * @returns {import('react').JSX.Element} Módulo.
 */
export default function ModuloNutricion({ persona, signos }) {
  const [pestana, setPestana] = useState('plan')
  const recomendacion = persona ? generarRecomendacionNutricional(persona, signos) : null

  return (
    <Tarjeta clase="p-5 space-y-4">
      <EncabezadoPanel icono={<Utensils size={18} />} titulo="Nutrición Inteligente" subtitulo="Plan personalizado por perfil" />

      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 w-fit flex-wrap">
        <button type="button" onClick={() => setPestana('plan')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pestana === 'plan' ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}>
          <Sparkles size={15} /> Plan Personalizado
        </button>
        <button type="button" onClick={() => setPestana('despensa')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pestana === 'despensa' ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}>
          <Utensils size={15} /> Despensa Global
        </button>
        <button type="button" onClick={() => setPestana('andinas')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pestana === 'andinas' ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-neutral-100'}`}>
          <Leaf size={15} /> Contramedidas Andinas
        </button>
      </div>

      {pestana === 'plan' && <PlanPersonalizado persona={persona} recomendacion={recomendacion} />}
      {pestana === 'despensa' && <DespensaGlobal />}
      {pestana === 'andinas' && <ContramedidasAndinas recomendacion={recomendacion} />}
    </Tarjeta>
  )
}

/**
 * Plan personalizado según perfil.
 */
function PlanPersonalizado({ persona, recomendacion }) {
  if (!persona) return <p className="text-sm text-neutral-500">Selecciona un tripulante para generar el plan.</p>

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-600/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-violet-400" />
          <span className="font-semibold text-neutral-100">Plan para {persona.nombre}</span>
        </div>
        <p className="text-sm text-neutral-300">{recomendacion?.resumen}</p>
        <div className="mt-2 text-xs font-mono text-neutral-400">
          IMC {persona.imc()} · Objetivo: {persona.objetivoSalud || '—'} · Alergias: {persona.alergias?.join(', ') || 'ninguna'}
        </div>
      </div>

      {recomendacion?.contramedidas?.length > 0 && (
        <div>
          <div className="text-xs font-mono text-neutral-500 mb-2">Contramedidas recomendadas</div>
          <div className="grid grid-cols-2 gap-2">
            {recomendacion.contramedidas.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-800">
                <div className="font-medium text-neutral-100 text-sm">{c.nombre}</div>
                <div className="text-xs text-emerald-400">{c.beneficio}</div>
                <div className="text-[10px] font-mono text-neutral-500">{c.dosis}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recomendacion?.raciones?.length > 0 && (
        <div>
          <div className="text-xs font-mono text-neutral-500 mb-2">Raciones sugeridas de la despensa</div>
          <div className="flex flex-wrap gap-2">
            {recomendacion.raciones.map((r) => (
              <span key={r.id} className="px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-xs text-neutral-200">
                {r.nombre} · {r.calorias} kcal
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Despensa global.
 */
function DespensaGlobal() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {despensaGlobal.map((item) => (
        <div key={item.id} className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-100 text-sm">{item.nombre}</span>
            <span className="font-mono text-xs text-neutral-500">stock {item.stock}</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-neutral-200">{item.calorias} kcal</span>
            <span className="text-emerald-400">P {item.proteinas}g</span>
            <span className="text-orange-400">C {item.carbohidratos}g</span>
            <span className="text-violet-400">G {item.grasas}g</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Contramedidas andinas con resaltado de las recomendadas.
 */
function ContramedidasAndinas({ recomendacion }) {
  const idsRecomendados = new Set((recomendacion?.contramedidas ?? []).map((c) => c.id))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {contramedidasAndinas.map((item) => {
        const gradiente = COLOR_PLACEHOLDER[item.color] ?? 'from-neutral-700 to-neutral-900'
        const recomendada = idsRecomendados.has(item.id)
        return (
          <div key={item.id} className={`rounded-xl border overflow-hidden flex flex-col ${recomendada ? 'border-violet-500/50 ring-1 ring-violet-500/20' : 'border-neutral-800'}`}>
            <div className={`h-24 bg-gradient-to-br ${gradiente} flex items-center justify-center relative`}>
              <ImageOff size={24} className="text-white/50" />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-white/80">img: {item.imagen}</span>
              {recomendada && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-violet-600 text-[9px] font-mono text-white">Recomendada</span>
              )}
            </div>
            <div className="p-3 space-y-1.5 flex-1">
              <div>
                <div className="font-semibold text-neutral-100 text-sm">{item.nombre}</div>
                <div className="font-mono text-[10px] italic text-neutral-500">{item.nombreCientifico}</div>
              </div>
              <p className="text-xs text-neutral-300">{item.detalle}</p>
              <div className="pt-2 border-t border-neutral-800 space-y-1 font-mono text-[10px]">
                <div className="text-emerald-400">Mitiga: {item.beneficio}</div>
                <div className="text-neutral-400">Dosis: {item.dosis}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
