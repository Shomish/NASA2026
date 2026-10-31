/**
 * @fileoverview Módulo de Alertas (servidor). Lista las alertas generadas por los
 * registros, con el nombre del tripulante, y permite marcarlas como leídas o
 * resueltas (médico/administrador). Al cambiar, el badge y la campana se refrescan.
 * @module features/gestion/componentes/VistaAlertas
 */

import { useQuery } from '@tanstack/react-query'
import { Bell, AlertTriangle, AlertCircle, Info, Check, CheckCheck } from 'lucide-react'
import { Esqueleto, EstadoVacio, Tarjeta, Boton } from '../../../presentacion/sistema/indice.js'
import { listarAlertas } from '../api.js'
import { useLeerAlerta, useResolverAlerta } from '../consultas.js'
import { useAlmacenSesion } from '../../auth/almacenSesion.js'

/** Icono por severidad. */
const ICONO_SEVERIDAD = { critica: AlertTriangle, atencion: AlertCircle, info: Info }

/**
 * Módulo de alertas (servidor).
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaAlertas() {
  const usuario = useAlmacenSesion((s) => s.usuario)
  const esMedicoOAdmin = usuario?.rol === 'medico' || usuario?.rol === 'administrador'
  const { data, isLoading, isError } = useQuery({ queryKey: ['alertas'], queryFn: () => listarAlertas(), refetchInterval: 15000 })
  const leer = useLeerAlerta()
  const resolver = useResolverAlerta()

  const alertas = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-tinta">Alertas</h1>
        <p className="text-sm text-tinta-suave">Alertas generadas por datos atípicos en los registros de salud.</p>
      </div>

      {isLoading && <div className="space-y-2"><Esqueleto className="h-14 w-full" /><Esqueleto className="h-14 w-full" /></div>}

      {!isLoading && isError && (
        <EstadoVacio icono={<Bell size={22} />} titulo="No se pudieron cargar las alertas" descripcion="Revisa la conexión con el servidor." />
      )}

      {!isLoading && !isError && alertas.length === 0 && (
        <EstadoVacio icono={<Bell size={22} />} titulo="Sin alertas" descripcion="No hay alertas pendientes." />
      )}

      {!isLoading && !isError && alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a) => {
            const Icono = ICONO_SEVERIDAD[a.severidad] ?? Info
            const activa = a.estado !== 'resuelta'
            return (
              <Tarjeta key={a.id} relleno="compacto" className={!activa ? 'opacity-60' : ''}>
                <div className="flex flex-wrap items-center gap-3">
                  <Icono size={18} className={a.severidad === 'critica' ? 'text-critico' : a.severidad === 'atencion' ? 'text-advertencia-fuerte' : 'text-tinta-suave'} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-tinta">
                      {a.tripulante_nombre ? <span className="font-semibold">{a.tripulante_nombre}: </span> : null}
                      {a.mensaje}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-tinta-suave">
                      {a.severidad} · {a.estado}{a.creado_en ? ` · ${new Date(a.creado_en).toLocaleString('es-PE', { hour12: false })}` : ''}
                    </div>
                  </div>
                  {activa && (
                    <div className="flex gap-2">
                      {a.estado === 'nueva' && (
                        <Boton variante="secundario" tamaño="sm" onClick={() => leer.mutate(a.id)}>
                          <Check size={14} /> Leída
                        </Boton>
                      )}
                      {esMedicoOAdmin && (
                        <Boton variante="exito" tamaño="sm" onClick={() => resolver.mutate(a.id)}>
                          <CheckCheck size={14} /> Resolver
                        </Boton>
                      )}
                    </div>
                  )}
                </div>
              </Tarjeta>
            )
          })}
        </div>
      )}
    </div>
  )
}
