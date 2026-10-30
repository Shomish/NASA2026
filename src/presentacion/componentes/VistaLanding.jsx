/**
 * @fileoverview Landing de presentación (antes del login).
 * Presenta AYNI HEALTH, los cinco peligros de la NASA y enlaza al sistema.
 * @module presentacion/componentes/VistaLanding
 */

import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Brain, HeartPulse, Leaf, Moon, PersonStanding, Radiation, ShieldCheck, Sun } from 'lucide-react'
import { useTema } from '../sistema/tema.jsx'

/** Características destacadas. */
const CARACTERISTICAS = [
  { icono: HeartPulse, titulo: 'Monitoreo autónomo', descripcion: 'Signos vitales, sueño, glucosa y ánimo sin depender de control de misión.' },
  { icono: PersonStanding, titulo: 'Mapa corporal', descripcion: 'Toca cada parte del cuerpo para entender su estado.' },
  { icono: Brain, titulo: 'Guía para no médicos', descripcion: 'Explica qué medir, por qué y cuándo avisar.' },
  { icono: Leaf, titulo: 'Nutrición andina', descripcion: 'Contramedidas con superalimentos de los Andes.' },
]

/**
 * Landing de presentación.
 * @returns {import('react').JSX.Element} Landing.
 */
export function VistaLanding() {
  const { modoEfectivo, alternarModo } = useTema()

  return (
    <div className="min-h-dvh bg-fondo text-tinta">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-hero-inicio via-hero-medio to-hero-fin">
        <div className="textura-andina absolute inset-0 opacity-30" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center gap-6 px-6 py-16">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teja to-teja-fuerte shadow-glow">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">AYNI HEALTH</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">Monitor autónomo · Cosmos andino</div>
            </div>
          </div>

          <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight text-white lg:text-6xl">
            Tu salud, evaluada por ti,{' '}
            <span className="bg-gradient-to-r from-andino-dorado to-acento bg-clip-text text-transparent">incluso sin conexión.</span>
          </h1>
          <p className="max-w-xl text-white/85">
            Una herramienta visual para que los astronautas evalúen su propia salud durante misiones largas:
            entiende los cinco peligros del vuelo espacial, registra tus indicadores y recibe guía para cuidarte.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-boton bg-white px-5 py-3 text-sm font-semibold text-teja-fuerte shadow-glow hover:opacity-90">
              Entrar al sistema <ArrowRight size={16} />
            </Link>
            <Link to="/registro" className="inline-flex items-center gap-2 rounded-boton border border-white/40 px-5 py-3 text-sm font-medium text-white hover:bg-white/10">
              Crear cuenta
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck size={14} className="text-andino-dorado" /> Prototipo educativo, no un dispositivo médico.
          </div>
        </div>
      </div>

      {/* Características */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-6 font-serif text-2xl font-bold text-tinta">Qué hace AYNI HEALTH</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARACTERISTICAS.map((c) => (
            <div key={c.titulo} className="rounded-tarjeta border border-borde bg-superficie p-5">
              <c.icono size={22} className="text-primario" />
              <h3 className="mt-3 font-medium text-tinta">{c.titulo}</h3>
              <p className="mt-1 text-sm text-tinta-suave">{c.descripcion}</p>
            </div>
          ))}
        </div>

        {/* Peligros */}
        <div className="mt-10 rounded-tarjeta border border-borde bg-superficie p-6">
          <h2 className="mb-2 font-serif text-xl font-bold text-tinta">Los cinco peligros del vuelo espacial</h2>
          <p className="mb-4 text-sm text-tinta-suave">Según el Human Research Program de la NASA.</p>
          <ul className="grid gap-2 text-sm text-tinta sm:grid-cols-2">
            <li className="flex items-center gap-2"><Radiation size={15} className="text-andino-dorado" /> Radiación espacial</li>
            <li className="flex items-center gap-2"><Moon size={15} className="text-andino-dorado" /> Aislamiento y confinamiento</li>
            <li className="flex items-center gap-2"><Activity size={15} className="text-andino-dorado" /> Distancia de la Tierra</li>
            <li className="flex items-center gap-2"><HeartPulse size={15} className="text-andino-dorado" /> Campos gravitatorios</li>
            <li className="flex items-center gap-2"><ShieldCheck size={15} className="text-andino-dorado" /> Entorno cerrado hostil</li>
          </ul>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div className="font-mono text-xs text-tinta-suave">© 2026 AYNI HEALTH · NASA Space Apps Challenge · v1.0</div>
          <button type="button" onClick={alternarModo} className="rounded-boton border border-borde p-2 text-tinta-suave hover:text-tinta" aria-label="Alternar modo">
            {modoEfectivo === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
