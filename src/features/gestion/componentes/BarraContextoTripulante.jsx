/**
 * @fileoverview Barra de contexto de tripulante.
 * Muestra avatar, nombre, cargo, entorno y día de misión del tripulante activo,
 * con botón "Cambiar" (solo administrador/médico). En móvil se compacta a un chip.
 * Incluye aviso para lectores de pantalla al cambiar (aria-live).
 * @module features/gestion/componentes/BarraContextoTripulante
 */

import { useState } from 'react'
import { Check, ArrowLeftRight, Users } from 'lucide-react'
import { Boton, Modal, Tarjeta } from '../../../presentacion/sistema/indice.js'
import { useContextoTripulante } from '../useContextoTripulante.js'

/**
 * Iniciales de un nombre (máximo 2).
 * @param {string} nombre - Nombre completo.
 * @returns {string} Iniciales en mayúscula.
 */
function iniciales(nombre) {
  return (nombre ?? '')
    .split(' ')
    .map((p) => p.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Barra de contexto de tripulante.
 * @returns {import('react').JSX.Element | null} Barra o null.
 */
export function BarraContextoTripulante() {
  const { esTripulante, tripulantes, tripulanteActivo, sinPerfil, cambiar } = useContextoTripulante()
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  if (sinPerfil) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-tarjeta border border-advertencia/40 bg-advertencia/10 px-4 py-3 text-sm text-tinta" role="status">
        <Users size={16} className="shrink-0 text-advertencia-fuerte" />
        No tienes un perfil de tripulante vinculado. Contacta a un administrador para poder registrar mediciones.
      </div>
    )
  }

  if (!tripulanteActivo) return null

  const seleccionar = (id) => {
    cambiar(String(id))
    setSelectorAbierto(false)
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-tarjeta border border-borde bg-superficie px-3 py-2.5 sm:px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teja to-teja-fuerte text-xs font-semibold text-white">
          {iniciales(tripulanteActivo.nombre)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-tinta" data-testid="contexto-nombre">{tripulanteActivo.nombre}</div>
          <div className="truncate text-xs text-tinta-suave">
            {tripulanteActivo.cargo || 'Tripulante'}
            {tripulanteActivo.mision ? ` · ${tripulanteActivo.mision}` : ''}
            {tripulanteActivo.dia_mision ? ` · Día ${tripulanteActivo.dia_mision}` : ''}
          </div>
        </div>
        {!esTripulante && (
          <Boton variante="secundario" tamaño="sm" onClick={() => setSelectorAbierto(true)} aria-label="Cambiar tripulante">
            <ArrowLeftRight size={14} /> <span className="hidden sm:inline">Cambiar</span>
          </Boton>
        )}
        <span className="sr-only" aria-live="polite">{`Ahora estás viendo a ${tripulanteActivo.nombre}`}</span>
      </div>

      {selectorAbierto && (
        <Modal abierto alCerrar={() => setSelectorAbierto(false)} titulo="Cambiar tripulante" tituloId="cambiar-tripulante-titulo">
          <div className="space-y-2">
            {tripulantes.map((t) => {
              const activo = String(t.id) === String(tripulanteActivo.id)
              return (
                <Tarjeta key={t.id} relleno="compacto" className={activo ? 'border-primario' : ''}>
                  <button type="button" onClick={() => seleccionar(t.id)} className="flex w-full items-center gap-3 text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-superficie-alta text-xs font-semibold text-tinta">{iniciales(t.nombre)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-tinta">{t.nombre}</div>
                      <div className="truncate text-xs text-tinta-suave">{t.cargo || 'Tripulante'}</div>
                    </div>
                    {activo && <Check size={16} className="shrink-0 text-primario" />}
                  </button>
                </Tarjeta>
              )
            })}
          </div>
        </Modal>
      )}
    </>
  )
}
