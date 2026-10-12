/**
 * @fileoverview Componente VistaTripulacion
 * Apartado de gestión de tripulantes (CRUD completo de personas).
 * @module presentacion/componentes/VistaTripulacion
 */

import { useState } from 'react'
import { Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { Tarjeta } from './UtilidadesUi.jsx'
import { opcionesCondiciones } from '../../datos/mockDatos.js'
import { generarId } from '../../infraestructura/indice.js'

/** Campos base para un tripulante nuevo. */
function formularioVacio() {
  return {
    nombre: '',
    rol: '',
    edad: 35,
    sexo: 'femenino',
    pesoKg: 65,
    alturaCm: 170,
    diaMision: 1,
    mision: 'Misión Artemis',
    destino: 'Tránsito a Marte',
    condiciones: [],
    alergias: [],
    objetivoSalud: '',
  }
}

/**
 * Vista de gestión de tripulantes.
 * @param {object} props - Propiedades.
 * @param {Array<import('../../dominio/indice.js').Astronauta>} props.tripulacion - Tripulantes.
 * @param {string} props.personaId - Persona activa.
 * @param {(id: string) => void} props.alSeleccionar - Seleccionar persona.
 * @param {(persona: object) => void} props.alGuardar - Crear/actualizar.
 * @param {(id: string) => void} props.alEliminar - Eliminar.
 * @returns {import('react').JSX.Element} Vista.
 */
export default function VistaTripulacion({ tripulacion, personaId, alSeleccionar, alGuardar, alEliminar }) {
  const [editando, setEditando] = useState(null) // id de la persona en edición o 'nuevo'
  const [formulario, setFormulario] = useState(formularioVacio())

  const abrirNuevo = () => {
    setFormulario(formularioVacio())
    setEditando('nuevo')
  }

  const abrirEdicion = (persona) => {
    setFormulario({ ...persona })
    setEditando(persona.id)
  }

  const actualizar = (campo, valor) => setFormulario((a) => ({ ...a, [campo]: valor }))

  const alternarCondicion = (id) => {
    setFormulario((a) => {
      const cond = [...(a.condiciones ?? [])]
      const indice = cond.indexOf(id)
      if (indice >= 0) cond.splice(indice, 1)
      else cond.push(id)
      return { ...a, condiciones: cond }
    })
  }

  const guardar = () => {
    if (!formulario.nombre.trim()) return
    alGuardar({
      ...formulario,
      id: editando === 'nuevo' ? generarId() : editando,
      edad: Number(formulario.edad),
      pesoKg: Number(formulario.pesoKg),
      alturaCm: Number(formulario.alturaCm),
      diaMision: Number(formulario.diaMision),
    })
    setEditando(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">Tripulación</h2>
          <p className="text-neutral-400 text-sm">Gestiona los astronautas monitorizados por el sistema.</p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm"
        >
          <Plus size={16} /> Agregar tripulante
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tripulacion.map((persona) => (
          <Tarjeta
            key={persona.id}
            clase={`p-5 space-y-3 cursor-pointer transition-all ${
              personaId === persona.id ? 'border-violet-500/50 ring-1 ring-violet-500/30' : 'hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center font-semibold text-white">
                {persona.nombre.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-neutral-100">{persona.nombre}</div>
                <div className="text-xs font-mono text-neutral-500">{persona.rol}</div>
              </div>
              {personaId === persona.id && (
                <span className="text-[10px] font-mono text-violet-400 border border-violet-500/30 bg-violet-600/10 px-2 py-0.5 rounded-full">
                  Activo
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-neutral-400">
              <span>Edad: {persona.edad}</span>
              <span>IMC: {persona.imc()}</span>
              <span>Peso: {persona.pesoKg} kg</span>
              <span>Día {persona.diaMision}</span>
            </div>

            {persona.condiciones?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {persona.condiciones.map((c) => (
                  <span key={c} className="text-[10px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">
                    {opcionesCondiciones.find((o) => o.id === c)?.etiqueta ?? c}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => alSeleccionar(persona.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium"
              >
                <UserRound size={14} /> Monitorear
              </button>
              <button type="button" onClick={() => abrirEdicion(persona)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400">
                <Pencil size={14} />
              </button>
              <button type="button" onClick={() => alEliminar(persona.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 ml-auto">
                <Trash2 size={14} />
              </button>
            </div>
          </Tarjeta>
        ))}
      </div>

      {/* Modal de edición/creación */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
              <h3 className="font-semibold text-neutral-100">
                {editando === 'nuevo' ? 'Nuevo tripulante' : 'Editar tripulante'}
              </h3>
              <button type="button" onClick={() => setEditando(null)} className="p-1 rounded hover:bg-neutral-800 text-neutral-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-mono text-neutral-400">Nombre completo</label>
                <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-neutral-400">Rol</label>
                <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.rol} onChange={(e) => actualizar('rol', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-neutral-400">Edad</label>
                <input type="number" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.edad} onChange={(e) => actualizar('edad', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-neutral-400">Sexo</label>
                <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.sexo} onChange={(e) => actualizar('sexo', e.target.value)}>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-neutral-400">Peso (kg)</label>
                <input type="number" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.pesoKg} onChange={(e) => actualizar('pesoKg', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-neutral-400">Altura (cm)</label>
                <input type="number" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.alturaCm} onChange={(e) => actualizar('alturaCm', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-neutral-400">Día de misión</label>
                <input type="number" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.diaMision} onChange={(e) => actualizar('diaMision', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-mono text-neutral-400">Objetivo de salud</label>
                <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" value={formulario.objetivoSalud} onChange={(e) => actualizar('objetivoSalud', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-mono text-neutral-400">Condiciones de salud</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {opcionesCondiciones.map((c) => {
                    const activa = (formulario.condiciones ?? []).includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => alternarCondicion(c.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          activa ? 'border-violet-500 bg-violet-600/20 text-violet-300' : 'border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {c.etiqueta}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-800">
              <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm">
                Cancelar
              </button>
              <button type="button" onClick={guardar} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
