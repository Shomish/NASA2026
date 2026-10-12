/**
 * @fileoverview Componente FormularioSignosVitales
 * CRUD manual de signos vitales con validación visual y listado/eliminación.
 * @module presentacion/componentes/FormularioSignosVitales
 */

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Stethoscope, Save, Trash2 } from 'lucide-react'
import { Tarjeta, EncabezadoPanel, InsigniaEstado } from './UtilidadesUi.jsx'
import { RANGOS_SIGNO_VITAL, evaluarSignoVital } from '../../dominio/indice.js'

/** Campos de entrada. */
const CAMPOS = ['sistolica', 'diastolica', 'saturacion_oxigeno', 'masa_corporal', 'temperatura']

/**
 * Formulario de signos vitales con CRUD.
 * @param {object} props - Propiedades.
 * @param {object} props.signos - Valores actuales.
 * @param {(signoTipo: string, valor: number) => void} props.alRegistrar - Crear.
 * @param {object[]} props.registros - Registros de signos (para listado).
 * @param {(id: string) => void} props.alEliminar - Eliminar.
 * @returns {import('react').JSX.Element} Formulario.
 */
export default function FormularioSignosVitales({ signos, alRegistrar, registros = [], alEliminar }) {
  const [valores, setValores] = useState({})
  const [alertas, setAlertas] = useState({})
  const [guardado, setGuardado] = useState(null)

  const actualizar = (clave, crudo) => {
    const valor = crudo === '' ? null : Number(crudo)
    setValores((a) => ({ ...a, [clave]: crudo }))
    const estado = valor !== null && !Number.isNaN(valor) ? evaluarSignoVital(clave, valor) : null
    setAlertas((a) => ({ ...a, [clave]: estado === 'critico' || estado === 'atencion' ? estado : null }))
  }

  const guardarCampo = (clave) => {
    const valor = valores[clave] === '' ? null : Number(valores[clave])
    if (valor === null || Number.isNaN(valor)) return
    alRegistrar(clave, valor)
    setGuardado(clave)
    setValores((a) => ({ ...a, [clave]: '' }))
    setTimeout(() => setGuardado(null), 2000)
  }

  const estiloBorde = (clave) => {
    if (alertas[clave] === 'critico') return 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/40'
    if (alertas[clave] === 'atencion') return 'border-orange-500 focus:border-orange-500 ring-1 ring-orange-500/40'
    return 'border-neutral-700 focus:border-violet-500'
  }

  return (
    <Tarjeta clase="p-5 space-y-4">
      <EncabezadoPanel icono={<Stethoscope size={18} />} titulo="Signos Vitales" subtitulo="CRUD manual · validación inmediata" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CAMPOS.map((clave) => {
          const rango = RANGOS_SIGNO_VITAL[clave]
          return (
            <div key={clave} className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>{rango.etiqueta}</span>
                <span className="text-neutral-600">{rango.unidad}</span>
              </label>
              <input
                type="number"
                className={`w-full bg-neutral-900 border rounded-lg px-3 py-2 font-mono text-lg text-neutral-100 outline-none transition-colors ${estiloBorde(clave)}`}
                placeholder={signos[clave] ?? '—'}
                value={valores[clave] ?? ''}
                onChange={(e) => actualizar(clave, e.target.value)}
              />
              {alertas[clave] && (
                <span className={`flex items-center gap-1 text-[10px] font-mono ${alertas[clave] === 'critico' ? 'text-rose-400' : 'text-orange-400'}`}>
                  <AlertTriangle size={11} /> {alertas[clave] === 'critico' ? 'Crítico' : 'Atención'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {Object.values(alertas).some((a) => a === 'critico') && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm">
          <AlertTriangle size={16} /> Valor anómalo detectado para un humano.
        </div>
      )}

      {guardado && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm">
          <CheckCircle2 size={16} /> Registro guardado y enviado a control de misión.
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => CAMPOS.forEach((c) => guardarCampo(c))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm"
        >
          <Save size={16} /> Guardar mediciones
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {CAMPOS.map((clave) => {
            const valor = signos[clave]
            const estado = valor !== undefined && valor !== null ? evaluarSignoVital(clave, valor) : null
            return estado && valor !== undefined && valor !== null ? (
              <InsigniaEstado key={clave} estado={estado} etiqueta={`${RANGOS_SIGNO_VITAL[clave].etiqueta}: ${valor}`} />
            ) : null
          })}
        </div>
      </div>

      {/* Listado de registros de signos (CRUD read/delete) */}
      {registros.filter((r) => r.tipo === 'signo').length > 0 && (
        <div className="border-t border-neutral-800 pt-3">
          <div className="text-xs font-mono text-neutral-500 mb-2">Últimas mediciones</div>
          <ul className="space-y-1">
            {registros.filter((r) => r.tipo === 'signo').slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-neutral-800/60 text-xs font-mono text-neutral-300">
                <span>{RANGOS_SIGNO_VITAL[r.signoTipo]?.etiqueta}: {r.valor}</span>
                <span className="flex items-center gap-2">
                  <span className="text-neutral-600">{new Date(r.instante).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                  <button type="button" onClick={() => alEliminar(r.id)} className="text-rose-400"><Trash2 size={13} /></button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Tarjeta>
  )
}
