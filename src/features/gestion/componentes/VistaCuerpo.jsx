/**
 * @fileoverview Vista "Mi cuerpo" (5C): mapa corporal interactivo y evaluación por
 * peligros de la NASA, con datos reales del tripulante activo.
 * @module features/gestion/componentes/VistaCuerpo
 */

import { Radiation, DoorClosed, Globe, Weight, Home } from 'lucide-react'
import { Esqueleto, EstadoVacio, Tarjeta } from '../../../presentacion/sistema/indice.js'
import { useContextoTripulante } from '../useContextoTripulante.js'
import { useResumen } from '../consultas.js'
import { MapaCorporal } from './MapaCorporal.jsx'

/** Peligros con su indicador de estado a partir del resumen. */
const PELIGROS = [
  { nombre: 'Radiación espacial', icono: Radiation, clave: 'radiacion', descripcion: 'Exposición a partículas energéticas.' },
  { nombre: 'Aislamiento y confinamiento', icono: DoorClosed, clave: 'conductual', descripcion: 'Efectos psicológicos del confinamiento.' },
  { nombre: 'Distancia de la Tierra', icono: Globe, clave: 'conductual', descripcion: 'Comunicación retrasada y ayuda lejana.' },
  { nombre: 'Campos gravitatorios', icono: Weight, clave: 'oseo', descripcion: 'Pérdida de masa ósea y muscular.' },
  { nombre: 'Entorno cerrado hostil', icono: Home, clave: 'ambiente', descripcion: 'Aire, CO₂ y ambiente de la cabina.' },
]

/**
 * Vista del mapa corporal y evaluación por peligros.
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaCuerpo() {
  const { tripulanteActivo, sinPerfil } = useContextoTripulante()
  const { data, isLoading } = useResumen(tripulanteActivo?.id)

  if (isLoading) return <div className="space-y-4"><Esqueleto className="h-80 w-full" /><Esqueleto className="h-40 w-full" /></div>
  if (sinPerfil || !data) return <EstadoVacio icono={<Weight size={22} />} titulo="Sin tripulante" descripcion="Selecciona un tripulante para ver su mapa corporal." />

  const critico = (data.alertas?.criticas ?? 0) > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-tinta">Mi cuerpo</h1>
        <p className="text-sm text-tinta-suave">Selecciona un sistema en el modelo o en la lista para ver su función, indicadores y estado.</p>
      </div>

      <MapaCorporal resumen={data} />

      <div>
        <h2 className="mb-3 font-semibold text-tinta">Evaluación por peligro</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PELIGROS.map((p) => (
            <Tarjeta key={p.nombre} relleno="compacto" className="flex items-start gap-3">
              <p.icono size={20} className="mt-0.5 shrink-0 text-andino-dorado" />
              <div className="min-w-0">
                <div className="font-medium text-tinta">{p.nombre}</div>
                <p className="text-xs text-tinta-suave">{p.descripcion}</p>
                <div className={`mt-2 inline-flex items-center gap-1.5 rounded-insignia px-2 py-0.5 text-xs ${critico ? 'bg-critico/15 text-critico' : 'bg-exito/15 text-exito'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {critico ? 'Revisar' : 'Vigilado'}
                </div>
              </div>
            </Tarjeta>
          ))}
        </div>
      </div>
    </div>
  )
}
