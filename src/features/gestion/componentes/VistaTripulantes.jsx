/**
 * @fileoverview Gestión de tripulantes (listar, crear, editar, desactivar).
 * Escritura solo administrador; el tripulante ve solo el suyo (filtra el servidor).
 * @module features/gestion/componentes/VistaTripulantes
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Users, RotateCcw } from 'lucide-react'
import { Boton, Entrada, Esqueleto, EstadoVacio, Modal, Tarjeta } from '../../../presentacion/sistema/indice.js'
import { useAlmacenSesion } from '../../auth/almacenSesion.js'
import { useTripulantes, useCrearTripulante, useEditarTripulante, useEliminarTripulante, useReactivarTripulante } from '../consultas.js'
import { listarEntornos } from '../api.js'
import { esquemaTripulante } from '../esquemas.js'
import { ConfirmarModal } from './ConfirmarModal.jsx'
import { InsigniaActivo } from './InsigniaEstado.jsx'
import { useTraduccion } from '../../../shared/idioma.js'

/** Campos del formulario de tripulante. */
const CAMPOS = [
  { nombre: 'nombre', etiqueta: 'Nombre completo', tipo: 'text', requerido: true },
  { nombre: 'cargo', etiqueta: 'Cargo', tipo: 'text' },
  { nombre: 'edad', etiqueta: 'Edad', tipo: 'number' },
  { nombre: 'peso_kg', etiqueta: 'Peso (kg)', tipo: 'number' },
  { nombre: 'altura_cm', etiqueta: 'Altura (cm)', tipo: 'number' },
  { nombre: 'dia_mision', etiqueta: 'Día de misión', tipo: 'number' },
  { nombre: 'mision', etiqueta: 'Misión', tipo: 'text' },
  { nombre: 'objetivo', etiqueta: 'Objetivo', tipo: 'text' },
  { nombre: 'alergias', etiqueta: 'Alergias (separadas por coma)', tipo: 'text' },
]

/**
 * Formulario de crear/editar tripulante (modal).
 * @param {object} props - Propiedades.
 * @param {object | null} props.tripulante - Tripulante a editar (null = crear).
 * @param {() => void} props.alCerrar - Cierra el modal.
 */
function FormularioTripulante({ tripulante, alCerrar }) {
  const crear = useCrearTripulante()
  const editar = useEditarTripulante()
  const esEdicion = Boolean(tripulante)
  const { data: entornosData } = useQuery({ queryKey: ['entornos'], queryFn: listarEntornos })
  const entornos = Array.isArray(entornosData) ? entornosData : []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaTripulante),
    defaultValues: tripulante
      ? {
          nombre: tripulante.nombre,
          cargo: tripulante.cargo ?? '',
          edad: tripulante.edad ?? undefined,
          peso_kg: tripulante.peso_kg ?? undefined,
          altura_cm: tripulante.altura_cm ?? undefined,
          dia_mision: tripulante.dia_mision ?? undefined,
          mision: tripulante.mision ?? '',
          objetivo: tripulante.objetivo ?? '',
          entorno_id: tripulante.entorno_id ?? tripulante.EntornoMision?.id ?? undefined,
          alergias: (tripulante.alergias ?? []).join(', '),
        }
      : { alergias: '' },
  })

  const enviando = crear.isPending || editar.isPending

  const alEnviar = async (datos) => {
    if (esEdicion) await editar.mutateAsync({ id: tripulante.id, datos })
    else await crear.mutateAsync(datos)
    alCerrar()
  }

  return (
    <Modal abierto alCerrar={alCerrar} titulo={esEdicion ? 'Editar tripulante' : 'Nuevo tripulante'} tituloId="tripulante-form-titulo">
      <form onSubmit={handleSubmit(alEnviar)} className="space-y-3" noValidate>
        {CAMPOS.map((campo) => (
          <div key={campo.nombre}>
            <label className="mb-1 block text-sm font-medium text-tinta" htmlFor={`tp-${campo.nombre}`}>
              {campo.etiqueta}
            </label>
            <Entrada id={`tp-${campo.nombre}`} type={campo.tipo} step="any" error={Boolean(errors[campo.nombre])} {...register(campo.nombre)} />
            {errors[campo.nombre] && <p className="mt-1 text-xs text-critico">{errors[campo.nombre].message}</p>}
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="tp-entorno_id">Entorno de misión</label>
          <select id="tp-entorno_id" className="h-10 w-full rounded-boton border border-borde bg-superficie-elevada px-3 text-sm text-tinta" {...register('entorno_id')}>
            <option value="">Sin entorno</option>
            {entornos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Boton type="button" variante="secundario" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Vista de gestión de tripulantes.
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaTripulantes() {
  const usuario = useAlmacenSesion((s) => s.usuario)
  const esAdmin = usuario?.rol === 'administrador'
  const t = useTraduccion()
  const { data, isLoading, isError } = useTripulantes()
  const eliminar = useEliminarTripulante()
  const reactivar = useReactivarTripulante()
  const tripulantes = Array.isArray(data) ? data : []

  const [formAbierto, setFormAbierto] = useState(false)
  const [enEdicion, setEnEdicion] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-tinta">Tripulantes</h1>
          <p className="text-sm text-tinta-suave">Gestión de la tripulación de la misión.</p>
        </div>
        {esAdmin && (
          <Boton variante="primario" onClick={() => { setEnEdicion(null); setFormAbierto(true) }} data-testid="nuevo-tripulante">
            <Plus size={16} /> Nuevo
          </Boton>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Esqueleto className="h-20 w-full" />
          <Esqueleto className="h-20 w-full" />
          <Esqueleto className="h-20 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <EstadoVacio icono={<Users size={22} />} titulo="No se pudieron cargar los tripulantes" descripcion="Revisa la conexión con el servidor e inténtalo de nuevo." />
      )}

      {!isLoading && !isError && tripulantes.length === 0 && (
        <EstadoVacio icono={<Users size={22} />} titulo="Sin tripulantes" descripcion="Todavía no hay tripulantes registrados." />
      )}

      {!isLoading && !isError && tripulantes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tripulantes.map((tp) => (
            <Tarjeta key={tp.id} relleno="compacto" className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-tinta">{tp.nombre}</div>
                  <div className="text-sm text-tinta-suave">{tp.cargo || 'Sin cargo'}</div>
                </div>
                <InsigniaActivo activo={tp.activo !== false} />
              </div>
              {(tp.mision || tp.dia_mision) && (
                <div className="text-xs text-tinta-suave">
                  {tp.mision}{tp.dia_mision ? ` · Día ${tp.dia_mision}` : ''}
                </div>
              )}
              {esAdmin && (
                <div className="flex gap-2 pt-1">
                  <Boton variante="secundario" tamaño="sm" onClick={() => { setEnEdicion(tp); setFormAbierto(true) }}>
                    <Pencil size={14} /> Editar
                  </Boton>
                  {tp.activo !== false ? (
                    <Boton variante="peligro" tamaño="sm" onClick={() => setAEliminar(tp)}>
                      <Trash2 size={14} /> Eliminar
                    </Boton>
                  ) : (
                    <Boton variante="exito" tamaño="sm" onClick={() => reactivar.mutate(tp.id)}>
                      <RotateCcw size={14} /> {t('comun.activar')}
                    </Boton>
                  )}
                </div>
              )}
            </Tarjeta>
          ))}
        </div>
      )}

      {formAbierto && <FormularioTripulante tripulante={enEdicion} alCerrar={() => setFormAbierto(false)} />}

      <ConfirmarModal
        abierto={Boolean(aEliminar)}
        alCancelar={() => setAEliminar(null)}
        alConfirmar={async () => { await eliminar.mutateAsync(aEliminar.id); setAEliminar(null) }}
        titulo="Desactivar tripulante"
        mensaje={`Se desactivará a ${aEliminar?.nombre}. Sus datos se conservan, pero no podrá registrar nuevas mediciones.`}
        confirmando={eliminar.isPending}
      />
    </div>
  )
}
