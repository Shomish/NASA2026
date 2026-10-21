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
import { calcularIMC } from '../../dominio/indice.js'

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
          <h2 className="text-2xl font-bold text-tinta">Tripulación</h2>
          <p className="text-tinta-suave text-sm">Gestiona los astronautas monitorizados por el sistema.</p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primario hover:bg-primario-fuerte text-white font-medium text-sm"
        >
          <Plus size={16} /> Agregar tripulante
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tripulacion.map((persona) => (
          <Tarjeta
            key={persona.id}
            clase={`p-5 space-y-3 cursor-pointer transition-all ${
              personaId === persona.id ? 'border-primario/50 ring-1 ring-primario/30' : 'hover:border-borde'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primario to-primario-fuerte flex items-center justify-center font-semibold text-white">
                {persona.nombre.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-tinta">{persona.nombre}</div>
                <div className="text-xs font-mono text-tinta-suave">{persona.rol}</div>
              </div>
              {personaId === persona.id && (
                <span className="text-[10px] font-mono text-primario border border-primario/30 bg-primario/10 px-2 py-0.5 rounded-full">
                  Activo
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-tinta-suave">
              <span>Edad: {persona.edad}</span>
              <span>IMC: {calcularIMC(persona.pesoKg, persona.alturaCm)}</span>
              <span>Peso: {persona.pesoKg} kg</span>
              <span>Día {persona.diaMision}</span>
            </div>

            {persona.condiciones?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {persona.condiciones.map((c) => (
                  <span key={c} className="text-[10px] font-mono text-advertencia bg-advertencia/10 border border-orange-500/20 px-1.5 py-0.5 rounded">
                    {opcionesCondiciones.find((o) => o.id === c)?.etiqueta ?? c}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-borde">
              <button
                type="button"
                onClick={() => alSeleccionar(persona.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-superficie-alta hover:bg-superficie-alta text-tinta text-xs font-medium"
              >
                <UserRound size={14} /> Monitorear
              </button>
              <button type="button" onClick={() => abrirEdicion(persona)} className="p-1.5 rounded-lg hover:bg-superficie-alta text-tinta-suave">
                <Pencil size={14} />
              </button>
              <button type="button" onClick={() => alEliminar(persona.id)} className="p-1.5 rounded-lg hover:bg-critico/10 text-critico ml-auto">
                <Trash2 size={14} />
              </button>
            </div>
          </Tarjeta>
        ))}
      </div>

      {/* Modal de edición/creación */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-superficie border border-borde rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-borde">
              <h3 className="font-semibold text-tinta">
                {editando === 'nuevo' ? 'Nuevo tripulante' : 'Editar tripulante'}
              </h3>
              <button type="button" onClick={() => setEditando(null)} className="p-1 rounded hover:bg-superficie-alta text-tinta-suave">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-mono text-tinta-suave">Nombre completo</label>
                <input className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-tinta-suave">Rol</label>
                <input className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.rol} onChange={(e) => actualizar('rol', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-tinta-suave">Edad</label>
                <input type="number" className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.edad} onChange={(e) => actualizar('edad', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-tinta-suave">Sexo</label>
                <select className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.sexo} onChange={(e) => actualizar('sexo', e.target.value)}>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-tinta-suave">Peso (kg)</label>
                <input type="number" className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.pesoKg} onChange={(e) => actualizar('pesoKg', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-tinta-suave">Altura (cm)</label>
                <input type="number" className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.alturaCm} onChange={(e) => actualizar('alturaCm', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-mono text-tinta-suave">Día de misión</label>
                <input type="number" className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.diaMision} onChange={(e) => actualizar('diaMision', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-mono text-tinta-suave">Objetivo de salud</label>
                <input className="w-full bg-superficie-alta border border-borde rounded-lg px-3 py-2 text-sm text-tinta" value={formulario.objetivoSalud} onChange={(e) => actualizar('objetivoSalud', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-mono text-tinta-suave">Condiciones de salud</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {opcionesCondiciones.map((c) => {
                    const activa = (formulario.condiciones ?? []).includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => alternarCondicion(c.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          activa ? 'border-primario bg-primario/20 text-primario' : 'border-borde text-tinta-suave'
                        }`}
                      >
                        {c.etiqueta}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-borde">
              <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 rounded-lg bg-superficie-alta text-tinta text-sm">
                Cancelar
              </button>
              <button type="button" onClick={guardar} className="px-4 py-2 rounded-lg bg-primario hover:bg-primario-fuerte text-white text-sm font-medium">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
