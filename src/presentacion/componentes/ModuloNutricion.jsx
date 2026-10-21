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
import { calcularIMC } from '../../dominio/indice.js'

/** Colores de placeholder por contramedida. */
const COLOR_PLACEHOLDER = {
  violet: 'from-primario to-violet-900',
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

      <div className="flex gap-1 bg-superficie border border-borde rounded-xl p-1 w-fit flex-wrap">
        <button type="button" onClick={() => setPestana('plan')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pestana === 'plan' ? 'bg-primario text-white' : 'text-tinta-suave hover:text-tinta'}`}>
          <Sparkles size={15} /> Plan Personalizado
        </button>
        <button type="button" onClick={() => setPestana('despensa')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pestana === 'despensa' ? 'bg-primario text-white' : 'text-tinta-suave hover:text-tinta'}`}>
          <Utensils size={15} /> Despensa Global
        </button>
        <button type="button" onClick={() => setPestana('andinas')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${pestana === 'andinas' ? 'bg-primario text-white' : 'text-tinta-suave hover:text-tinta'}`}>
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
  if (!persona) return <p className="text-sm text-tinta-suave">Selecciona un tripulante para generar el plan.</p>

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-primario/30 bg-primario/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-primario" />
          <span className="font-semibold text-tinta">Plan para {persona.nombre}</span>
        </div>
        <p className="text-sm text-tinta">{recomendacion?.resumen}</p>
        <div className="mt-2 text-xs font-mono text-tinta-suave">
          IMC {calcularIMC(persona.pesoKg, persona.alturaCm)} · Objetivo: {persona.objetivoSalud || '—'} · Alergias: {persona.alergias?.join(', ') || 'ninguna'}
        </div>
      </div>

      {recomendacion?.contramedidas?.length > 0 && (
        <div>
          <div className="text-xs font-mono text-tinta-suave mb-2">Contramedidas recomendadas</div>
          <div className="grid grid-cols-2 gap-2">
            {recomendacion.contramedidas.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-superficie-alta/60 border border-borde">
                <div className="font-medium text-tinta text-sm">{c.nombre}</div>
                <div className="text-xs text-exito">{c.beneficio}</div>
                <div className="text-[10px] font-mono text-tinta-suave">{c.dosis}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recomendacion?.raciones?.length > 0 && (
        <div>
          <div className="text-xs font-mono text-tinta-suave mb-2">Raciones sugeridas de la despensa</div>
          <div className="flex flex-wrap gap-2">
            {recomendacion.raciones.map((r) => (
              <span key={r.id} className="px-3 py-1.5 rounded-full bg-superficie-alta border border-borde text-xs text-tinta">
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
        <div key={item.id} className="p-3 rounded-xl border border-borde bg-superficie/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-tinta text-sm">{item.nombre}</span>
            <span className="font-mono text-xs text-tinta-suave">stock {item.stock}</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-tinta">{item.calorias} kcal</span>
            <span className="text-exito">P {item.proteinas}g</span>
            <span className="text-advertencia">C {item.carbohidratos}g</span>
            <span className="text-primario">G {item.grasas}g</span>
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
          <div key={item.id} className={`rounded-xl border overflow-hidden flex flex-col ${recomendada ? 'border-primario/50 ring-1 ring-primario/20' : 'border-borde'}`}>
            <div className={`h-24 bg-gradient-to-br ${gradiente} flex items-center justify-center relative`}>
              <ImageOff size={24} className="text-white/50" />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-white/80">img: {item.imagen}</span>
              {recomendada && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-primario text-[9px] font-mono text-white">Recomendada</span>
              )}
            </div>
            <div className="p-3 space-y-1.5 flex-1">
              <div>
                <div className="font-semibold text-tinta text-sm">{item.nombre}</div>
                <div className="font-mono text-[10px] italic text-tinta-suave">{item.nombreCientifico}</div>
              </div>
              <p className="text-xs text-tinta">{item.detalle}</p>
              <div className="pt-2 border-t border-borde space-y-1 font-mono text-[10px]">
                <div className="text-exito">Mitiga: {item.beneficio}</div>
                <div className="text-tinta-suave">Dosis: {item.dosis}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
