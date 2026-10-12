/**
 * @fileoverview Componente VistaDesignSystem
 * Ruta temporal (/design-system) que muestra tokens, tipografía y componentes base.
 * @module presentacion/componentes/VistaDesignSystem
 */

import { useState } from 'react'
import { AlertTriangle, Inbox, Moon, Sun } from 'lucide-react'
import { Boton, Tarjeta, Insignia, Entrada, Modal, Esqueleto, EstadoVacio, useTema, toast } from '../sistema/indice.js'

/** Muestras de color para la paleta. */
const MUESTRAS_COLOR = [
  { nombre: 'Fondo', clase: 'bg-fondo' },
  { nombre: 'Superficie', clase: 'bg-superficie' },
  { nombre: 'Superficie elevada', clase: 'bg-superficie-elevada' },
  { nombre: 'Superficie alta', clase: 'bg-superficie-alta' },
  { nombre: 'Primario', clase: 'bg-primario' },
  { nombre: 'Primario fuerte', clase: 'bg-primario-fuerte' },
  { nombre: 'Secundario', clase: 'bg-secundario' },
  { nombre: 'Éxito', clase: 'bg-exito' },
  { nombre: 'Advertencia', clase: 'bg-advertencia' },
  { nombre: 'Crítico', clase: 'bg-critico' },
  { nombre: 'Andino dorado', clase: 'bg-andino-dorado' },
  { nombre: 'Andino terracota', clase: 'bg-andino-terracota' },
]

/** Escala tipográfica. */
const ESCALA_TIPOGRAFICA = [
  { etiqueta: '12px · etiqueta', clase: 'text-xs text-tinta-suave' },
  { etiqueta: '14px · cuerpo', clase: 'text-sm text-tinta' },
  { etiqueta: '16px · base', clase: 'text-base text-tinta' },
  { etiqueta: '20px · subtítulo', clase: 'text-xl font-medium text-tinta' },
  { etiqueta: '24px · título', clase: 'text-2xl font-semibold text-tinta' },
  { etiqueta: '32px · h2', clase: 'text-3xl font-serif font-semibold text-tinta' },
  { etiqueta: '48px · h1', clase: 'text-5xl font-serif font-bold text-tinta' },
]

/**
 * Vista del sistema de diseño.
 * @returns {import('react').JSX.Element} Vista.
 */
export default function VistaDesignSystem() {
  const { tema, alternar } = useTema()
  const [modalAbierto, setModalAbierto] = useState(false)

  return (
    <div className="space-y-10 py-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-5xl font-bold text-tinta">Sistema de Diseño</h1>
          <p className="mt-1 text-tinta-suave">AYNI HEALTH · Tokens, tipografía y componentes base.</p>
        </div>
        <Boton variante="secundario" onClick={alternar}>
          {tema === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </Boton>
      </div>

      {/* Colores */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-tinta">Paleta de color</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MUESTRAS_COLOR.map((c) => (
            <div key={c.nombre} className="rounded-tarjeta border border-borde bg-superficie p-3">
              <div className={`h-14 rounded-boton ${c.clase} border border-borde-fuerte`} />
              <div className="mt-2 text-sm font-medium text-tinta">{c.nombre}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tipografía */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-tinta">Tipografía</h2>
        <div className="rounded-tarjeta border border-borde bg-superficie p-5 space-y-4">
          {ESCALA_TIPOGRAFICA.map((t) => (
            <div key={t.etiqueta} className="flex items-baseline gap-4">
              <span className={`${t.clase}`}>El Cosmos Andino cuida la salud.</span>
              <span className="font-mono text-xs text-tinta-suave">{t.etiqueta}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Botones */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-tinta">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <Boton variante="primario">Primario</Boton>
          <Boton variante="secundario">Secundario</Boton>
          <Boton variante="contorno">Contorno</Boton>
          <Boton variante="fantasma">Fantasma</Boton>
          <Boton variante="exito">Éxito</Boton>
          <Boton variante="peligro">Peligro</Boton>
          <Boton variante="primario" tamaño="icono" aria-label="Botón icono">+</Boton>
          <Boton variante="primario" disabled>Deshabilitado</Boton>
        </div>
      </section>

      {/* Tarjetas e insignias */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-tinta">Tarjetas e insignias</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Tarjeta variante="plano">
            <h3 className="font-medium text-tinta">Tarjeta plana</h3>
            <p className="mt-1 text-sm text-tinta-suave">Sin sombra, borde sutil.</p>
          </Tarjeta>
          <Tarjeta variante="elevado">
            <h3 className="font-medium text-tinta">Tarjeta elevada</h3>
            <p className="mt-1 text-sm text-tinta-suave">Con sombra de elevación.</p>
          </Tarjeta>
          <Tarjeta variante="andino">
            <h3 className="font-medium text-tinta">Tarjeta andina</h3>
            <p className="mt-1 text-sm text-tinta-suave">Borde dorado inca.</p>
          </Tarjeta>
        </div>
        <div className="flex flex-wrap gap-2">
          <Insignia variante="neutro">Neutro</Insignia>
          <Insignia variante="exito" punto>Óptimo</Insignia>
          <Insignia variante="advertencia" punto>Atención</Insignia>
          <Insignia variante="critico" punto>Crítico</Insignia>
          <Insignia variante="primario">Primario</Insignia>
          <Insignia variante="andino">Andino</Insignia>
        </div>
      </section>

      {/* Entradas */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-tinta">Entradas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Entrada placeholder="Campo normal" />
            <Entrada placeholder="Campo con error" error />
            <Entrada placeholder="Deshabilitado" disabled />
          </div>
          <div className="space-y-3">
            <Esqueleto className="h-10 w-full" />
            <Esqueleto className="h-10 w-3/4" />
            <Esqueleto className="h-24 w-full" />
          </div>
        </div>
      </section>

      {/* Estado vacío y acciones */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-tinta">Estados y feedback</h2>
        <Tarjeta variante="plano">
          <EstadoVacio
            icono={<Inbox size={24} />}
            titulo="Sin alertas"
            descripcion="Todo está en orden. Las alertas aparecerán aquí si detectamos un valor anómalo."
            accion={{ etiqueta: 'Revisar salud', alHacerClic: () => toast.success('Todo en orden') }}
          />
        </Tarjeta>
        <div className="flex flex-wrap gap-3">
          <Boton variante="secundario" onClick={() => toast('Notificación simple')}>Toast simple</Boton>
          <Boton variante="exito" onClick={() => toast.success('Medición guardada')}>Toast éxito</Boton>
          <Boton variante="peligro" onClick={() => toast.error('Registro eliminado')}>Toast error</Boton>
          <Boton variante="primario" onClick={() => setModalAbierto(true)}>Abrir modal</Boton>
        </div>
      </section>

      {/* Modal accesible */}
      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Diálogo de ejemplo">
        <p className="text-sm text-tinta-suave">
          Este modal es accesible: atrapa el foco (Tab), se cierra con Escape y restaura el foco al cerrar.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-advertencia-fuerte">
          <AlertTriangle size={16} /> Contenido de demostración.
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
          <Boton variante="primario" onClick={() => setModalAbierto(false)}>Aceptar</Boton>
        </div>
      </Modal>
    </div>
  )
}
