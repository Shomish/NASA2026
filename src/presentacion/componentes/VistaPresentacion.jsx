/**
 * @fileoverview Componente VistaPresentacion
 * Página de inicio (pitch para jueces): Hero, justificación técnica y roadmap.
 * @module presentacion/componentes/VistaPresentacion
 */

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  HeartPulse,
  Mountain,
  Radiation,
  Rocket,
  Satellite,
  Shirt,
  Sparkles,
  Waves,
} from 'lucide-react'
import { Tarjeta, EncabezadoPanel } from './UtilidadesUi.jsx'

/** Animación de entrada. */
const animar = {
  oculto: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

/**
 * Vista de presentación del proyecto.
 * @param {object} props - Propiedades.
 * @param {() => void} props.alIniciarSimulacion - Callback del CTA.
 * @returns {import('react').JSX.Element} Vista.
 */
export default function VistaPresentacion({ alIniciarSimulacion }) {
  return (
    <div className="space-y-10">
      {/* ==================== HERO ==================== */}
      <motion.section
        initial="oculto"
        animate="visible"
        variants={animar}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-borde bg-superficie/60 px-6 py-16 md:py-24 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primario/10 via-transparent to-transparent pointer-events-none" />
        <div className="estrellas absolute inset-0 opacity-40 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primario/30 bg-primario/10 text-primario text-xs font-mono uppercase tracking-widest">
            <Sparkles size={14} />
            NASA Space Apps Challenge 2026
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-50 leading-tight">
            Monitor Autónomo de Salud{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">
              para Astronautas
            </span>
          </h1>

          <p className="text-lg md:text-xl text-tinta max-w-2xl mx-auto">
            En misiones de larga duración, el astronauta es su propio médico. Nuestro sistema
            recopila indicadores vitales, evalúa el estado de salud y recomienda contramedidas,
            usando el aislamiento y la altitud de <strong className="text-primario">Cusco, Perú</strong> como
            análogo terrestre.
          </p>

          <button
            type="button"
            onClick={alIniciarSimulacion}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primario hover:bg-primario-fuerte text-white font-semibold text-lg shadow-[0_0_30px_rgba(124,58,237,0.45)] transition-all hover:shadow-[0_0_45px_rgba(124,58,237,0.6)]"
          >
            <Rocket size={20} />
            Iniciar Simulación
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.section>

      {/* ==================== JUSTIFICACIÓN TÉCNICA ==================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-tinta">Justificación Técnica</h2>
          <p className="text-tinta-suave max-w-2xl mx-auto">
            Los peligros del espacio profundo exigen un enfoque autónomo de la salud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tarjeta clase="p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-critico/15 border border-rose-500/20 flex items-center justify-center text-critico">
              <Radiation size={20} />
            </div>
            <h3 className="font-semibold text-tinta">Radiación cósmica</h3>
            <p className="text-sm text-tinta-suave leading-relaxed">
              La radiación de partículas daña tejidos y aumenta el riesgo cardiovascular y
              oncológico, alterando el sistema inmunitario.
            </p>
          </Tarjeta>

          <Tarjeta clase="p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-advertencia/15 border border-orange-500/20 flex items-center justify-center text-advertencia">
              <Waves size={20} />
            </div>
            <h3 className="font-semibold text-tinta">Microgravedad</h3>
            <p className="text-sm text-tinta-suave leading-relaxed">
              La ingravidez provoca pérdida ósea, atrofia muscular y redistribución de fluidos
              que desacondicionan el cuerpo.
            </p>
          </Tarjeta>

          <Tarjeta clase="p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primario-fuerte/15 border border-primario/20 flex items-center justify-center text-primario">
              <Brain size={20} />
            </div>
            <h3 className="font-semibold text-tinta">Aislamiento y confinamiento</h3>
            <p className="text-sm text-tinta-suave leading-relaxed">
              El confinamiento prolongado en un entorno cerrado impacta la salud mental y el
              ritmo circadiano.
            </p>
          </Tarjeta>

          <Tarjeta clase="p-5 space-y-3 border-primario/30">
            <div className="w-10 h-10 rounded-lg bg-exito/15 border border-emerald-500/20 flex items-center justify-center text-exito">
              <Mountain size={20} />
            </div>
            <h3 className="font-semibold text-tinta">Análogo andino (Cusco)</h3>
            <p className="text-sm text-tinta-suave leading-relaxed">
              La altitud (3 400 m) y el aislamiento andino reproducen hipoxia y autonomía,
              aportando saberes y superalimentos como contramedidas.
            </p>
          </Tarjeta>
        </div>
      </section>

      {/* ==================== ROADMAP ==================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-tinta">Roadmap · Futuras Mejoras</h2>
          <p className="text-tinta-suave">Fases tecnológicas a implementar post-hackathon.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tarjeta clase="p-6 space-y-3">
            <EncabezadoPanel
              icono={<HeartPulse size={18} />}
              titulo="Gemelo Digital"
              subtitulo="Digital Twin"
            />
            <p className="text-sm text-tinta-suave leading-relaxed">
              Modelado predictivo de órganos mediante simulación fisiológica en tiempo real,
              anticipando fallos antes de que ocurran.
            </p>
            <span className="inline-block px-2 py-1 rounded bg-superficie-alta text-tinta-suave text-xs font-mono">
              Fase 2 · IA + simulación
            </span>
          </Tarjeta>

          <Tarjeta clase="p-6 space-y-3">
            <EncabezadoPanel
              icono={<Shirt size={18} />}
              titulo="IoT & Smart Fabrics"
              subtitulo="Sensores pasivos"
            />
            <p className="text-sm text-tinta-suave leading-relaxed">
              Biometría entretejida en el traje para lectura pasiva continua. Actualmente el
              ingreso de datos es estrictamente manual a través del UI.
            </p>
            <span className="inline-block px-2 py-1 rounded bg-superficie-alta text-tinta-suave text-xs font-mono">
              Fase 3 · Hardware
            </span>
          </Tarjeta>

          <Tarjeta clase="p-6 space-y-3">
            <EncabezadoPanel
              icono={<Satellite size={18} />}
              titulo="Análisis de Sentimiento"
              subtitulo="Biometría de voz"
            />
            <p className="text-sm text-tinta-suave leading-relaxed">
              Detección de fatiga y estrés psicológico mediante análisis de la voz y patrones de
              habla del astronauta.
            </p>
            <span className="inline-block px-2 py-1 rounded bg-superficie-alta text-tinta-suave text-xs font-mono">
              Fase 4 · NLP
            </span>
          </Tarjeta>
        </div>
      </section>
    </div>
  )
}
