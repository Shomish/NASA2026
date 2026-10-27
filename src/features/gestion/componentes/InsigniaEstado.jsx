/**
 * @fileoverview Insignias semánticas con icono + texto para estados y roles.
 * @module features/gestion/componentes/InsigniaEstado
 */

import { Clock, CheckCircle2, Lock, UserCog, Stethoscope, User, Ban } from 'lucide-react'
import { Insignia } from '../../../presentacion/sistema/indice.js'

/** Configuración de estado de registro. */
const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente', variante: 'advertencia', icono: Clock },
  validado: { etiqueta: 'Validado', variante: 'exito', icono: CheckCircle2 },
  cerrado: { etiqueta: 'Cerrado', variante: 'neutro', icono: Lock },
}

/** Configuración de rol. */
const ROLES = {
  administrador: { etiqueta: 'Administrador', variante: 'primario', icono: UserCog },
  medico: { etiqueta: 'Médico', variante: 'andino', icono: Stethoscope },
  tripulante: { etiqueta: 'Tripulante', variante: 'neutro', icono: User },
}

/**
 * Insignia de estado de registro.
 * @param {object} props - Propiedades.
 * @param {string} props.estado - Estado (pendiente|validado|cerrado).
 * @returns {import('react').JSX.Element} Insignia.
 */
export function InsigniaEstado({ estado }) {
  const conf = ESTADOS[estado] ?? { etiqueta: estado, variante: 'neutro', icono: Clock }
  const Icono = conf.icono
  return (
    <Insignia variante={conf.variante}>
      <Icono size={13} /> {conf.etiqueta}
    </Insignia>
  )
}

/**
 * Insignia de rol.
 * @param {object} props - Propiedades.
 * @param {string} props.rol - Rol.
 * @returns {import('react').JSX.Element} Insignia.
 */
export function InsigniaRol({ rol }) {
  const conf = ROLES[rol] ?? { etiqueta: rol, variante: 'neutro', icono: User }
  const Icono = conf.icono
  return (
    <Insignia variante={conf.variante}>
      <Icono size={13} /> {conf.etiqueta}
    </Insignia>
  )
}

/**
 * Insignia de activo/inactivo.
 * @param {object} props - Propiedades.
 * @param {boolean} props.activo - Si está activo.
 * @returns {import('react').JSX.Element} Insignia.
 */
export function InsigniaActivo({ activo }) {
  return activo ? (
    <Insignia variante="exito" punto>Activo</Insignia>
  ) : (
    <Insignia variante="neutro">
      <Ban size={13} /> Inactivo
    </Insignia>
  )
}
