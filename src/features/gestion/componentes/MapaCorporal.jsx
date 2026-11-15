/**
 * @fileoverview Mapa corporal interactivo (figura humana clicable).
 * Cada región muestra su función, indicadores vinculados y estado actual (color).
 * Accesible por teclado y con alternativa en lista.
 * @module features/gestion/componentes/MapaCorporal
 */

import { useState } from 'react'
import { Brain, HeartPulse, Wind, Bone, Dumbbell, ShieldPlus } from 'lucide-react'
import { Tarjeta } from '../../../presentacion/sistema/indice.js'

/** Regiones del cuerpo con su indicador y cómo se calcula el estado. */
const REGIONES = [
  { id: 'cerebro', etiqueta: 'Cerebro · salud mental', icono: Brain, x: 90, y: 34, r: 22, indicadores: ['Ánimo', 'PHQ-9', 'Estrés'], funcion: 'Controla el ánimo, el estrés y la ansiedad durante el confinamiento.' },
  { id: 'corazon', etiqueta: 'Corazón · cardiovascular', icono: HeartPulse, x: 90, y: 92, r: 20, indicadores: ['Frecuencia cardíaca', 'Presión arterial'], funcion: 'Bombea la sangre; la microgravedad cambia su trabajo.' },
  { id: 'pulmones', etiqueta: 'Pulmones · oxígeno', icono: Wind, x: 90, y: 130, r: 20, indicadores: ['Saturación de O₂', 'Ambiente (CO₂)'], funcion: 'Aportan oxígeno; dependen del aire de la cabina.' },
  { id: 'huesos', etiqueta: 'Huesos · densidad ósea', icono: Bone, x: 90, y: 178, r: 20, indicadores: ['Ejercicio de resistencia'], funcion: 'Pierden densidad en microgravedad; el ejercicio los protege.' },
  { id: 'musculos', etiqueta: 'Músculos · fuerza', icono: Dumbbell, x: 48, y: 178, r: 18, indicadores: ['Ejercicio', 'Contramedidas'], funcion: 'Se debilitan sin carga; el entrenamiento los mantiene.' },
  { id: 'inmune', etiqueta: 'Piel · sistema inmune', icono: ShieldPlus, x: 132, y: 178, r: 18, indicadores: ['Síntomas inmunes', 'Temperatura'], funcion: 'Defensa contra infecciones; puede alterarse en el espacio.' },
]

/**
 * Estado (color) de una región a partir del resumen.
 * @param {string} id - Id de región.
 * @param {object} resumen - Resumen de salud.
 * @returns {'optimo'|'atencion'|'critico'|'sin-datos'} Estado.
 */
function estadoRegion(id, resumen) {
  if (!resumen) return 'sin-datos'
  if (id === 'cerebro') {
    const animo = resumen.animo?.escala
    if (animo !== undefined) return animo <= 4 ? 'critico' : animo <= 6 ? 'atencion' : 'optimo'
  }
  if (id === 'corazon') {
    const fc = resumen.signos?.frecuencia_cardiaca
    if (fc !== undefined) return fc > 120 || fc < 40 ? 'critico' : fc > 100 ? 'atencion' : 'optimo'
  }
  if (id === 'pulmones') {
    const spo2 = resumen.signos?.spo2
    if (spo2 !== undefined) return spo2 < 90 ? 'critico' : spo2 < 95 ? 'atencion' : 'optimo'
  }
  if (id === 'huesos' || id === 'musculos') {
    if (resumen.ejercicio) return resumen.ejercicio.cumplio_plan ? 'optimo' : 'atencion'
  }
  if (id === 'inmune') {
    const critico = resumen.alertas?.criticas ?? 0
    return critico > 0 ? 'critico' : 'optimo'
  }
  return 'sin-datos'
}

/** Color por estado. */
const COLOR_ESTADO = { optimo: 'rgb(var(--exito))', atencion: 'rgb(var(--advertencia))', critico: 'rgb(var(--critico))', 'sin-datos': 'rgb(var(--tinta-suave))' }

/**
 * Mapa corporal interactivo.
 * @param {object} props - Propiedades.
 * @param {object} props.resumen - Resumen de salud del tripulante.
 * @returns {import('react').JSX.Element} Mapa.
 */
export function MapaCorporal({ resumen }) {
  const [seleccionada, setSeleccionada] = useState('cerebro')
  const region = REGIONES.find((r) => r.id === seleccionada)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Figura */}
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 180 260" className="h-80 w-auto" role="img" aria-label="Mapa corporal del tripulante">
          {/* Silueta */}
          <circle cx="90" cy="34" r="22" fill="none" stroke="currentColor" strokeWidth="6" className="text-tinta-suave" />
          <line x1="90" y1="56" x2="90" y2="200" stroke="currentColor" strokeWidth="6" className="text-tinta-suave" />
          <line x1="90" y1="78" x2="48" y2="140" stroke="currentColor" strokeWidth="6" className="text-tinta-suave" />
          <line x1="90" y1="78" x2="132" y2="140" stroke="currentColor" strokeWidth="6" className="text-tinta-suave" />
          <line x1="90" y1="200" x2="62" y2="250" stroke="currentColor" strokeWidth="6" className="text-tinta-suave" />
          <line x1="90" y1="200" x2="118" y2="250" stroke="currentColor" strokeWidth="6" className="text-tinta-suave" />

          {/* Regiones clicables */}
          {REGIONES.map((r) => (
            <circle
              key={r.id}
              cx={r.x}
              cy={r.y}
              r={r.r}
              fill={COLOR_ESTADO[estadoRegion(r.id, resumen)]}
              fillOpacity={0.55}
              stroke={seleccionada === r.id ? 'rgb(var(--tinta))' : 'transparent'}
              strokeWidth={2}
              className="cursor-pointer transition-opacity hover:opacity-80"
              role="button"
              tabIndex={0}
              aria-label={`${r.etiqueta}. Estado: ${estadoRegion(r.id, resumen)}`}
              onClick={() => setSeleccionada(r.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSeleccionada(r.id) } }}
            />
          ))}
        </svg>
      </div>

      {/* Detalle de la región */}
      <div className="space-y-3">
        <Tarjeta relleno="compacto" className="space-y-2">
          <div className="flex items-center gap-2">
            {region && <region.icono size={20} className="text-primario" />}
            <h3 className="font-semibold text-tinta">{region?.etiqueta}</h3>
          </div>
          <p className="text-sm text-tinta-suave">{region?.funcion}</p>
          <div className="flex flex-wrap gap-2">
            {region?.indicadores.map((i) => (
              <span key={i} className="rounded-insignia border border-borde bg-superficie-alta px-2 py-0.5 text-xs text-tinta">{i}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: COLOR_ESTADO[estadoRegion(seleccionada, resumen)] }} />
            <span className="capitalize text-tinta">{estadoRegion(seleccionada, resumen) === 'sin-datos' ? 'Sin datos' : estadoRegion(seleccionada, resumen)}</span>
          </div>
        </Tarjeta>

        {/* Alternativa en lista (accesibilidad) */}
        <div className="grid gap-1">
          {REGIONES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSeleccionada(r.id)}
              className={`flex items-center gap-2 rounded-boton px-3 py-2 text-left text-sm ${seleccionada === r.id ? 'bg-superficie-alta text-tinta' : 'text-tinta-suave hover:bg-superficie-alta'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_ESTADO[estadoRegion(r.id, resumen)] }} />
              <r.icono size={15} />
              {r.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
