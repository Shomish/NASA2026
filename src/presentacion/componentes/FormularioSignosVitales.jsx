/**
 * @fileoverview Componente FormularioSignosVitales
 * CRUD manual de signos vitales con validación visual, guía de medición y listado.
 * @module presentacion/componentes/FormularioSignosVitales
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Stethoscope, Save, Trash2, HelpCircle } from 'lucide-react'
import { Tarjeta, EncabezadoPanel, InsigniaEstado } from './UtilidadesUi.jsx'
import { RANGOS_SIGNO_VITAL, evaluarSignoVital } from '../../dominio/indice.js'
import { listarCatalogo } from '../../features/gestion/api.js'

/** Campos de entrada. */
const CAMPOS = ['sistolica', 'diastolica', 'saturacion_oxigeno', 'frecuencia_cardiaca', 'masa_corporal', 'temperatura']

/** Nombre del indicador en el catálogo científico. */
const CATALOGO_POR_CAMPO = {
  sistolica: 'Presión arterial',
  diastolica: 'Presión arterial',
  saturacion_oxigeno: 'Saturación de oxígeno',
  frecuencia_cardiaca: 'Frecuencia cardíaca',
  temperatura: 'Temperatura corporal',
  masa_corporal: 'Masa corporal',
}

/** Fuente de la instrucción de medición (no del umbral). */
const FUENTE_MEDICION = {
  sistolica: 'Criterio del equipo',
  diastolica: 'Criterio del equipo',
  saturacion_oxigeno: 'WHO (2016)',
  frecuencia_cardiaca: 'American Heart Association (AHA)',
  temperatura: 'Criterio del equipo',
  masa_corporal: 'Criterio del equipo',
}

/** Texto de respaldo si el catálogo no está disponible. */
const GUIA_FALLBACK = {
  sistolica: 'Con un tensiómetro, en reposo, sentado y con el brazo a la altura del corazón.',
  diastolica: 'Con un tensiómetro, en reposo, sentado y con el brazo a la altura del corazón.',
  saturacion_oxigeno: 'Con un pulsioxímetro en el dedo, en reposo y sin moverse durante un minuto.',
  frecuencia_cardiaca: 'Con un pulsómetro de muñeca o monitor de pecho, en reposo. También puedes contar el pulso radial durante 60 segundos.',
  temperatura: 'Con un termómetro digital, en reposo. Usa la vía indicada por el fabricante.',
  masa_corporal: 'Con una báscula, sin ropa pesada y a la misma hora del día.',
}

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
  const [ayuda, setAyuda] = useState(null)
  const { data: catalogo } = useQuery({ queryKey: ['catalogo'], queryFn: listarCatalogo, staleTime: 60000 })

  const guia = (clave) => {
    const nombre = CATALOGO_POR_CAMPO[clave]
    const item = Array.isArray(catalogo)
      ? catalogo.find((i) => i.nombre === nombre || i.nombre?.startsWith(nombre))
      : null
    return {
      texto: item?.como_medir || GUIA_FALLBACK[clave],
      fuente: FUENTE_MEDICION[clave],
    }
  }

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
    return 'border-borde focus:border-primario'
  }

  return (
    <Tarjeta clase="p-5 space-y-4">
      <EncabezadoPanel icono={<Stethoscope size={18} />} titulo="Signos Vitales" subtitulo="CRUD manual · validación inmediata" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CAMPOS.map((clave) => {
          const rango = RANGOS_SIGNO_VITAL[clave]
          return (
            <div key={clave} className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-mono text-tinta-suave">
                <span>{rango.etiqueta}</span>
                <span className="text-tinta-suave">{rango.unidad}</span>
              </label>
              <input
                type="number"
                className={`w-full bg-superficie border rounded-lg px-3 py-2 font-mono text-lg text-tinta outline-none transition-colors ${estiloBorde(clave)}`}
                placeholder={signos[clave] ?? '—'}
                value={valores[clave] ?? ''}
                onChange={(e) => actualizar(clave, e.target.value)}
                aria-label={`${rango.etiqueta} en ${rango.unidad}`}
              />
              {alertas[clave] && (
                <span className={`flex items-center gap-1 text-[10px] font-mono ${alertas[clave] === 'critico' ? 'text-critico' : 'text-advertencia'}`}>
                  <AlertTriangle size={11} /> {alertas[clave] === 'critico' ? 'Crítico' : 'Atención'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setAyuda(ayuda === clave ? null : clave)}
                className="inline-flex items-center gap-1 text-[10px] text-primario hover:underline"
                aria-expanded={ayuda === clave}
              >
                <HelpCircle size={11} /> ¿Cómo medir?
              </button>
              {ayuda === clave && (
                <div className="rounded-lg border border-borde bg-superficie-alta/70 p-2 text-[10px] leading-relaxed text-tinta-suave">
                  <p>{guia(clave).texto}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-tinta-suave">Fuente: {guia(clave).fuente}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {Object.values(alertas).some((a) => a === 'critico') && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/40 bg-critico/10 text-critico text-sm">
          <AlertTriangle size={16} /> Valor fuera de rango. Revisa la medición y avisa al oficial médico si persiste.
        </div>
      )}

      {guardado && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/40 bg-exito/10 text-exito text-sm">
          <CheckCircle2 size={16} /> Registro guardado.
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => CAMPOS.forEach((c) => guardarCampo(c))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primario hover:bg-primario-fuerte text-white font-medium text-sm"
        >
          <Save size={16} /> Guardar mediciones
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {CAMPOS.map((clave) => {
            const valor = signos[clave]
            const estado = valor !== undefined && valor !== null ? evaluarSignoVital(clave, valor) : null
            return estado && estado !== 'sin-rango' && valor !== undefined && valor !== null ? (
              <InsigniaEstado key={clave} estado={estado} etiqueta={`${RANGOS_SIGNO_VITAL[clave].etiqueta}: ${valor}`} />
            ) : null
          })}
        </div>
      </div>

      {/* Listado de registros de signos (CRUD read/delete) */}
      {registros.filter((r) => r.tipo === 'signo').length > 0 && (
        <div className="border-t border-borde pt-3">
          <div className="text-xs font-mono text-tinta-suave mb-2">Últimas mediciones</div>
          <ul className="space-y-1">
            {registros.filter((r) => r.tipo === 'signo').slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-superficie-alta/60 text-xs font-mono text-tinta">
                <span>{RANGOS_SIGNO_VITAL[r.signoTipo]?.etiqueta}: {r.valor}</span>
                <span className="flex items-center gap-2">
                  <span className="text-tinta-suave">{new Date(r.instante).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                  <button type="button" onClick={() => alEliminar(r.id)} className="text-critico"><Trash2 size={13} /></button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Tarjeta>
  )
}
