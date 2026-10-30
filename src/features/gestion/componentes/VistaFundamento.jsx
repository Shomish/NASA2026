/**
 * @fileoverview Página "Cómo funciona" y fundamento científico.
 * Explica en lenguaje simple (para astronautas sin formación médica) los cinco
 * peligros de la NASA, los problemas de salud asociados y la guía de indicadores.
 * @module features/gestion/componentes/VistaFundamento
 */

import { useQuery } from '@tanstack/react-query'
import { BookOpen, Radiation, DoorClosed, Globe, Weight, Home, ShieldCheck } from 'lucide-react'
import { Esqueleto, EstadoVacio, Tarjeta } from '../../../presentacion/sistema/indice.js'
import { listarCatalogo } from '../api.js'

/** Cinco peligros de la NASA (Human Research Program). */
const PELIGROS = [
  { nombre: 'Radiación espacial', icono: Radiation, descripcion: 'Partículas energéticas que atraviesan la nave y pueden dañar células.' },
  { nombre: 'Aislamiento y confinamiento', icono: DoorClosed, descripcion: 'Vivir en un espacio pequeño, lejos de familia y amigos, afecta la mente.' },
  { nombre: 'Distancia de la Tierra', icono: Globe, descripcion: 'La comunicación con la Tierra se retrasa y la ayuda está lejos.' },
  { nombre: 'Campos gravitatorios', icono: Weight, descripcion: 'La microgravedad debilita huesos y músculos y cambia la circulación.' },
  { nombre: 'Entorno cerrado hostil', icono: Home, descripcion: 'Aire, temperatura y humedad controlados; cualquier fallo es un riesgo.' },
]

/** Problemas de salud asociados. */
const PROBLEMAS = [
  'Cambios en el sistema inmunológico',
  'Pérdida de densidad ósea',
  'Eventos cardiovasculares',
  'Nutrición inadecuada',
  'Salud conductual (ánimo y estrés)',
]

/** Pasos simples de uso del sistema. */
const PASOS = [
  'Elige tu tripulante (arriba aparece "Registrando para").',
  'Registra tus mediciones diarias en cada formulario.',
  'El sistema compara tus valores con los rangos de referencia.',
  'Si algo está fuera de rango, verás un color de alerta y una recomendación.',
  'Avisa al oficial médico o a control de misión cuando el sistema te lo indique.',
]

/**
 * Vista "Cómo funciona" y fundamento científico.
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaFundamento() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['catalogo'], queryFn: listarCatalogo })
  const indicadores = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-tinta">Cómo funciona el sistema</h1>
        <p className="text-sm text-tinta-suave">AYNI HEALTH te ayuda a evaluar tu propia salud durante la misión, aunque no tengas formación médica.</p>
      </div>

      {/* Pasos */}
      <Tarjeta relleno="normal">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-tinta"><BookOpen size={18} className="text-primario" /> Guía rápida</h2>
        <ol className="space-y-2">
          {PASOS.map((paso, i) => (
            <li key={i} className="flex gap-2 text-sm text-tinta">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primario/15 text-xs font-bold text-primario">{i + 1}</span>
              {paso}
            </li>
          ))}
        </ol>
      </Tarjeta>

      {/* Peligros */}
      <div>
        <h2 className="mb-3 font-semibold text-tinta">Los cinco peligros del vuelo espacial (NASA)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PELIGROS.map((p) => (
            <Tarjeta key={p.nombre} relleno="compacto" className="flex items-start gap-3">
              <p.icono size={20} className="mt-0.5 shrink-0 text-andino-dorado" />
              <div>
                <div className="font-medium text-tinta">{p.nombre}</div>
                <p className="text-xs text-tinta-suave">{p.descripcion}</p>
              </div>
            </Tarjeta>
          ))}
        </div>
      </div>

      {/* Problemas de salud */}
      <Tarjeta relleno="normal">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-tinta"><ShieldCheck size={18} className="text-exito" /> Problemas de salud que vigilamos</h2>
        <ul className="flex flex-wrap gap-2">
          {PROBLEMAS.map((p) => (
            <li key={p} className="rounded-insignia border border-borde bg-superficie-alta px-2.5 py-1 text-xs text-tinta">{p}</li>
          ))}
        </ul>
      </Tarjeta>

      {/* Guía de indicadores */}
      <div>
        <h2 className="mb-3 font-semibold text-tinta">Guía de indicadores</h2>
        {isLoading && <div className="space-y-2"><Esqueleto className="h-24 w-full" /><Esqueleto className="h-24 w-full" /></div>}
        {!isLoading && isError && <EstadoVacio icono={<BookOpen size={22} />} titulo="No se pudo cargar la guía" descripcion="Revisa la conexión." />}
        {!isLoading && !isError && (
          <div className="space-y-3">
            {indicadores.map((i) => (
              <Tarjeta key={i.id} relleno="compacto" className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium text-tinta">{i.nombre}</div>
                  <div className="font-mono text-xs text-tinta-suave">{i.rango_referencia ? `Referencia: ${i.rango_referencia} ${i.unidad ?? ''}` : ''}</div>
                </div>
                {i.como_medir && <p className="text-sm text-tinta"><span className="font-medium">Cómo medir:</span> {i.como_medir}</p>}
                {i.por_que && <p className="text-sm text-tinta"><span className="font-medium">Por qué:</span> {i.por_que}</p>}
                {i.como_afecta && <p className="text-sm text-tinta"><span className="font-medium">Cómo lo afecta el espacio:</span> {i.como_afecta}</p>}
                {i.cuando_escalar && <p className="text-sm text-tinta"><span className="font-medium">Cuándo avisar:</span> {i.cuando_escalar}</p>}
                {i.acciones_preventivas && <p className="text-sm text-tinta"><span className="font-medium">Prevención:</span> {i.acciones_preventivas}</p>}
                {i.fuente && <p className="text-xs text-tinta-suave">Fuente: {i.fuente}</p>}
              </Tarjeta>
            ))}
          </div>
        )}
      </div>

      <p className="rounded-tarjeta border border-advertencia/40 bg-advertencia/10 px-4 py-3 text-xs text-tinta">
        Prototipo educativo, no un dispositivo médico. Las referencias de la NASA y otras agencias espaciales están marcadas &quot;pendiente de verificar&quot; hasta confirmar con los recursos oficiales del reto.
      </p>
    </div>
  )
}
