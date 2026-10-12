/**
 * @fileoverview Componente VistaDesignSystem
 * Ruta temporal (/design-system) con paletas, editor de tema, componentes base y móviles,
 * y un conmutador de viewport para probar el diseño responsive.
 * @module presentacion/componentes/VistaDesignSystem
 */

import { useState } from 'react'
import { AlertTriangle, Inbox, Moon, Plus, Sun, User, Users, Utensils, HeartPulse, LayoutDashboard } from 'lucide-react'
import {
  Boton,
  Tarjeta,
  Insignia,
  Entrada,
  Modal,
  Esqueleto,
  EstadoVacio,
  useTema,
  toast,
  EditorTema,
  SelectorSegmentado,
  TarjetaTabla,
  BarraInferior,
  BotonFlotante,
  HojaInferior,
  Drawer,
} from '../sistema/indice.js'

/** Muestras de color para la paleta. */
const MUESTRAS_COLOR = [
  { nombre: 'Fondo', clase: 'bg-fondo' },
  { nombre: 'Superficie', clase: 'bg-superficie' },
  { nombre: 'Primario', clase: 'bg-primario' },
  { nombre: 'Secundario', clase: 'bg-secundario' },
  { nombre: 'Acento', clase: 'bg-acento' },
  { nombre: 'Éxito', clase: 'bg-exito' },
  { nombre: 'Advertencia', clase: 'bg-advertencia' },
  { nombre: 'Crítico', clase: 'bg-critico' },
  { nombre: 'Andino dorado', clase: 'bg-andino-dorado' },
  { nombre: 'Andino terracota', clase: 'bg-andino-terracota' },
]

/** Escala tipográfica. */
const ESCALA_TIPOGRAFICA = [
  { etiqueta: '12px', clase: 'text-xs text-tinta-suave' },
  { etiqueta: '14px', clase: 'text-sm text-tinta' },
  { etiqueta: '16px', clase: 'text-base text-tinta' },
  { etiqueta: '24px', clase: 'text-2xl font-semibold text-tinta' },
  { etiqueta: '32px serif', clase: 'text-3xl font-serif font-semibold text-tinta' },
  { etiqueta: '48px serif', clase: 'text-5xl font-serif font-bold text-tinta' },
]

/** Viewports de prueba. */
const VIEWPORTS = [
  { id: '360', ancho: 360, etiqueta: '360' },
  { id: '390', ancho: 390, etiqueta: '390' },
  { id: '768', ancho: 768, etiqueta: '768' },
  { id: '1280', ancho: 1280, etiqueta: '1280' },
  { id: 'completo', ancho: null, etiqueta: 'Completo' },
]

/**
 * Vista del sistema de diseño.
 * @returns {import('react').JSX.Element} Vista.
 */
export default function VistaDesignSystem() {
  const { modoEfectivo, alternarModo } = useTema()
  const [viewport, setViewport] = useState('completo')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [segmento, setSegmento] = useState('7')

  const anchoViewport = VIEWPORTS.find((v) => v.id === viewport)?.ancho

  return (
    <div className="space-y-10 py-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-5xl font-bold text-tinta">Sistema de Diseño</h1>
          <p className="mt-1 text-tinta-suave">AYNI HEALTH · Paletas, componentes y mobile-first.</p>
        </div>
        <Boton variante="secundario" onClick={alternarModo}>
          {modoEfectivo === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {modoEfectivo === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </Boton>
      </div>

      {/* Editor de tema */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-tinta">Editor de tema</h2>
        <EditorTema />
      </section>

      {/* Conmutador de viewport */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-tinta">Vista previa responsive</h2>
          <SelectorSegmentado
            opciones={VIEWPORTS.map((v) => ({ valor: v.id, etiqueta: v.etiqueta }))}
            valor={viewport}
            alCambiar={setViewport}
          />
        </div>

        {/* Contenedor con ancho de viewport */}
        <div
          className="mx-auto overflow-hidden rounded-tarjeta border border-borde bg-fondo p-4 transition-all"
          style={{ maxWidth: anchoViewport ?? '100%' }}
        >
          <div className="space-y-8">
            {/* Colores */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {MUESTRAS_COLOR.map((c) => (
                <div key={c.nombre} className="rounded-tarjeta border border-borde bg-superficie p-2">
                  <div className={`h-10 rounded-boton ${c.clase} border border-borde-fuerte`} />
                  <div className="mt-1 text-xs font-medium text-tinta">{c.nombre}</div>
                </div>
              ))}
            </div>

            {/* Tipografía */}
            <div className="rounded-tarjeta border border-borde bg-superficie p-4 space-y-3">
              {ESCALA_TIPOGRAFICA.map((t) => (
                <div key={t.etiqueta} className="flex items-baseline gap-3">
                  <span className={t.clase}>El Cosmos Andino cuida la salud.</span>
                  <span className="font-mono text-xs text-tinta-suave">{t.etiqueta}</span>
                </div>
              ))}
            </div>

            {/* Botones */}
            <div className="flex flex-wrap gap-2">
              <Boton variante="primario">Primario</Boton>
              <Boton variante="secundario">Secundario</Boton>
              <Boton variante="contorno">Contorno</Boton>
              <Boton variante="exito">Éxito</Boton>
              <Boton variante="peligro">Peligro</Boton>
            </div>

            {/* Insignias con icono + texto (regla de accesibilidad) */}
            <div className="flex flex-wrap gap-2">
              <Insignia variante="exito" punto><HeartPulse size={13} /> Óptimo</Insignia>
              <Insignia variante="advertencia" punto><AlertTriangle size={13} /> Atención</Insignia>
              <Insignia variante="critico" punto><AlertTriangle size={13} /> Crítico</Insignia>
            </div>

            {/* Entradas */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Entrada placeholder="Campo normal" />
              <Entrada placeholder="Campo con error" error />
            </div>

            {/* Selector segmentado */}
            <SelectorSegmentado
              opciones={[
                { valor: '7', etiqueta: '7 días' },
                { valor: '30', etiqueta: '30 días' },
                { valor: '60', etiqueta: '60 días' },
              ]}
              valor={segmento}
              alCambiar={setSegmento}
            />

            {/* Tabla móvil */}
            <TarjetaTabla
              columnas={[
                { clave: 'fecha', etiqueta: 'Fecha' },
                { clave: 'tipo', etiqueta: 'Tipo' },
                { clave: 'valor', etiqueta: 'Valor' },
              ]}
              filas={[
                { fecha: '12/10/2026', tipo: 'Signos', valor: 'FC 72 lpm' },
                { fecha: '11/10/2026', tipo: 'Sueño', valor: '8h · calidad 8' },
              ]}
            />

            {/* Esqueleto */}
            <Esqueleto className="h-10 w-full" />

            {/* Estado vacío */}
            <Tarjeta variante="plano">
              <EstadoVacio
                icono={<Inbox size={24} />}
                titulo="Sin alertas"
                descripcion="Todo en orden."
                accion={{ etiqueta: 'Revisar', alHacerClic: () => toast.success('Listo') }}
              />
            </Tarjeta>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pb-16">
              <Boton variante="secundario" onClick={() => setHojaAbierta(true)}>Hoja inferior</Boton>
              <Boton variante="secundario" onClick={() => setDrawerAbierto(true)}>Drawer lateral</Boton>
              <Boton variante="primario" onClick={() => setModalAbierto(true)}>Modal</Boton>
              <Boton variante="exito" onClick={() => toast.success('Medición guardada')}>Toast</Boton>
            </div>
          </div>
        </div>
      </section>

      {/* Demostración de barra inferior (en viewport móvil) */}
      {anchoViewport && anchoViewport < 768 && (
        <div className="relative h-24 rounded-tarjeta border border-borde bg-fondo">
          <BarraInferior
            activo="inicio"
            alCambiar={() => {}}
            destinos={[
              { id: 'inicio', etiqueta: 'Inicio', icono: <LayoutDashboard size={20} /> },
              { id: 'monitor', etiqueta: 'Monitor', icono: <HeartPulse size={20} /> },
              { id: 'registrar', etiqueta: 'Registrar', icono: <Plus size={24} />, destacado: true },
              { id: 'nutricion', etiqueta: 'Nutrición', icono: <Utensils size={20} /> },
              { id: 'mas', etiqueta: 'Más', icono: <Users size={20} /> },
            ]}
          />
        </div>
      )}

      {/* FAB de demostración */}
      <BotonFlotante icono={<Plus size={24} />} etiqueta="Registrar medición" alHacerClic={() => toast('FAB')} />

      {/* Hoja inferior */}
      <HojaInferior abierto={hojaAbierta} alCerrar={() => setHojaAbierta(false)} titulo="Filtros">
        <div className="space-y-3">
          <Entrada placeholder="Buscar tripulante" />
          <SelectorSegmentado
            opciones={[
              { valor: 'todos', etiqueta: 'Todos' },
              { valor: 'signos', etiqueta: 'Signos' },
            ]}
            valor="todos"
            alCambiar={() => {}}
          />
          <Boton variante="primario" onClick={() => setHojaAbierta(false)}>Aplicar</Boton>
        </div>
      </HojaInferior>

      {/* Drawer lateral */}
      <Drawer abierto={drawerAbierto} alCerrar={() => setDrawerAbierto(false)} titulo="AYNI HEALTH">
        <div className="space-y-2">
          {['Dashboard', 'Monitor', 'Tripulación', 'Nutrición'].map((item) => (
            <button key={item} type="button" className="flex w-full items-center gap-2 rounded-boton px-3 py-2 text-sm text-tinta hover:bg-superficie-alta">
              <User size={16} /> {item}
            </button>
          ))}
        </div>
      </Drawer>

      {/* Modal accesible */}
      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Diálogo de ejemplo">
        <p className="text-sm text-tinta-suave">Modal accesible con focus-trap, Escape y restauración de foco.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
          <Boton variante="primario" onClick={() => setModalAbierto(false)}>Aceptar</Boton>
        </div>
      </Modal>
    </div>
  )
}
