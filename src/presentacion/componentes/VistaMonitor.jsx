/**
 * @fileoverview Componente VistaMonitor
 * Dashboard del monitor autónomo con selector de persona y todos los módulos.
 * @module presentacion/componentes/VistaMonitor
 */

import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import TarjetaEstadoGlobal from './TarjetaEstadoGlobal.jsx'
import FormularioSignosVitales from './FormularioSignosVitales.jsx'
import ModuloSaludIntegral from './ModuloSaludIntegral.jsx'
import ModuloNutricion from './ModuloNutricion.jsx'
import ChatbotIA from './ChatbotIA.jsx'
import { PanelHistorial, PanelNotas, PanelAlertas, Calendario } from './Registro.jsx'
import { calcularPuntajeSalud, generarRecomendacionNutricional } from '../../aplicacion/indice.js'
import { calcularIMC } from '../../dominio/indice.js'

/**
 * Dashboard del monitor.
 * @param {object} props - Propiedades.
 * @param {import('../../dominio/indice.js').Astronauta} props.persona - Persona activa.
 * @param {object} props.signos - Signos vitales actuales.
 * @param {object[]} props.registros - Registros de la persona.
 * @param {Array<import('../../dominio/indice.js').Astronauta>} props.tripulacion - Tripulación.
 * @param {(id: string) => void} props.alSeleccionar - Cambiar persona.
 * @param {(registro: object) => void} props.alAgregar - Agregar registro.
 * @param {(id: string) => void} props.alEliminar - Eliminar registro.
 * @param {(id: string) => void} props.alMarcarAlertaLeida - Marcar alerta leída.
 * @param {import('../../infraestructura/indice.js').ConectorLLM} props.conectorLLM - Conector LLM.
 * @returns {import('react').JSX.Element} Dashboard.
 */
export default function VistaMonitor({
  persona,
  signos,
  registros,
  tripulacion,
  alSeleccionar,
  alAgregar,
  alEliminar,
  alMarcarAlertaLeida,
  conectorLLM,
}) {
  const resultado = useMemo(() => calcularPuntajeSalud(signos), [signos])
  const recomendacion = useMemo(() => generarRecomendacionNutricional(persona, signos), [persona, signos])

  const suenos = registros.filter((r) => r.tipo === 'sueno')
  const ultimoSueno = suenos[suenos.length - 1] ?? null
  const mentales = registros.filter((r) => r.tipo === 'mental')
  const ultimoMental = mentales[mentales.length - 1] ?? null
  const notas = registros.filter((r) => r.tipo === 'nota')
  const alertas = registros.filter((r) => r.tipo === 'alerta')

  if (!persona) {
    return (
      <div className="text-center py-20 text-neutral-400">
        No hay tripulantes. Ve a <strong className="text-neutral-200">Tripulación</strong> y agrega uno.
      </div>
    )
  }

  const contexto = { persona, signos, sueno: ultimoSueno, mental: ultimoMental, nutricion: recomendacion }

  return (
    <div className="space-y-4">
      {/* Barra de contexto + selector */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-2xl border border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center font-semibold text-white">
            {persona.nombre.split(' ').map((p) => p[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="font-medium text-neutral-100">{persona.nombre}</div>
            <div className="text-xs font-mono text-neutral-500">{persona.rol} · {persona.mision}</div>
          </div>
        </div>

        <select
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100"
          value={persona.id}
          onChange={(e) => alSeleccionar(e.target.value)}
        >
          {tripulacion.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2 font-mono text-xs text-neutral-400">
          <CalendarDays size={14} className="text-violet-400" />
          Día de misión {persona.diaMision} · IMC {calcularIMC(persona.pesoKg, persona.alturaCm)}
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <TarjetaEstadoGlobal resultado={resultado} />
          <FormularioSignosVitales signos={signos} registros={registros} alRegistrar={(t, v) => alAgregar({ tipo: 'signo', signoTipo: t, valor: v })} alEliminar={alEliminar} />
          <ModuloSaludIntegral registros={registros} alAgregar={alAgregar} alEliminar={alEliminar} />
          <ModuloNutricion persona={persona} signos={signos} />
          <PanelHistorial registros={registros} alEliminar={alEliminar} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PanelNotas notas={notas} alAgregar={alAgregar} alEliminar={alEliminar} />
            <PanelAlertas alertas={alertas} alMarcarLeida={alMarcarAlertaLeida} alEliminar={alEliminar} />
          </div>
          <Calendario registros={registros} />
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-20 h-full">
            <ChatbotIA contexto={contexto} conectorLLM={conectorLLM} />
          </div>
        </div>
      </div>
    </div>
  )
}
