/**
 * @fileoverview Componente ModuloNutricion
 * Nutrición inteligente personalizada: plan por perfil + despensa + contramedidas.
 * Permite agregar manualmente alimentos a la despensa y contramedidas andinas.
 * @module presentacion/componentes/ModuloNutricion
 */

import { useState } from 'react'
import { Utensils, Leaf, Sparkles, Plus, Trash2 } from 'lucide-react'
import { Tarjeta, EncabezadoPanel } from './UtilidadesUi.jsx'
import { despensaGlobal, contramedidasAndinas } from '../../datos/mockDatos.js'
import { generarRecomendacionNutricional } from '../../aplicacion/indice.js'
import { calcularIMC } from '../../dominio/indice.js'

/**
 * Módulo de nutrición inteligente.
 * @param {object} props - Propiedades.
 * @param {import('../../dominio/indice.js').Astronauta} props.persona - Persona.
 * @param {object} props.signos - Signos vitales.
 * @returns {import('react').JSX.Element} Módulo.
 */
export default function ModuloNutricion({ persona, signos }) {
  const [pestana, setPestana] = useState('plan')
  const [despensa, setDespensa] = useState(despensaGlobal)
  const [contramedidas, setContramedidas] = useState(contramedidasAndinas)
  const recomendacion = persona ? generarRecomendacionNutricional(persona, signos) : null

  const agregarDespensa = (item) => setDespensa((prev) => [...prev, { id: `custom-${Date.now()}`, etiquetas: [], ...item }])
  const agregarContramedida = (item) => setContramedidas((prev) => [...prev, { id: `custom-${Date.now()}`, color: 'emerald', ...item }])
  const quitarDespensa = (id) => setDespensa((prev) => prev.filter((i) => i.id !== id))
  const quitarContramedida = (id) => setContramedidas((prev) => prev.filter((i) => i.id !== id))

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
      {pestana === 'despensa' && <DespensaGlobal items={despensa} alAgregar={agregarDespensa} alQuitar={quitarDespensa} />}
      {pestana === 'andinas' && <ContramedidasAndinas items={contramedidas} recomendacion={recomendacion} alAgregar={agregarContramedida} alQuitar={quitarContramedida} />}
    </Tarjeta>
  )
}

/**
 * Plan personalizado según perfil (auto-generado).
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
          <div className="text-xs font-mono text-tinta-suave mb-2">Contramedidas recomendadas (auto-generadas según perfil y signos)</div>
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
 * Despensa global con alta manual.
 */
function DespensaGlobal({ items, alAgregar, alQuitar }) {
  const [forma, setForma] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', calorias: '', proteinas: '', carbohidratos: '', grasas: '', stock: '' })

  const guardar = () => {
    if (!nuevo.nombre.trim()) return
    alAgregar({
      nombre: nuevo.nombre.trim(),
      calorias: Number(nuevo.calorias) || 0,
      proteinas: Number(nuevo.proteinas) || 0,
      carbohidratos: Number(nuevo.carbohidratos) || 0,
      grasas: Number(nuevo.grasas) || 0,
      stock: Number(nuevo.stock) || 0,
    })
    setNuevo({ nombre: '', calorias: '', proteinas: '', carbohidratos: '', grasas: '', stock: '' })
    setForma(false)
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setForma((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primario text-white text-sm">
        <Plus size={14} /> Agregar alimento
      </button>

      {forma && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-borde bg-superficie-alta p-3 sm:grid-cols-6">
          <input className="col-span-2 rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          <input className="rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="kcal" value={nuevo.calorias} onChange={(e) => setNuevo({ ...nuevo, calorias: e.target.value })} />
          <input className="rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="P g" value={nuevo.proteinas} onChange={(e) => setNuevo({ ...nuevo, proteinas: e.target.value })} />
          <input className="rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="C g" value={nuevo.carbohidratos} onChange={(e) => setNuevo({ ...nuevo, carbohidratos: e.target.value })} />
          <input className="rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="G g" value={nuevo.grasas} onChange={(e) => setNuevo({ ...nuevo, grasas: e.target.value })} />
          <div className="col-span-2 flex items-center gap-2 sm:col-span-6">
            <input className="rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="stock" value={nuevo.stock} onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })} />
            <button type="button" onClick={guardar} className="px-3 py-1.5 rounded-lg bg-exito text-white text-sm">Guardar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="p-3 rounded-xl border border-borde bg-superficie/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-tinta text-sm">{item.nombre}</span>
              <span className="flex items-center gap-2 font-mono text-xs text-tinta-suave">
                stock {item.stock}
                <button type="button" onClick={() => alQuitar(item.id)} className="text-critico" aria-label="Eliminar"><Trash2 size={13} /></button>
              </span>
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
    </div>
  )
}

/**
 * Contramedidas andinas (sin imágenes) con alta manual y resaltado de recomendadas.
 */
function ContramedidasAndinas({ items, recomendacion, alAgregar, alQuitar }) {
  const [forma, setForma] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', beneficio: '', dosis: '', detalle: '', riesgo: '' })
  const idsRecomendados = new Set((recomendacion?.contramedidas ?? []).map((c) => c.id))

  const guardar = () => {
    if (!nuevo.nombre.trim()) return
    alAgregar({
      nombre: nuevo.nombre.trim(),
      nombreCientifico: '',
      beneficio: nuevo.beneficio.trim() || 'Refuerzo general',
      dosis: nuevo.dosis.trim() || '—',
      detalle: nuevo.detalle.trim() || '',
      riesgo: nuevo.riesgo.trim() || 'general',
    })
    setNuevo({ nombre: '', beneficio: '', dosis: '', detalle: '', riesgo: '' })
    setForma(false)
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setForma((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primario text-white text-sm">
        <Plus size={14} /> Agregar contramedida
      </button>

      {forma && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-borde bg-superficie-alta p-3">
          <input className="col-span-2 rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          <input className="rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="Beneficio" value={nuevo.beneficio} onChange={(e) => setNuevo({ ...nuevo, beneficio: e.target.value })} />
          <input className="rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="Dosis" value={nuevo.dosis} onChange={(e) => setNuevo({ ...nuevo, dosis: e.target.value })} />
          <input className="col-span-2 rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="Detalle" value={nuevo.detalle} onChange={(e) => setNuevo({ ...nuevo, detalle: e.target.value })} />
          <div className="col-span-2 flex items-center gap-2">
            <input className="flex-1 rounded-boton border border-borde bg-superficie px-2 py-1.5 text-sm" placeholder="Riesgo asociado (ej: anemia)" value={nuevo.riesgo} onChange={(e) => setNuevo({ ...nuevo, riesgo: e.target.value })} />
            <button type="button" onClick={guardar} className="px-3 py-1.5 rounded-lg bg-exito text-white text-sm">Guardar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const recomendada = idsRecomendados.has(item.id)
          return (
            <div key={item.id} className={`rounded-xl border p-3 space-y-1.5 flex flex-col ${recomendada ? 'border-primario/50 ring-1 ring-primario/20' : 'border-borde'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-tinta text-sm">{item.nombre}</div>
                  <div className="font-mono text-[10px] italic text-tinta-suave">{item.nombreCientifico || 'Superalimento andino'}</div>
                </div>
                {recomendada && (
                  <span className="px-1.5 py-0.5 rounded bg-primario text-[9px] font-mono text-white">Recomendada</span>
                )}
              </div>
              <p className="text-xs text-tinta">{item.detalle}</p>
              <div className="pt-2 border-t border-borde space-y-1 font-mono text-[10px]">
                <div className="text-exito">Mitiga: {item.beneficio}</div>
                <div className="text-tinta-suave">Dosis: {item.dosis}</div>
              </div>
              <button type="button" onClick={() => alQuitar(item.id)} className="mt-auto self-end text-critico" aria-label="Eliminar"><Trash2 size={13} /></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
