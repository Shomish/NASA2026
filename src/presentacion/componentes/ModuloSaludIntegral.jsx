/**
 * @fileoverview Componente ModuloSaludIntegral
 * Salud mental (PHQ-9/GAD-7), sueño y radiación con CRUD, en tabs internos.
 * @module presentacion/componentes/ModuloSaludIntegral
 */

import { useState } from 'react'
import { Brain, Moon, Radiation, Plus, Trash2 } from 'lucide-react'
import { Tarjeta, EncabezadoPanel, InsigniaEstado } from './UtilidadesUi.jsx'

/** Preguntas del PHQ-9 (abreviadas). */
const PREGUNTAS_PHQ9 = [
  'Poco interés o placer en hacer las cosas',
  'Sentirse desanimado o sin esperanza',
  'Problemas para dormir o dormir demasiado',
  'Sentirse cansado o con poca energía',
  'Poco apetito o comer en exceso',
  'Dificultad para concentrarse',
  'Pensamientos de hacerse daño',
]
/** Preguntas del GAD-7. */
const PREGUNTAS_GAD7 = [
  'Sentirse nervioso o al límite',
  'No poder dejar de preocuparse',
  'Dificultad para relajarse',
  'Irritarse fácilmente',
  'Sentir miedo de que algo terrible pase',
]

/**
 * Módulo de salud integral (mental, sueño, radiación).
 * @param {object} props - Propiedades.
 * @param {object[]} props.registros - Registros de la persona.
 * @param {(registro: object) => void} props.alAgregar - Agregar registro.
 * @param {(id: string) => void} props.alEliminar - Eliminar registro.
 * @returns {import('react').JSX.Element} Módulo.
 */
export default function ModuloSaludIntegral({ registros = [], alAgregar, alEliminar }) {
  const [pestana, setPestana] = useState('sueno')
  const suenos = registros.filter((r) => r.tipo === 'sueno')
  const mentales = registros.filter((r) => r.tipo === 'mental')
  const radiaciones = registros.filter((r) => r.tipo === 'radiacion')

  return (
    <Tarjeta clase="p-5 space-y-4">
      <EncabezadoPanel icono={<Brain size={18} />} titulo="Salud Integral" subtitulo="Mental · Sueño · Radiación" />

      <div className="flex gap-1 bg-superficie border border-borde rounded-xl p-1 w-fit">
        {[
          { id: 'sueno', etiqueta: 'Sueño', icono: Moon },
          { id: 'mental', etiqueta: 'Salud mental', icono: Brain },
          { id: 'radiacion', etiqueta: 'Radiación', icono: Radiation },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pestana === p.id ? 'bg-primario text-white' : 'text-tinta-suave hover:text-tinta'
            }`}
          >
            <p.icono size={15} />
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'sueno' && <FormularioSueno suenos={suenos} alAgregar={alAgregar} alEliminar={alEliminar} />}
      {pestana === 'mental' && <FormularioMental mentales={mentales} alAgregar={alAgregar} alEliminar={alEliminar} />}
      {pestana === 'radiacion' && <FormularioRadiacion radiaciones={radiaciones} alAgregar={alAgregar} alEliminar={alEliminar} />}
    </Tarjeta>
  )
}

/**
 * Formulario de sueño.
 */
function FormularioSueno({ suenos, alAgregar, alEliminar }) {
  const [horas, setHoras] = useState('8')
  const [calidad, setCalidad] = useState('8')
  const [interrupciones, setInterrupciones] = useState('1')

  const guardar = () => {
    if (!horas) return
    alAgregar({ tipo: 'sueno', horas: Number(horas), calidad: Number(calidad), interrupciones: Number(interrupciones) })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-mono text-tinta-suave">Horas</label>
          <input type="number" className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm" value={horas} onChange={(e) => setHoras(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-mono text-tinta-suave">Calidad (0-10)</label>
          <input type="number" className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm" value={calidad} onChange={(e) => setCalidad(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-mono text-tinta-suave">Despertares</label>
          <input type="number" className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm" value={interrupciones} onChange={(e) => setInterrupciones(e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={guardar} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primario hover:bg-primario-fuerte text-white text-sm">
        <Plus size={14} /> Registrar sueño
      </button>

      {suenos.length > 0 && (
        <ul className="space-y-1">
          {suenos.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-superficie-alta/60 text-xs font-mono text-tinta">
              <span>{s.horas}h · calidad {s.calidad}/10 · {s.interrupciones} despertares</span>
              <span className="flex items-center gap-2">
                <span className="text-tinta-suave">{new Date(s.instante).toLocaleDateString('es-PE')}</span>
                <button type="button" onClick={() => alEliminar(s.id)} className="text-critico"><Trash2 size={13} /></button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Formulario de salud mental.
 */
function FormularioMental({ mentales, alAgregar, alEliminar }) {
  const [cuestionario, setCuestionario] = useState('phq9')
  const [respuestas, setRespuestas] = useState({})

  const preguntas = cuestionario === 'phq9' ? PREGUNTAS_PHQ9 : PREGUNTAS_GAD7

  const guardar = () => {
    const puntaje = Object.values(respuestas).reduce((s, v) => s + Number(v), 0)
    alAgregar({ tipo: 'mental', cuestionario, puntaje })
    setRespuestas({})
  }

  const interpretar = (cuestionario, puntaje) => {
    if (cuestionario === 'phq9') return puntaje >= 10 ? 'requiere atención' : 'manejable'
    return puntaje >= 10 ? 'requiere atención' : 'manejable'
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {['phq9', 'gad7'].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCuestionario(c)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${cuestionario === c ? 'bg-primario text-white' : 'bg-superficie-alta text-tinta'}`}
          >
            {c === 'phq9' ? 'PHQ-9 (depresión)' : 'GAD-7 (ansiedad)'}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {preguntas.map((pregunta, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-tinta">
            <span className="flex-1">{i + 1}. {pregunta}</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRespuestas((a) => ({ ...a, [i]: v }))}
                  className={`w-7 h-7 rounded text-[10px] ${respuestas[i] === v ? 'bg-primario text-white' : 'bg-superficie-alta text-tinta-suave'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={guardar} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primario hover:bg-primario-fuerte text-white text-sm">
        <Plus size={14} /> Guardar evaluación
      </button>

      {mentales.length > 0 && (
        <ul className="space-y-1">
          {mentales.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-superficie-alta/60 text-xs font-mono">
              <span className="text-tinta">{m.cuestionario.toUpperCase()}: {m.puntaje}</span>
              <span className="flex items-center gap-2">
                <InsigniaEstado estado={interpretar(m.cuestionario, m.puntaje) === 'requiere atención' ? 'atencion' : 'optimo'} etiqueta={interpretar(m.cuestionario, m.puntaje)} />
                <button type="button" onClick={() => alEliminar(m.id)} className="text-critico"><Trash2 size={13} /></button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Formulario de radiación.
 */
function FormularioRadiacion({ radiaciones, alAgregar, alEliminar }) {
  const [dosis, setDosis] = useState('0.5')
  const total = radiaciones.reduce((s, r) => s + r.dosis, 0)

  const guardar = () => {
    if (!dosis) return
    alAgregar({ tipo: 'radiacion', dosis: Number(dosis) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input type="number" className="w-32 bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm" value={dosis} onChange={(e) => setDosis(e.target.value)} />
        <span className="text-xs font-mono text-tinta-suave">mSv</span>
        <button type="button" onClick={guardar} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primario hover:bg-primario-fuerte text-white text-sm">
          <Plus size={14} /> Registrar dosis
        </button>
      </div>

      <div className="p-3 rounded-lg bg-superficie-alta/60">
        <span className="text-xs font-mono text-tinta-suave">Dosis acumulada: </span>
        <span className="font-mono text-lg font-bold text-andino-dorado">{total.toFixed(1)} mSv</span>
      </div>

      {radiaciones.length > 0 && (
        <ul className="space-y-1">
          {radiaciones.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-superficie-alta/60 text-xs font-mono text-tinta">
              <span>+{r.dosis} mSv</span>
              <button type="button" onClick={() => alEliminar(r.id)} className="text-critico"><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
