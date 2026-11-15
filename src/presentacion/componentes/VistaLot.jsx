/**
 * @fileoverview Vista independiente del modelo 3D LOT.
 * Separada de "Mi cuerpo" (mapa corporal del astronauta).
 * @module presentacion/componentes/VistaLot
 */

import ModeloRobot from './ModeloRobot.jsx'
import { useIdioma } from '../../shared/idioma.js'

/**
 * Vista LOT 3D.
 * @returns {import('react').JSX.Element} Vista.
 */
export default function VistaLot() {
  const idioma = useIdioma((s) => s.idioma)
  const es = idioma !== 'en'
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-tinta">LOT 3D</h1>
        <p className="text-sm text-tinta-suave">
          {es
            ? 'Modelo 3D del robot LOT, en un módulo independiente del mapa corporal.'
            : 'LOT robot 3D model, in a module separate from the body map.'}
        </p>
      </div>

      <div className="rounded-tarjeta border border-borde bg-superficie p-4">
        <ModeloRobot className="h-[560px] w-full rounded-tarjeta border border-borde bg-superficie-alta/40" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-tinta-suave">
          <span>Modelo 3D: Cute Home Robot — Yandrack (Sketchfab), CC-BY-4.0.</span>
          <a
            href="https://sketchfab.com/3d-models/cute-home-robot-7b75f204eb3e42b6babd883773e0789d"
            target="_blank"
            rel="noreferrer"
            className="text-primario hover:underline"
          >
            {es ? 'Ver fuente' : 'View source'}
          </a>
        </div>
      </div>
    </div>
  )
}
