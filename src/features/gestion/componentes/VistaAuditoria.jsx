/**
 * @fileoverview Pantalla de auditoría (solo administrador).
 * Lista las acciones auditadas con filtros por usuario, acción y rango de fechas.
 * @module features/gestion/componentes/VistaAuditoria
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { Esqueleto, EstadoVacio, Tarjeta } from '../../../presentacion/sistema/indice.js'
import { listarAuditoria } from '../api.js'

/**
 * Vista de auditoría.
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaAuditoria() {
  const [accion, setAccion] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auditoria', { accion, desde, hasta }],
    queryFn: () => listarAuditoria({ accion, desde, hasta }),
  })

  const registros = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-tinta">Auditoría</h1>
        <p className="text-sm text-tinta-suave">Registro de acciones del sistema (crear, validar, cerrar, cambiar rol…).</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="a-accion">Acción</label>
          <input id="a-accion" className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta" value={accion} onChange={(e) => setAccion(e.target.value)} placeholder="crear, validar…" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="a-desde">Desde</label>
          <input id="a-desde" type="date" className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="a-hasta">Hasta</label>
          <input id="a-hasta" type="date" className="h-9 rounded-boton border border-borde bg-superficie px-2 text-sm text-tinta" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      {isLoading && <div className="space-y-2"><Esqueleto className="h-12 w-full" /><Esqueleto className="h-12 w-full" /></div>}

      {!isLoading && isError && (
        <EstadoVacio icono={<ScrollText size={22} />} titulo="No se pudo cargar la auditoría" descripcion="Revisa la conexión con el servidor." />
      )}

      {!isLoading && !isError && registros.length === 0 && (
        <EstadoVacio icono={<ScrollText size={22} />} titulo="Sin registros" descripcion="No hay acciones que coincidan con los filtros." />
      )}

      {!isLoading && !isError && registros.length > 0 && (
        <Tarjeta relleno="ninguno">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-tinta-suave">
                  <th className="px-4 py-2 font-medium">Acción</th>
                  <th className="px-4 py-2 font-medium">Entidad</th>
                  <th className="px-4 py-2 font-medium">Usuario</th>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((a) => (
                  <tr key={a.id} className="border-b border-borde/60 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-tinta">{a.accion}</td>
                    <td className="px-4 py-2 text-tinta">{a.entidad}{a.entidad_id ? ` #${a.entidad_id}` : ''}</td>
                    <td className="px-4 py-2 text-tinta-suave">{a.usuario_id ?? '—'}</td>
                    <td className="px-4 py-2 text-tinta-suave">{a.creado_en ? new Date(a.creado_en).toLocaleString('es-PE', { hour12: false }) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      )}
    </div>
  )
}
