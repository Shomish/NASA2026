/**
 * @fileoverview Componente NavegacionPrincipal
 * Navegación superior con tres vistas: Presentación, Monitor y Tripulación.
 * @module presentacion/componentes/NavegacionPrincipal
 */

import { Activity, LayoutDashboard, Presentation, Users } from 'lucide-react'

/** Vistas disponibles. */
const VISTAS = [
  { id: 'presentacion', etiqueta: 'Presentación', icono: Presentation },
  { id: 'monitor', etiqueta: 'Monitor', icono: LayoutDashboard },
  { id: 'tripulacion', etiqueta: 'Tripulación', icono: Users },
]

/**
 * Navegación principal.
 * @param {object} props - Propiedades.
 * @param {string} props.vistaActiva - Vista activa.
 * @param {(vista: string) => void} props.alCambiarVista - Callback.
 * @returns {import('react').JSX.Element} Navegación.
 */
export default function NavegacionPrincipal({ vistaActiva, alCambiarVista }) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-[0_0_18px_rgba(139,92,246,0.4)]">
            <Activity size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-neutral-100 tracking-tight">AYNI HEALTH</div>
            <div className="text-[10px] uppercase tracking-widest text-violet-400/70 font-mono">
              Monitor Autónomo · Cosmos Andino
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 ml-auto flex-wrap">
          {VISTAS.map((vista) => {
            const Icono = vista.icono
            const activa = vistaActiva === vista.id
            return (
              <button
                key={vista.id}
                type="button"
                onClick={() => alCambiarVista(vista.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activa ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]' : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                }`}
              >
                <Icono size={16} />
                {vista.etiqueta}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
