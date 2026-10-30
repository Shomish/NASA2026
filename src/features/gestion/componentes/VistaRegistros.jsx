/**
 * @fileoverview Flujo de registros: crear, listar con filtros y paginación,
 * validar, cerrar, borrar con confirmación y deshacer (restaurar).
 * Cada estado se muestra con insignia de icono + texto.
 * @module features/gestion/componentes/VistaRegistros
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, ClipboardList, FilePlus2, Lock, RotateCcw, Trash2, Download } from 'lucide-react'
import { Boton, Entrada, Esqueleto, EstadoVacio, Modal, Tarjeta, toast } from '../../../presentacion/sistema/indice.js'
import { useAlmacenSesion } from '../../auth/almacenSesion.js'
import {
  useTripulantes,
  useRegistros,
  useCrearRegistro,
  useValidarRegistro,
  useCerrarRegistro,
  useEliminarRegistro,
  useRestaurarRegistro,
} from '../consultas.js'
import { esquemaRegistroForm, detalleDesdeFormulario, TIPOS_REGISTRO, PREGUNTAS_PHQ9 } from '../esquemas.js'
import { useContextoTripulante } from '../useContextoTripulante.js'
import { encolar } from '../outbox.js'
import { aCsv, descargarCsv } from '../exportacion.js'
import { ConfirmarModal } from './ConfirmarModal.jsx'
import { InsigniaEstado } from './InsigniaEstado.jsx'

/** Etiquetas legibles de tipo. */
const ETIQUETA_TIPO = { signos_vitales: 'Signos vitales', sueno: 'Sueño', salud_mental: 'Salud mental', radiacion: 'Radiación', diario: 'Diario' }

/**
 * Formulario de creación de registro (modal).
 * @param {object} props - Propiedades.
 * @param {() => void} props.alCerrar - Cierra el modal.
 * @param {(registro: object) => void} props.alCreado - Callback con el registro creado.
 */
function FormularioRegistro({ alCerrar, alCreado }) {
  const crear = useCrearRegistro()
  const { esTripulante, tripulantes, tripulanteActivo } = useContextoTripulante()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaRegistroForm),
    defaultValues: { tipo: 'signos_vitales', tripulante_id: tripulanteActivo ? String(tripulanteActivo.id) : '' },
  })

  const tipo = watch('tipo')
  const tripulanteIdSel = watch('tripulante_id')
  const tripulanteSel = tripulantes.find((t) => String(t.id) === String(tripulanteIdSel)) ?? tripulanteActivo
  const primerNombre = tripulanteSel?.nombre?.split(' ')[0] ?? ''

  const alEnviar = async (datos) => {
    const detalle = detalleDesdeFormulario(datos)
    const cuerpo = { tripulante_id: Number(datos.tripulante_id), tipo: datos.tipo, detalle }

    // Sin conexión: encola en la cola outbox (se sincronizará al reconectar).
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await encolar('crear_registro', cuerpo)
      toast.info('Sin conexión: guardado en la cola. Se sincronizará al reconectar.')
      alCerrar()
      return
    }

    const registro = await crear.mutateAsync(cuerpo)
    alCreado(registro, tripulanteSel)
    alCerrar()
  }

  return (
    <Modal abierto alCerrar={alCerrar} titulo="Nuevo registro" tituloId="registro-form-titulo">
      <form onSubmit={handleSubmit(alEnviar)} className="space-y-3" noValidate>
        <div>
          {esTripulante ? (
            <div className="rounded-tarjeta border border-borde bg-superficie-alta px-3 py-2 text-sm text-tinta">
              Registrando para: <span className="font-semibold">{tripulanteActivo?.nombre}</span>
              {tripulanteActivo?.cargo ? ` (${tripulanteActivo.cargo})` : ''}
            </div>
          ) : (
            <>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-tripulante">Registrando para</label>
              <select id="r-tripulante" className="h-10 w-full rounded-boton border border-borde bg-superficie-elevada px-3 text-sm text-tinta" {...register('tripulante_id')}>
                <option value="">Elige un tripulante…</option>
                {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              {errors.tripulante_id && <p className="mt-1 text-xs text-critico">{errors.tripulante_id.message}</p>}
            </>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-tipo">Tipo</label>
          <select id="r-tipo" className="h-10 w-full rounded-boton border border-borde bg-superficie-elevada px-3 text-sm text-tinta" {...register('tipo')}>
            {TIPOS_REGISTRO.map((t) => <option key={t.id} value={t.id}>{t.etiqueta}</option>)}
          </select>
        </div>

        {tipo === 'signos_vitales' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['frecuencia_cardiaca', 'FC (lpm)'],
              ['spo2', 'SpO₂ (%)'],
              ['temperatura_c', 'Temp (°C)'],
              ['presion_sistolica', 'Sistólica'],
              ['presion_diastolica', 'Diastólica'],
            ].map(([nombre, etiqueta]) => (
              <div key={nombre}>
                <label className="mb-1 block text-sm font-medium text-tinta" htmlFor={`r-${nombre}`}>{etiqueta}</label>
                <Entrada id={`r-${nombre}`} type="number" step="any" error={Boolean(errors[nombre])} {...register(nombre)} />
              </div>
            ))}
          </div>
        )}

        {tipo === 'sueno' && (
          <div className="grid grid-cols-3 gap-3">
            {[['horas', 'Horas'], ['calidad', 'Calidad (0-10)'], ['despertares', 'Despertares']].map(([nombre, etiqueta]) => (
              <div key={nombre}>
                <label className="mb-1 block text-sm font-medium text-tinta" htmlFor={`r-${nombre}`}>{etiqueta}</label>
                <Entrada id={`r-${nombre}`} type="number" step="any" error={Boolean(errors[nombre])} {...register(nombre)} />
                {errors[nombre] && <p className="mt-1 text-xs text-critico">{errors[nombre].message}</p>}
              </div>
            ))}
          </div>
        )}

        {tipo === 'glucosa' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-glucosa_mgdl">Glucosa (mg/dL)</label>
              <Entrada id="r-glucosa_mgdl" type="number" inputMode="decimal" error={Boolean(errors.glucosa_mgdl)} {...register('glucosa_mgdl')} />
              {errors.glucosa_mgdl && <p className="mt-1 text-xs text-critico">{errors.glucosa_mgdl.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-tinta">
              <input type="checkbox" className="h-4 w-4 rounded border-borde" {...register('ayunas')} /> En ayunas
            </label>
          </div>
        )}

        {tipo === 'animo' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-escala_animo">Ánimo (1-10)</label>
              <Entrada id="r-escala_animo" type="number" min={1} max={10} error={Boolean(errors.escala_animo)} {...register('escala_animo')} />
              {errors.escala_animo && <p className="mt-1 text-xs text-critico">{errors.escala_animo.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-notas_animo">Notas</label>
              <Entrada id="r-notas_animo" {...register('notas_animo')} />
            </div>
          </div>
        )}

        {tipo === 'ejercicio' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-ejercicio_tipo">Tipo</label>
              <select id="r-ejercicio_tipo" className="h-10 w-full rounded-boton border border-borde bg-superficie-elevada px-3 text-sm text-tinta" {...register('ejercicio_tipo')}>
                <option value="resistencia">Resistencia</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-minutos">Minutos</label>
              <Entrada id="r-minutos" type="number" inputMode="numeric" error={Boolean(errors.minutos)} {...register('minutos')} />
              {errors.minutos && <p className="mt-1 text-xs text-critico">{errors.minutos.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-tinta">
              <input type="checkbox" className="h-4 w-4 rounded border-borde" {...register('cumplio_plan')} /> Cumplió plan
            </label>
          </div>
        )}

        {tipo === 'sintomas_inmunes' && (
          <div className="grid grid-cols-2 gap-3">
            {[['fiebre', 'Fiebre'], ['fatiga_inusual', 'Fatiga inusual'], ['infecciones', 'Infecciones'], ['lesiones_cutaneas', 'Lesiones cutáneas'], ['cicatrizacion_lenta', 'Cicatrización lenta']].map(([nombre, etiqueta]) => (
              <div key={nombre}>
                <label className="mb-1 block text-sm font-medium text-tinta" htmlFor={`r-${nombre}`}>{etiqueta} (0-3)</label>
                <select id={`r-${nombre}`} className="h-10 w-full rounded-boton border border-borde bg-superficie-elevada px-3 text-sm text-tinta" {...register(nombre)}>
                  {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {tipo === 'estado_conductual' && (
          <div className="grid grid-cols-3 gap-3">
            {[['gad7', 'GAD-7 (0-21)'], ['estres', 'Estrés (0-10)'], ['fatiga', 'Fatiga (0-10)']].map(([nombre, etiqueta]) => (
              <div key={nombre}>
                <label className="mb-1 block text-sm font-medium text-tinta" htmlFor={`r-${nombre}`}>{etiqueta}</label>
                <Entrada id={`r-${nombre}`} type="number" min={0} error={Boolean(errors[nombre])} {...register(nombre)} />
              </div>
            ))}
          </div>
        )}

        {tipo === 'ambiente' && (
          <div className="grid grid-cols-2 gap-3">
            {[['co2_ppm', 'CO₂ (ppm)'], ['temperatura_c', 'Temp (°C)'], ['humedad', 'Humedad (%)'], ['ruido_db', 'Ruido (dB)']].map(([nombre, etiqueta]) => (
              <div key={nombre}>
                <label className="mb-1 block text-sm font-medium text-tinta" htmlFor={`r-${nombre}`}>{etiqueta}</label>
                <Entrada id={`r-${nombre}`} type="number" step="any" error={Boolean(errors[nombre])} {...register(nombre)} />
              </div>
            ))}
          </div>
        )}

        {tipo === 'salud_mental' && (
          <div className="space-y-2">
            <p className="text-xs text-tinta-suave">En las últimas dos semanas, ¿con qué frecuencia te ha molestado…? (0 = nunca, 3 = casi todos los días)</p>
            {PREGUNTAS_PHQ9.map((pregunta, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 w-6 shrink-0 font-mono text-xs text-tinta-suave">{i + 1}.</span>
                <div className="flex-1">
                  <p className={`text-sm ${i === 8 ? 'font-semibold text-critico' : 'text-tinta'}`}>{pregunta}</p>
                  <select className="h-9 w-full rounded-boton border border-borde bg-superficie-elevada px-2 text-sm text-tinta" {...register(`phq9_${i}`)}>
                    {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <p className="rounded-tarjeta border border-advertencia/40 bg-advertencia/10 px-3 py-2 text-xs text-tinta">
              Si la pregunta 9 es distinta de &quot;nunca&quot;, se activará automáticamente un aviso de apoyo y una alerta.
            </p>
          </div>
        )}

        {tipo === 'diario' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-titulo">Título</label>
              <Entrada id="r-titulo" error={Boolean(errors.titulo)} {...register('titulo')} />
              {errors.titulo && <p className="mt-1 text-xs text-critico">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="r-contenido">Contenido</label>
              <textarea id="r-contenido" rows={3} className="w-full rounded-boton border border-borde bg-superficie-elevada px-3 py-2 text-sm text-tinta" {...register('contenido')} />
              {errors.contenido && <p className="mt-1 text-xs text-critico">{errors.contenido.message}</p>}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Boton type="button" variante="secundario" onClick={alCerrar} disabled={crear.isPending}>Cancelar</Boton>
          <Boton type="submit" disabled={crear.isPending}>{crear.isPending ? 'Guardando…' : primerNombre ? `Guardar para ${primerNombre}` : 'Guardar'}</Boton>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Vista del flujo de registros.
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaRegistros() {
  const usuario = useAlmacenSesion((s) => s.usuario)
  const esMedicoOAdmin = usuario?.rol === 'medico' || usuario?.rol === 'administrador'
  const { data: tripulantesData } = useTripulantes()
  const tripulantes = Array.isArray(tripulantesData) ? tripulantesData : []
  const nombreTripulante = (id) => tripulantes.find((t) => t.id === id)?.nombre ?? `#${id}`

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [incluirEliminados, setIncluirEliminados] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  const { data, isLoading, isError } = useRegistros({
    estado: filtroEstado,
    tipo: filtroTipo,
    q: busqueda,
    desde,
    hasta,
    incluir_eliminados: incluirEliminados ? 'true' : '',
    pagina,
    por_pagina: 10,
  })

  const validar = useValidarRegistro()
  const cerrar = useCerrarRegistro()
  const eliminar = useEliminarRegistro()
  const restaurar = useRestaurarRegistro()

  const [formAbierto, setFormAbierto] = useState(false)
  const [ultimoCreado, setUltimoCreado] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)

  const registros = data?.datos ?? []
  const total = data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / (data?.por_pagina ?? 10)))

  const cambiarPagina = (n) => setPagina((p) => Math.min(Math.max(1, p + n), totalPaginas))

  const exportarCsvRegistros = () => {
    const fecha = new Date().toLocaleDateString('es-PE').split('/').join('-')
    const filas = registros.map((r) => ({
      codigo: r.codigo,
      tipo: r.tipo,
      estado: r.estado,
      tripulante: nombreTripulante(r.tripulante_id),
      fecha: new Date(r.fecha_registro).toLocaleString('es-PE', { hour12: false }),
    }))
    descargarCsv(aCsv(filas, ['codigo', 'tipo', 'estado', 'tripulante', 'fecha']), `registros-${fecha}.csv`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-tinta">Registros</h1>
          <p className="text-sm text-tinta-suave">Solicitudes de salud: pendiente → validado → cerrado.</p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="secundario" onClick={exportarCsvRegistros} disabled={registros.length === 0}>
            <Download size={16} /> Exportar CSV
          </Boton>
          <Boton variante="primario" onClick={() => setFormAbierto(true)} data-testid="nuevo-registro">
            <FilePlus2 size={16} /> Nuevo registro
          </Boton>
        </div>
      </div>

      {ultimoCreado && (
        <div className="flex items-center justify-between gap-3 rounded-tarjeta border border-exito/40 bg-exito/10 px-4 py-3">
          <div className="text-sm text-tinta">
            Registro creado: <span className="font-mono font-semibold text-exito" data-testid="ultimo-codigo">{ultimoCreado.codigo}</span>
            <span className="ml-2 inline-flex align-middle"><InsigniaEstado estado={ultimoCreado.estado} /></span>
          </div>
          <button type="button" className="text-xs text-tinta-suave hover:text-tinta" onClick={() => setUltimoCreado(null)}>Ocultar</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta"
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1) }}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="validado">Validado</option>
          <option value="cerrado">Cerrado</option>
        </select>
        <select
          className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta"
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1) }}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(ETIQUETA_TIPO).map(([id, etiqueta]) => <option key={id} value={id}>{etiqueta}</option>)}
        </select>
        <input
          type="search"
          className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta"
          placeholder="Buscar código…"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
          aria-label="Buscar por código"
        />
        <input type="date" className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta" value={desde} onChange={(e) => { setDesde(e.target.value); setPagina(1) }} aria-label="Desde" />
        <input type="date" className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta" value={hasta} onChange={(e) => { setHasta(e.target.value); setPagina(1) }} aria-label="Hasta" />
        <label className="flex items-center gap-2 text-sm text-tinta-suave">
          <input type="checkbox" className="h-4 w-4 rounded border-borde" checked={incluirEliminados} onChange={(e) => { setIncluirEliminados(e.target.checked); setPagina(1) }} />
          Mostrar eliminados
        </label>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Esqueleto className="h-16 w-full" />
          <Esqueleto className="h-16 w-full" />
          <Esqueleto className="h-16 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <EstadoVacio icono={<ClipboardList size={22} />} titulo="No se pudieron cargar los registros" descripcion="Revisa la conexión con el servidor." />
      )}

      {!isLoading && !isError && registros.length === 0 && (
        <EstadoVacio icono={<ClipboardList size={22} />} titulo="Sin registros" descripcion="Crea un registro para empezar a monitorear la salud de la tripulación." />
      )}

      {!isLoading && !isError && registros.length > 0 && (
        <div className="space-y-2">
          {registros.map((r) => {
            const eliminado = Boolean(r.eliminado_en)
            return (
              <Tarjeta key={r.id} relleno="compacto" className={eliminado ? 'opacity-60' : ''}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm font-semibold text-tinta">{r.codigo}</div>
                    <InsigniaEstado estado={r.estado} />
                    {eliminado && <span className="text-xs text-critico">Eliminado</span>}
                  </div>
                  <div className="text-xs text-tinta-suave">
                    {ETIQUETA_TIPO[r.tipo] ?? r.tipo} · {nombreTripulante(r.tripulante_id)} · {new Date(r.fecha_registro).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {eliminado ? (
                    <Boton variante="secundario" tamaño="sm" onClick={() => restaurar.mutate(r.id)}>
                      <RotateCcw size={14} /> Deshacer
                    </Boton>
                  ) : (
                    <>
                      {esMedicoOAdmin && r.estado === 'pendiente' && (
                        <Boton variante="exito" tamaño="sm" onClick={() => validar.mutate(r.id)}>
                          <CheckCircle2 size={14} /> Validar
                        </Boton>
                      )}
                      {esMedicoOAdmin && r.estado === 'validado' && (
                        <Boton variante="secundario" tamaño="sm" onClick={() => cerrar.mutate(r.id)}>
                          <Lock size={14} /> Cerrar
                        </Boton>
                      )}
                      <Boton variante="peligro" tamaño="sm" onClick={() => setAEliminar(r)}>
                        <Trash2 size={14} /> Eliminar
                      </Boton>
                    </>
                  )}
                </div>
              </Tarjeta>
            )
          })}
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between text-sm text-tinta-suave">
          <span>Página {data?.pagina ?? 1} de {totalPaginas} · {total} registros</span>
          <div className="flex gap-2">
            <Boton variante="secundario" tamaño="sm" onClick={() => cambiarPagina(-1)} disabled={pagina <= 1}>Anterior</Boton>
            <Boton variante="secundario" tamaño="sm" onClick={() => cambiarPagina(1)} disabled={pagina >= totalPaginas}>Siguiente</Boton>
          </div>
        </div>
      )}

      {formAbierto && <FormularioRegistro alCerrar={() => setFormAbierto(false)} alCreado={(r, t) => { setUltimoCreado(r); toast.success(t?.nombre ? `Medición guardada para ${t.nombre}` : 'Registro creado', { description: `Código ${r.codigo}` }) }} />}

      <ConfirmarModal
        abierto={Boolean(aEliminar)}
        alCancelar={() => setAEliminar(null)}
        alConfirmar={async () => { await eliminar.mutateAsync(aEliminar.id); setAEliminar(null) }}
        titulo="Eliminar registro"
        mensaje={`Se eliminará el registro ${aEliminar?.codigo}. Podrás deshacerlo desde "Mostrar eliminados".`}
        confirmando={eliminar.isPending}
      />
    </div>
  )
}
