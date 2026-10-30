/**
 * @fileoverview Recorrido de bienvenida (onboarding) que explica cada módulo.
 * Se muestra una sola vez (flag en localStorage) y guía al astronauta por las
 * secciones principales: Dashboard, Mi cuerpo, Registros, Fundamento y Alertas.
 * @module features/gestion/componentes/Tour
 */

import { useEffect, useState } from 'react'
import { LayoutDashboard, PersonStanding, ClipboardList, BookOpen, Bell } from 'lucide-react'
import { Modal, Boton } from '../../../presentacion/sistema/indice.js'

/** Pasos del recorrido. */
const PASOS = [
  { icono: LayoutDashboard, titulo: 'Dashboard', texto: 'Aquí ves un resumen de tu salud: signos vitales, sueño, ánimo y alertas. Es tu punto de partida cada día.' },
  { icono: PersonStanding, titulo: 'Mi cuerpo', texto: 'Toca cada parte de la figura humana para entender qué mide cada región y si está en buen estado.' },
  { icono: ClipboardList, titulo: 'Registros', texto: 'Aquí registras tus mediciones (signos, glucosa, sueño, ánimo…). El sistema las compara con los rangos de referencia.' },
  { icono: BookOpen, titulo: 'Fundamento científico', texto: 'Explica en lenguaje simple los cinco peligros del espacio y la guía de cada indicador.' },
  { icono: Bell, titulo: 'Alertas', texto: 'Cuando algo está fuera de rango verás una alerta (rojo = avisar al médico). La campana muestra las alertas recientes.' },
]

const CLAVE = 'ayni-tour-visto'

/**
 * Recorrido de bienvenida.
 * @returns {import('react').JSX.Element} Tour.
 */
export function Tour() {
  const [paso, setPaso] = useState(0)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    try {
      // No se muestra en entornos automatizados (Playwright/WebDriver).
      if (localStorage.getItem(CLAVE) !== '1' && !navigator.webdriver) setAbierto(true)
    } catch {
      /* sin almacenamiento */
    }
  }, [])

  const cerrar = () => {
    try { localStorage.setItem(CLAVE, '1') } catch { /* */ }
    setAbierto(false)
  }

  const actual = PASOS[paso]

  return (
    <Modal abierto={abierto} alCerrar={cerrar} titulo="Bienvenido a AYNI HEALTH" tituloId="tour-titulo">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teja to-teja-fuerte text-white">
            <actual.icono size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-tinta">{actual.titulo}</h3>
            <p className="text-sm text-tinta-suave">{actual.texto}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {PASOS.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === paso ? 'bg-primario' : 'bg-borde'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {paso > 0 && <Boton variante="secundario" tamaño="sm" onClick={() => setPaso((p) => p - 1)}>Atrás</Boton>}
            {paso < PASOS.length - 1 ? (
              <Boton tamaño="sm" onClick={() => setPaso((p) => p + 1)}>Siguiente</Boton>
            ) : (
              <Boton tamaño="sm" onClick={cerrar}>Empezar</Boton>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
