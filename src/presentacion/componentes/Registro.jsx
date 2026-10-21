/**
 * @fileoverview Componentes de registro: Historial, Notas, Alertas y Calendario.
 * @module presentacion/componentes/Registro
 */

import { useState } from 'react'
import { Trash2, Pencil, CalendarDays, NotebookPen, Bell, Plus } from 'lucide-react'
import { Tarjeta, EncabezadoPanel, InsigniaEstado } from './UtilidadesUi.jsx'
import { RANGOS_SIGNO_VITAL } from '../../dominio/indice.js'

/** Etiquetas y color por tipo de registro. */
const INFO_TIPO = {
  signo: { etiqueta: 'Signos vitales', color: '#14b8a6' },
  sueno: { etiqueta: 'Sueño', color: '#60a5fa' },
  mental: { etiqueta: 'Salud mental', color: '#a78bfa' },
  radiacion: { etiqueta: 'Radiación', color: '#fbbf24' },
}

/**
 * Describe un registro para mostrarlo en tablas.
 * @param {object} registro - Registro.
 * @returns {string} Descripción.
 */
export function describirRegistro(registro) {
  switch (registro.tipo) {
    case 'signo':
      return `${RANGOS_SIGNO_VITAL[registro.signoTipo]?.etiqueta ?? registro.signoTipo}: ${registro.valor}`
    case 'sueno':
      return `${registro.horas}h · calidad ${registro.calidad}/10`
    case 'mental':
      return `${registro.cuestionario.toUpperCase()}: ${registro.puntaje} pts`
    case 'radiacion':
      return `+${registro.dosis} mSv`
    default:
      return ''
  }
}

/**
 * Panel de historial unificado (CRUD).
 */
export function PanelHistorial({ registros = [], alEliminar }) {
  const [filtro, setFiltro] = useState('todos')
  const filtrados = registros
    .filter((r) => filtro === 'todos' || r.tipo === filtro)
    .sort((a, b) => new Date(b.instante) - new Date(a.instante))

  return (
    <Tarjeta clase="p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EncabezadoPanel icono={<Pencil size={18} />} titulo="Historial de Registros" subtitulo="CRUD completo por persona" />
        <div className="flex gap-1">
          {['todos', 'signo', 'sueno', 'mental', 'radiacion'].map((f) => (
            <button key={f} type="button" onClick={() => setFiltro(f)} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${filtro === f ? 'bg-primario text-white' : 'bg-superficie-alta text-tinta-suave'}`}>
              {f === 'todos' ? 'Todos' : INFO_TIPO[f]?.etiqueta ?? f}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-tinta-suave">Sin registros en esta categoría.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-tinta-suave font-mono text-xs border-b border-borde">
                <th className="py-2 pr-3 font-normal">Fecha</th>
                <th className="py-2 pr-3 font-normal">Tipo</th>
                <th className="py-2 pr-3 font-normal">Detalle</th>
                <th className="py-2 font-normal text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => {
                const info = INFO_TIPO[r.tipo]
                return (
                  <tr key={r.id} className="border-b border-borde/60 hover:bg-superficie-alta/40">
                    <td className="py-2 pr-3 font-mono text-xs text-tinta-suave">{new Date(r.instante).toLocaleDateString('es-PE')}</td>
                    <td className="py-2 pr-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ color: info?.color, backgroundColor: `${info?.color}1A` }}>
                        {info?.etiqueta}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-tinta">{describirRegistro(r)}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => alEliminar(r.id)} className="text-critico hover:text-critico"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Tarjeta>
  )
}

/**
 * Panel de notas (diario) con CRUD.
 */
export function PanelNotas({ notas = [], alAgregar, alEliminar }) {
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')

  const guardar = () => {
    if (!titulo.trim()) return
    alAgregar({ tipo: 'nota', titulo: titulo.trim(), contenido: contenido.trim() })
    setTitulo('')
    setContenido('')
  }

  return (
    <Tarjeta clase="p-5 space-y-3">
      <EncabezadoPanel icono={<NotebookPen size={18} />} titulo="Diario de Salud" subtitulo="Notas del astronauta" />

      <div className="space-y-2">
        <input className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <textarea className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm resize-none" rows="2" placeholder="Síntomas, estado de ánimo..." value={contenido} onChange={(e) => setContenido(e.target.value)} />
        <button type="button" onClick={guardar} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primario hover:bg-primario-fuerte text-white text-sm">
          <Plus size={14} /> Guardar nota
        </button>
      </div>

      {notas.length > 0 && (
        <ul className="space-y-2">
          {notas.map((n) => (
            <li key={n.id} className="p-3 rounded-lg bg-superficie-alta/60">
              <div className="flex items-center justify-between">
                <span className="font-medium text-tinta text-sm">{n.titulo}</span>
                <button type="button" onClick={() => alEliminar(n.id)} className="text-critico"><Trash2 size={13} /></button>
              </div>
              {n.contenido && <p className="mt-1 text-xs text-tinta-suave">{n.contenido}</p>}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}

/**
 * Panel de alertas (bandeja).
 */
export function PanelAlertas({ alertas = [], alMarcarLeida, alEliminar }) {
  const noLeidas = alertas.filter((a) => !a.leida).length

  return (
    <Tarjeta clase="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <EncabezadoPanel icono={<Bell size={18} />} titulo="Alertas" subtitulo="Bandeja de alertas de salud" />
        {noLeidas > 0 && <span className="px-2 py-0.5 rounded-full bg-critico/20 text-critico text-xs font-mono">{noLeidas} sin leer</span>}
      </div>

      {alertas.length === 0 ? (
        <p className="text-sm text-tinta-suave">Sin alertas.</p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a) => (
            <li key={a.id} className={`p-3 rounded-lg border ${a.leida ? 'border-borde opacity-60' : 'border-rose-500/30'}`}>
              <div className="flex items-start gap-2">
                <InsigniaEstado estado={a.severidad} />
                <p className="flex-1 text-sm text-tinta">{a.mensaje}</p>
                <div className="flex gap-1">
                  {!a.leida && <button type="button" onClick={() => alMarcarLeida(a.id)} className="text-xs text-tinta-suave hover:text-tinta">leída</button>}
                  <button type="button" onClick={() => alEliminar(a.id)} className="text-critico"><Trash2 size={13} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}

/**
 * Calendario funcional: registros de salud por fecha.
 */
export function Calendario({ registros = [] }) {
  const hoy = new Date()
  const dias = Array.from({ length: 30 }, (_, i) => {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() - i)
    return fecha
  })

  const contarPorFecha = (fecha) => {
    const clave = fecha.toISOString().slice(0, 10)
    return registros.filter((r) => r.instante.slice(0, 10) === clave).length
  }

  const [seleccion, setSeleccion] = useState(hoy.toISOString().slice(0, 10))
  const registrosDia = registros.filter((r) => r.instante.slice(0, 10) === seleccion)

  return (
    <Tarjeta clase="p-5 space-y-3">
      <EncabezadoPanel icono={<CalendarDays size={18} />} titulo="Calendario de Salud" subtitulo="Últimos 30 días de misión" />

      <div className="grid grid-cols-7 gap-1">
        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
          <span key={d} className="text-center text-[10px] font-mono text-tinta-suave">{d}</span>
        ))}
        {dias.map((fecha) => {
          const clave = fecha.toISOString().slice(0, 10)
          const cantidad = contarPorFecha(fecha)
          return (
            <button
              key={clave}
              type="button"
              onClick={() => setSeleccion(clave)}
              className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                seleccion === clave ? 'bg-primario text-white' : 'bg-superficie-alta/60 hover:bg-superficie-alta text-tinta'
              }`}
            >
              <span>{fecha.getDate()}</span>
              {cantidad > 0 && <span className={`w-1.5 h-1.5 rounded-full ${seleccion === clave ? 'bg-white' : 'bg-exito'}`} />}
            </button>
          )
        })}
      </div>

      <div className="border-t border-borde pt-2">
        <div className="text-xs font-mono text-tinta-suave mb-1">Registros del {seleccion}:</div>
        {registrosDia.length === 0 ? (
          <p className="text-xs text-tinta-suave">Sin registros.</p>
        ) : (
          <ul className="space-y-1">
            {registrosDia.map((r) => (
              <li key={r.id} className="text-xs font-mono text-tinta">
                {new Date(r.instante).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} · {describirRegistro(r)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Tarjeta>
  )
}
