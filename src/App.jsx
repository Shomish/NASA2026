/**
 * @fileoverview Componente raíz de la aplicación.
 * Estado central: tripulación múltiple, historial con CRUD y persistencia.
 * @module App
 */

import { useEffect, useMemo, useState } from 'react'
import NavegacionPrincipal from './presentacion/componentes/NavegacionPrincipal.jsx'
import VistaPresentacion from './presentacion/componentes/VistaPresentacion.jsx'
import VistaMonitor from './presentacion/componentes/VistaMonitor.jsx'
import VistaTripulacion from './presentacion/componentes/VistaTripulacion.jsx'
import { tripulacionInicial } from './datos/mockDatos.js'
import { AdaptadorAlmacenamiento, AdaptadorApi, ConectorLLM, generarId } from './infraestructura/indice.js'
import { evaluarSignoVital } from './dominio/indice.js'

/** Historial inicial de demostración. */
function historialInicial() {
  const ahora = Date.now()
  const dia = 86400000
  return [
    { id: generarId(), personaId: 'ana-quispe', tipo: 'signo', signoTipo: 'frecuencia_cardiaca', valor: 72, instante: new Date(ahora - 2 * dia).toISOString() },
    { id: generarId(), personaId: 'ana-quispe', tipo: 'signo', signoTipo: 'saturacion_oxigeno', valor: 97, instante: new Date(ahora - 2 * dia).toISOString() },
    { id: generarId(), personaId: 'ana-quispe', tipo: 'sueno', horas: 8, calidad: 8, interrupciones: 1, instante: new Date(ahora - 1 * dia).toISOString() },
    { id: generarId(), personaId: 'ana-quispe', tipo: 'mental', cuestionario: 'phq9', puntaje: 4, instante: new Date(ahora - 1 * dia).toISOString() },
    { id: generarId(), personaId: 'diego-mamani', tipo: 'signo', signoTipo: 'saturacion_oxigeno', valor: 96, instante: new Date(ahora - 1 * dia).toISOString() },
  ]
}

/**
 * Componente principal.
 * @returns {import('react').JSX.Element} Árbol de componentes.
 */
export default function App() {
  const [vista, setVista] = useState('presentacion')
  const [tripulacion, setTripulacion] = useState(tripulacionInicial)
  const [personaId, setPersonaId] = useState('ana-quispe')
  const [historial, setHistorial] = useState(historialInicial)

  const almacenamiento = useMemo(() => new AdaptadorAlmacenamiento(), [])
  const api = useMemo(() => new AdaptadorApi(), [])
  const conectorLLM = useMemo(() => new ConectorLLM(), [])

  // Carga inicial desde IndexedDB.
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const [tripulacionGuardada, historialGuardado] = await Promise.all([
          almacenamiento.obtenerTodos('tripulacion'),
          almacenamiento.obtenerTodos('historial'),
        ])
        if (!activo) return
        if (tripulacionGuardada?.length) setTripulacion(tripulacionGuardada)
        if (historialGuardado?.length) setHistorial(historialGuardado)
      } catch {
        /* Conserva datos de demostración. */
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [almacenamiento])

  // Persistencia de la tripulación.
  useEffect(() => {
    tripulacion.forEach((p) => almacenamiento.guardar('tripulacion', p).catch(() => {}))
  }, [tripulacion, almacenamiento])

  // Persistencia del historial (último registro).
  useEffect(() => {
    if (historial.length === 0) return
    const ultimo = historial[historial.length - 1]
    almacenamiento.guardar('historial', ultimo).catch(() => {})
  }, [historial, almacenamiento])

  const persona = useMemo(() => tripulacion.find((p) => p.id === personaId) ?? tripulacion[0] ?? null, [tripulacion, personaId])

  const registrosPersona = useMemo(
    () => historial.filter((r) => r.personaId === personaId).sort((a, b) => new Date(a.instante) - new Date(b.instante)),
    [historial, personaId],
  )

  const signos = useMemo(() => {
    const resultado = {}
    for (const r of registrosPersona) {
      if (r.tipo === 'signo') resultado[r.signoTipo] = r.valor
    }
    return resultado
  }, [registrosPersona])

  /* ==================== CRUD de tripulación ==================== */

  const guardarPersona = (datos) => {
    setTripulacion((anterior) => {
      const existe = anterior.some((p) => p.id === datos.id)
      return existe ? anterior.map((p) => (p.id === datos.id ? { ...p, ...datos } : p)) : [...anterior, datos]
    })
    setPersonaId(datos.id)
  }

  const eliminarPersona = (id) => {
    setTripulacion((anterior) => anterior.filter((p) => p.id !== id))
    setHistorial((anterior) => anterior.filter((r) => r.personaId !== id))
    if (personaId === id) setPersonaId(tripulacion.find((p) => p.id !== id)?.id ?? '')
  }

  /* ==================== CRUD de registros ==================== */

  const agregarRegistro = (registro) => {
    const nuevo = { id: generarId(), personaId, instante: new Date().toISOString(), ...registro }
    setHistorial((anterior) => [...anterior, nuevo])

    // Genera alerta si es un signo crítico.
    if (registro.tipo === 'signo') {
      const estado = evaluarSignoVital(registro.signoTipo, registro.valor)
      if (estado === 'critico') {
        const alerta = {
          id: generarId(),
          personaId,
          tipo: 'alerta',
          severidad: 'critico',
          mensaje: `Signo vital crítico: ${registro.signoTipo} = ${registro.valor}`,
          leida: false,
          instante: new Date().toISOString(),
        }
        setHistorial((anterior) => [...anterior, alerta])
      }
    }

    // Sincroniza signos al backend.
    if (registro.tipo === 'signo') {
      api.guardarRegistro({ ...signos, [registro.signoTipo]: registro.valor }).catch(() => {})
    }
  }

  const eliminarRegistro = (id) => {
    setHistorial((anterior) => anterior.filter((r) => r.id !== id))
  }

  const marcarAlertaLeida = (id) => {
    setHistorial((anterior) =>
      anterior.map((r) => (r.id === id && r.tipo === 'alerta' ? { ...r, leida: true } : r)),
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <NavegacionPrincipal vistaActiva={vista} alCambiarVista={setVista} />

      <main className="flex-1 relative z-10 px-4 py-8 max-w-[1600px] w-full mx-auto">
        {vista === 'presentacion' && <VistaPresentacion alIniciarSimulacion={() => setVista('monitor')} />}

        {vista === 'tripulacion' && (
          <VistaTripulacion
            tripulacion={tripulacion}
            personaId={personaId}
            alSeleccionar={setPersonaId}
            alGuardar={guardarPersona}
            alEliminar={eliminarPersona}
          />
        )}

        {vista === 'monitor' && (
          <VistaMonitor
            persona={persona}
            signos={signos}
            registros={registrosPersona}
            tripulacion={tripulacion}
            alSeleccionar={setPersonaId}
            alAgregar={agregarRegistro}
            alEliminar={eliminarRegistro}
            alMarcarAlertaLeida={marcarAlertaLeida}
            conectorLLM={conectorLLM}
          />
        )}
      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950/90">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-xs text-neutral-500 font-mono">
          <span className="text-neutral-400">AYNI HEALTH · Monitor Autónomo de Salud</span>
          <span className="ml-auto">Análogo terrestre: Cusco, Perú · NASA Space Apps Challenge 2026</span>
        </div>
      </footer>
    </div>
  )
}
