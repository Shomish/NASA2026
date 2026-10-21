/**
 * @fileoverview Vista Ayuda.
 * Panel con atajos de teclado y ayuda básica.
 * @module presentacion/componentes/VistaAyuda
 */

import { Keyboard, HelpCircle } from 'lucide-react'
import { Tarjeta } from '../sistema/indice.js'

/** Atajos de teclado del sistema. */
const ATAJOS = [
  { teclas: 'Ctrl + K', descripcion: 'Buscar (tripulantes, registros, módulos)' },
  { teclas: 'N', descripcion: 'Nueva medición' },
  { teclas: 'G + D', descripcion: 'Ir al Dashboard' },
  { teclas: 'G + M', descripcion: 'Ir al Monitor' },
  { teclas: 'G + T', descripcion: 'Ir a Tripulación' },
  { teclas: '?', descripcion: 'Mostrar este panel' },
]

/**
 * Vista de ayuda.
 * @returns {import('react').JSX.Element} Ayuda.
 */
export default function VistaAyuda() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-bold">Ayuda</h1>
        <p className="text-tinta-suave">Atajos de teclado y ayuda rápida del sistema.</p>
      </div>

      <Tarjeta variante="elevado">
        <div className="mb-3 flex items-center gap-2 font-semibold"><Keyboard size={18} className="text-primario" /> Atajos de teclado</div>
        <div className="space-y-1">
          {ATAJOS.map((atajo) => (
            <div key={atajo.teclas} className="flex items-center justify-between border-b border-borde py-2 text-sm last:border-0">
              <span className="text-tinta-suave">{atajo.descripcion}</span>
              <kbd className="rounded-insignia border border-borde bg-superficie-alta px-2 py-1 font-mono text-xs">{atajo.teclas}</kbd>
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta variante="elevado">
        <div className="mb-3 flex items-center gap-2 font-semibold"><HelpCircle size={18} className="text-primario" /> Sobre AYNI HEALTH</div>
        <p className="text-sm leading-relaxed text-tinta-suave">
          Monitor autónomo de salud para astronautas, con análogo terrestre en Cusco (Perú, 3 400 m de altitud).
          El concepto de <em>ayni</em> (reciprocidad andina) inspira el apoyo mutuo de la tripulación.
          NASA Space Apps Challenge 2026.
        </p>
      </Tarjeta>
    </div>
  )
}
