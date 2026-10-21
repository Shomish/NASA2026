/**
 * @fileoverview Buscador global (command palette) con cmdk.
 * Busca módulos, tripulantes y acciones rápidas. Atajo Ctrl/Cmd+K.
 * @module app/shell/CommandPalette
 */

import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, HeartPulse, Settings, HelpCircle, Plus, Users } from 'lucide-react'
import { tripulacionInicial } from '../../datos/mockDatos.js'

/** Módulos navegables. */
const MODULOS = [
  { etiqueta: 'Dashboard', ruta: '/app', icono: LayoutDashboard },
  { etiqueta: 'Monitor de salud', ruta: '/app/monitor', icono: HeartPulse },
  { etiqueta: 'Configuración', ruta: '/app/configuracion', icono: Settings },
  { etiqueta: 'Ayuda', ruta: '/app/ayuda', icono: HelpCircle },
]

/**
 * Buscador global (command palette).
 * @param {object} props - Propiedades.
 * @param {boolean} props.abierto - Si está visible.
 * @param {() => void} props.alCerrar - Callback de cierre.
 * @returns {import('react').JSX.Element} Palette.
 */
export function CommandPalette({ abierto, alCerrar }) {
  const navigate = useNavigate()

  const irA = (ruta) => {
    alCerrar()
    navigate(ruta)
  }

  return (
    <Command.Dialog open={abierto} onOpenChange={(o) => !o && alCerrar()} label="Buscar" className="fixed inset-0 z-50">
      <div className="mx-auto mt-[15vh] w-full max-w-lg overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-consola">
        <Command.Input
          placeholder="Buscar módulos, tripulantes o acciones…"
          className="w-full border-b border-borde bg-transparent px-4 py-3 text-tinta outline-none placeholder:text-tinta-suave"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="px-4 py-3 text-sm text-tinta-suave">Sin resultados.</Command.Empty>

          <Command.Group heading="Acciones" className="text-[10px] font-semibold uppercase tracking-widest text-tinta-suave">
            <Command.Item onSelect={() => irA('/app/monitor')} className="flex cursor-pointer items-center gap-2 rounded-boton px-3 py-2 text-sm text-tinta data-[selected=true]:bg-primario/15">
              <Plus size={16} /> Registrar medición
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Módulos" className="text-[10px] font-semibold uppercase tracking-widest text-tinta-suave">
            {MODULOS.map((m) => (
              <Command.Item key={m.ruta} onSelect={() => irA(m.ruta)} className="flex cursor-pointer items-center gap-2 rounded-boton px-3 py-2 text-sm text-tinta data-[selected=true]:bg-primario/15">
                <m.icono size={16} /> {m.etiqueta}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Tripulantes" className="text-[10px] font-semibold uppercase tracking-widest text-tinta-suave">
            {tripulacionInicial.map((p) => (
              <Command.Item key={p.id} onSelect={() => irA('/app/monitor')} className="flex cursor-pointer items-center gap-2 rounded-boton px-3 py-2 text-sm text-tinta data-[selected=true]:bg-primario/15">
                <Users size={16} /> {p.nombre} · {p.rol}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
