/**
 * @fileoverview Recorrido de bienvenida (onboarding) que explica cada módulo.
 * Se muestra en cada inicio de sesión y guía al astronauta por las secciones
 * principales: Dashboard, Mi cuerpo, Registros, Fundamento y Alertas.
 * @module features/gestion/componentes/Tour
 */

import { useEffect, useState } from 'react'
import { LayoutDashboard, PersonStanding, ClipboardList, BookOpen, Bell } from 'lucide-react'
import { Modal, Boton } from '../../../presentacion/sistema/indice.js'
import { useTraduccion } from '../../../shared/idioma.js'

/** Pasos del recorrido (claves de traducción). */
const PASOS = [
  { icono: LayoutDashboard, titulo: 'tour.p1.titulo', texto: 'tour.p1.texto' },
  { icono: PersonStanding, titulo: 'tour.p2.titulo', texto: 'tour.p2.texto' },
  { icono: ClipboardList, titulo: 'tour.p3.titulo', texto: 'tour.p3.texto' },
  { icono: BookOpen, titulo: 'tour.p4.titulo', texto: 'tour.p4.texto' },
  { icono: Bell, titulo: 'tour.p5.titulo', texto: 'tour.p5.texto' },
]

const CLAVE = 'ayni-tour-visto'

/**
 * Recorrido de bienvenida.
 * @returns {import('react').JSX.Element} Tour.
 */
export function Tour() {
  const [paso, setPaso] = useState(0)
  const [abierto, setAbierto] = useState(false)
  const t = useTraduccion()

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
    <Modal abierto={abierto} alCerrar={cerrar} titulo={t('tour.titulo')} tituloId="tour-titulo">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teja to-teja-fuerte text-white">
            <actual.icono size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-tinta">{t(actual.titulo)}</h3>
            <p className="text-sm text-tinta-suave">{t(actual.texto)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {PASOS.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === paso ? 'bg-primario' : 'bg-borde'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {paso > 0 && <Boton variante="secundario" tamaño="sm" onClick={() => setPaso((p) => p - 1)}>{t('tour.atras')}</Boton>}
            {paso < PASOS.length - 1 ? (
              <Boton tamaño="sm" onClick={() => setPaso((p) => p + 1)}>{t('tour.siguiente')}</Boton>
            ) : (
              <Boton tamaño="sm" onClick={cerrar}>{t('tour.empezar')}</Boton>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
