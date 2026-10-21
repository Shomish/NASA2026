/**
 * @fileoverview Vistas de ruta de salud (wrappers delgados).
 * Cada vista lee del store y renderiza el módulo correspondiente.
 * @module features/salud/vistas
 */

import { useMemo } from 'react'
import { ConectorLLM } from '../../infraestructura/indice.js'
import { calcularPuntajeSalud, generarRecomendacionNutricional } from '../../aplicacion/indice.js'
import { useSaludStore, usePersona, useRegistrosPersona, useSignos } from './almacen.js'
import VistaMonitor from '../../presentacion/componentes/VistaMonitor.jsx'
import VistaTripulacion from '../../presentacion/componentes/VistaTripulacion.jsx'
import FormularioSignosVitales from '../../presentacion/componentes/FormularioSignosVitales.jsx'
import ModuloSaludIntegral from '../../presentacion/componentes/ModuloSaludIntegral.jsx'
import ModuloNutricion from '../../presentacion/componentes/ModuloNutricion.jsx'
import ChatbotIA from '../../presentacion/componentes/ChatbotIA.jsx'
import { PanelHistorial, PanelNotas, PanelAlertas, Calendario } from '../../presentacion/componentes/Registro.jsx'

const conectorLLM = new ConectorLLM()

/** Vista Monitor (ruta /app/monitor). */
export function VistaMonitorRuta() {
  const tripulacion = useSaludStore((s) => s.tripulacion)
  const setPersonaId = useSaludStore((s) => s.setPersonaId)
  const agregarRegistro = useSaludStore((s) => s.agregarRegistro)
  const eliminarRegistro = useSaludStore((s) => s.eliminarRegistro)
  const marcarAlertaLeida = useSaludStore((s) => s.marcarAlertaLeida)
  const persona = usePersona()
  const registros = useRegistrosPersona()
  const signos = useSignos()
  return (
    <VistaMonitor
      persona={persona}
      signos={signos}
      registros={registros}
      tripulacion={tripulacion}
      alSeleccionar={setPersonaId}
      alAgregar={agregarRegistro}
      alEliminar={eliminarRegistro}
      alMarcarAlertaLeida={marcarAlertaLeida}
      conectorLLM={conectorLLM}
    />
  )
}

/** Vista Tripulación (ruta /app/tripulacion). */
export function VistaTripulacionRuta() {
  const tripulacion = useSaludStore((s) => s.tripulacion)
  const personaId = useSaludStore((s) => s.personaId)
  const setPersonaId = useSaludStore((s) => s.setPersonaId)
  const guardarPersona = useSaludStore((s) => s.guardarPersona)
  const eliminarPersona = useSaludStore((s) => s.eliminarPersona)
  return (
    <VistaTripulacion
      tripulacion={tripulacion}
      personaId={personaId}
      alSeleccionar={setPersonaId}
      alGuardar={guardarPersona}
      alEliminar={eliminarPersona}
    />
  )
}

/** Vista Signos vitales (ruta /app/signos). */
export function VistaSignosRuta() {
  const signos = useSignos()
  const registros = useRegistrosPersona()
  const agregarRegistro = useSaludStore((s) => s.agregarRegistro)
  const eliminarRegistro = useSaludStore((s) => s.eliminarRegistro)
  return (
    <FormularioSignosVitales
      signos={signos}
      registros={registros}
      alRegistrar={(tipo, valor) => agregarRegistro({ tipo: 'signo', signoTipo: tipo, valor })}
      alEliminar={eliminarRegistro}
    />
  )
}

/** Vista Salud integral (ruta /app/salud-integral). */
export function VistaSaludIntegralRuta() {
  const registros = useRegistrosPersona()
  const agregarRegistro = useSaludStore((s) => s.agregarRegistro)
  const eliminarRegistro = useSaludStore((s) => s.eliminarRegistro)
  return <ModuloSaludIntegral registros={registros} alAgregar={agregarRegistro} alEliminar={eliminarRegistro} />
}

/** Vista Nutrición (ruta /app/nutricion). */
export function VistaNutricionRuta() {
  const persona = usePersona()
  const signos = useSignos()
  return <ModuloNutricion persona={persona} signos={signos} />
}

/** Vista Historial (ruta /app/historial). */
export function VistaHistorialRuta() {
  const registros = useRegistrosPersona()
  const eliminarRegistro = useSaludStore((s) => s.eliminarRegistro)
  return <PanelHistorial registros={registros} alEliminar={eliminarRegistro} />
}

/** Vista Diario (ruta /app/diario). */
export function VistaDiarioRuta() {
  const registros = useRegistrosPersona()
  const agregarRegistro = useSaludStore((s) => s.agregarRegistro)
  const eliminarRegistro = useSaludStore((s) => s.eliminarRegistro)
  const notas = registros.filter((r) => r.tipo === 'nota')
  return <PanelNotas notas={notas} alAgregar={agregarRegistro} alEliminar={eliminarRegistro} />
}

/** Vista Alertas (ruta /app/alertas). */
export function VistaAlertasRuta() {
  const registros = useRegistrosPersona()
  const marcarAlertaLeida = useSaludStore((s) => s.marcarAlertaLeida)
  const eliminarRegistro = useSaludStore((s) => s.eliminarRegistro)
  const alertas = registros.filter((r) => r.tipo === 'alerta')
  return <PanelAlertas alertas={alertas} alMarcarLeida={marcarAlertaLeida} alEliminar={eliminarRegistro} />
}

/** Vista Calendario (ruta /app/calendario). */
export function VistaCalendarioRuta() {
  const registros = useRegistrosPersona()
  return <Calendario registros={registros} />
}

/** Vista Médico de IA (ruta /app/chat-ia). */
export function VistaChatRuta() {
  const persona = usePersona()
  const registros = useRegistrosPersona()
  const signos = useSignos()
  const suenos = registros.filter((r) => r.tipo === 'sueno')
  const mentales = registros.filter((r) => r.tipo === 'mental')
  const ultimoSueno = suenos[suenos.length - 1] ?? null
  const ultimoMental = mentales[mentales.length - 1] ?? null
  const contexto = useMemo(
    () => ({ persona, signos, sueno: ultimoSueno, mental: ultimoMental }),
    [persona, signos, ultimoSueno, ultimoMental],
  )
  return <ChatbotIA contexto={contexto} conectorLLM={conectorLLM} />
}

/** Reexporta el puntaje para la vista de dashboard si se necesita. */
export { calcularPuntajeSalud, generarRecomendacionNutricional }
