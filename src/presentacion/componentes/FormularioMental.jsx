/**
 * @fileoverview Formulario completo de PHQ-9 y GAD-7 con validación y aviso de ítem 9.
 * @module presentacion/componentes/FormularioMental
 */

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { InsigniaEstado } from './UtilidadesUi.jsx'
import { useIdioma } from '../../shared/idioma.js'
import { CUESTIONARIOS, TEXTOS_MENTALES } from '../../../shared/cuestionarios.js'
import { interpretarPhq9, interpretarGad7, item9Phq9Positivo, sumarRespuestas } from '../../../shared/evaluaciones.js'

/**
 * Formulario de salud mental PHQ-9 / GAD-7.
 * @param {object} props - Propiedades.
 * @param {object[]} props.mentales - Evaluaciones guardadas.
 * @param {(registro: object) => void} props.alAgregar - Agrega un registro o alerta local.
 * @param {(id: string) => void} props.alEliminar - Elimina una evaluación.
 * @returns {import('react').JSX.Element} Formulario.
 */
export default function FormularioMental({ mentales = [], alAgregar, alEliminar }) {
  const idioma = useIdioma((s) => s.idioma)
  const textos = TEXTOS_MENTALES[idioma] ?? TEXTOS_MENTALES.es
  const [cuestionario, setCuestionario] = useState('phq9')
  const [respuestas, setRespuestas] = useState({})
  const [mostrarFaltantes, setMostrarFaltantes] = useState(false)
  const [ayudaInmediata, setAyudaInmediata] = useState(false)

  const preguntas = CUESTIONARIOS[cuestionario][idioma] ?? CUESTIONARIOS[cuestionario].es
  const opciones = textos.opciones
  const faltantes = preguntas.map((_, i) => respuestas[i] === undefined)
  const hayFaltantes = faltantes.some(Boolean)

  const cambiarCuestionario = (nuevo) => {
    setCuestionario(nuevo)
    setRespuestas({})
    setMostrarFaltantes(false)
    setAyudaInmediata(false)
  }

  const guardar = () => {
    if (hayFaltantes) {
      setMostrarFaltantes(true)
      return
    }

    const respuestasArray = preguntas.map((_, i) => Number(respuestas[i]))
    const puntaje = sumarRespuestas(respuestasArray)
    const item9 = cuestionario === 'phq9' && item9Phq9Positivo(respuestasArray)
    const nivel = cuestionario === 'phq9' ? interpretarPhq9(puntaje) : interpretarGad7(puntaje)

    alAgregar({ tipo: 'mental', cuestionario, respuestas: respuestasArray, puntaje, nivel, item9_positivo: item9 })

    if (item9) {
      alAgregar({ tipo: 'alerta', severidad: 'critico', mensaje: textos.ayudaItem9 })
      setAyudaInmediata(true)
    }

    setRespuestas({})
    setMostrarFaltantes(false)
  }

  const estadoNivel = (nivel) => {
    if (nivel === 'moderada') return 'atencion'
    if (nivel === 'moderadamente severa' || nivel === 'severa') return 'critico'
    return 'optimo'
  }

  const nivelVisible = (nivel) => textos.niveles[nivel] ?? nivel

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {['phq9', 'gad7'].map((clave) => (
          <button
            key={clave}
            type="button"
            onClick={() => cambiarCuestionario(clave)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${cuestionario === clave ? 'bg-primario text-white' : 'bg-superficie-alta text-tinta'}`}
            aria-pressed={cuestionario === clave}
          >
            {textos[clave]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {preguntas.map((pregunta, i) => {
          const falta = mostrarFaltantes && faltantes[i]
          return (
            <div
              key={`${cuestionario}-${i}`}
              className={`rounded-lg border p-2 transition-colors ${falta ? 'border-rose-500/60 bg-critico/5' : 'border-transparent'}`}
            >
              <div className="flex items-start justify-between gap-2 text-xs text-tinta">
                <span className="flex-1">{i + 1}. {pregunta}</span>
                {falta && <span className="shrink-0 text-[10px] font-mono text-critico">{textos.faltaPregunta}</span>}
              </div>
              <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-4">
                {opciones.map((opcion, valor) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setRespuestas((a) => ({ ...a, [i]: valor }))}
                    className={`rounded-lg px-2 py-1.5 text-left text-[11px] sm:text-center ${respuestas[i] === valor ? 'bg-primario text-white' : 'bg-superficie-alta text-tinta-suave hover:text-tinta'}`}
                    aria-pressed={respuestas[i] === valor}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {mostrarFaltantes && hayFaltantes && (
        <p className="text-xs font-medium text-critico" role="alert">{textos.faltan}</p>
      )}

      {ayudaInmediata && (
        <div className="rounded-lg border border-critico/50 bg-critico/10 p-3 text-xs text-critico" role="alert">
          {textos.ayudaItem9}
        </div>
      )}

      <button type="button" onClick={guardar} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primario hover:bg-primario-fuerte text-white text-sm">
        <Plus size={14} /> {textos.guardar}
      </button>

      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wide text-tinta-suave">{textos.resultado}</div>
        {mentales.length > 0 ? (
          <ul className="space-y-1">
            {mentales.map((m) => {
              const nivel = m.nivel ?? (m.cuestionario === 'gad7' ? interpretarGad7(m.puntaje) : interpretarPhq9(m.puntaje))
              return (
                <li key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-superficie-alta/60 text-xs font-mono">
                  <span className="text-tinta">{String(m.cuestionario ?? 'phq9').toUpperCase()}: {m.puntaje} · {nivelVisible(nivel)}</span>
                  <span className="flex items-center gap-2">
                    <InsigniaEstado estado={estadoNivel(nivel)} etiqueta={nivelVisible(nivel)} />
                    <button type="button" onClick={() => alEliminar(m.id)} className="text-critico"><Trash2 size={13} /></button>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-tinta-suave">{textos.sinEvaluaciones}</p>
        )}
      </div>

      <p className="rounded-lg border border-borde bg-superficie-alta/60 px-3 py-2 text-[11px] text-tinta-suave">
        {textos.aviso}
      </p>
    </div>
  )
}
