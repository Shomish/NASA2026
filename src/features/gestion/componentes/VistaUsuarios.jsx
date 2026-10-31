/**
 * @fileoverview Gestión de usuarios (solo administrador).
 * Listar, crear, cambiar rol y desactivar, con confirmación y protección del último administrador.
 * @module features/gestion/componentes/VistaUsuarios
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RotateCcw, ShieldAlert, UserCog } from 'lucide-react'
import { Boton, Entrada, Esqueleto, EstadoVacio, Modal } from '../../../presentacion/sistema/indice.js'
import { useUsuarios, useCrearUsuario, useCambiarRolUsuario, useDesactivarUsuario, useReactivarUsuario } from '../consultas.js'
import { esquemaUsuario } from '../esquemas.js'
import { ConfirmarModal } from './ConfirmarModal.jsx'
import { InsigniaRol, InsigniaActivo } from './InsigniaEstado.jsx'
import { useTraduccion } from '../../../shared/idioma.js'

/** Opciones de rol. */
const ROLES = ['administrador', 'medico', 'tripulante']

/**
 * Formulario de crear usuario (modal).
 * @param {object} props - Propiedades.
 * @param {() => void} props.alCerrar - Cierra el modal.
 */
function FormularioUsuario({ alCerrar }) {
  const crear = useCrearUsuario()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(esquemaUsuario), defaultValues: { rol: 'tripulante' } })

  const alEnviar = async (datos) => {
    await crear.mutateAsync(datos)
    alCerrar()
  }

  return (
    <Modal abierto alCerrar={alCerrar} titulo="Nuevo usuario" tituloId="usuario-form-titulo">
      <form onSubmit={handleSubmit(alEnviar)} className="space-y-3" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="u-nombre">Nombre</label>
          <Entrada id="u-nombre" error={Boolean(errors.nombre)} {...register('nombre')} />
          {errors.nombre && <p className="mt-1 text-xs text-critico">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="u-email">Email</label>
          <Entrada id="u-email" type="email" error={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-critico">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="u-contrasena">Contraseña</label>
          <Entrada id="u-contrasena" type="password" error={Boolean(errors.contrasena)} {...register('contrasena')} />
          {errors.contrasena && <p className="mt-1 text-xs text-critico">{errors.contrasena.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="u-rol">Rol</label>
          <select id="u-rol" className="h-10 w-full rounded-boton border border-borde bg-superficie-elevada px-3 text-sm text-tinta" {...register('rol')}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Boton type="button" variante="secundario" onClick={alCerrar} disabled={crear.isPending}>Cancelar</Boton>
          <Boton type="submit" disabled={crear.isPending}>{crear.isPending ? 'Creando…' : 'Crear'}</Boton>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Vista de gestión de usuarios.
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaUsuarios() {
  const { data, isLoading, isError } = useUsuarios()
  const cambiarRol = useCambiarRolUsuario()
  const desactivar = useDesactivarUsuario()
  const reactivar = useReactivarUsuario()
  const t = useTraduccion()

  const [formAbierto, setFormAbierto] = useState(false)
  const [cambioRol, setCambioRol] = useState(null)
  const [aDesactivar, setADesactivar] = useState(null)

  const usuarios = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-tinta">Usuarios</h1>
          <p className="text-sm text-tinta-suave">Cuentas, roles y estado de acceso.</p>
        </div>
        <Boton variante="primario" onClick={() => setFormAbierto(true)}>
          <Plus size={16} /> Nuevo usuario
        </Boton>
      </div>

      <div className="flex items-center gap-2 rounded-tarjeta border border-andino-dorado/40 bg-andino-dorado/10 px-3 py-2 text-xs text-tinta">
        <ShieldAlert size={15} className="shrink-0 text-andino-dorado" />
        El sistema protege al último administrador activo: no se puede degradar ni desactivar.
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Esqueleto className="h-16 w-full" />
          <Esqueleto className="h-16 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <EstadoVacio icono={<UserCog size={22} />} titulo="No se pudieron cargar los usuarios" descripcion="Revisa la conexión con el servidor." />
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-tinta-suave">
                <th className="px-3 py-2 font-medium">Usuario</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-borde last:border-0">
                  <td className="px-3 py-3">
                    <div className="font-medium text-tinta">{u.nombre}</div>
                    <div className="text-xs text-tinta-suave">{u.email}</div>
                  </td>
                  <td className="px-3 py-3"><InsigniaRol rol={u.rol} /></td>
                  <td className="px-3 py-3"><InsigniaActivo activo={u.activo} /></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="h-8 rounded-boton border border-borde bg-superficie-alta px-2 text-sm text-tinta"
                        value={u.rol}
                        onChange={(e) => setCambioRol({ id: u.id, rol: e.target.value })}
                        aria-label={`Rol de ${u.nombre}`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {u.activo === false ? (
                        <Boton variante="exito" tamaño="sm" onClick={() => reactivar.mutate(u.id)}>
                          <RotateCcw size={14} /> {t('comun.activar')}
                        </Boton>
                      ) : (
                        <Boton variante="peligro" tamaño="sm" onClick={() => setADesactivar(u)}>
                          Desactivar
                        </Boton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formAbierto && <FormularioUsuario alCerrar={() => setFormAbierto(false)} />}

      <ConfirmarModal
        abierto={Boolean(cambioRol)}
        alCancelar={() => setCambioRol(null)}
        alConfirmar={async () => { await cambiarRol.mutateAsync({ id: cambioRol.id, rol: cambioRol.rol }); setCambioRol(null) }}
        titulo="Cambiar rol"
        mensaje="El usuario verá distintos permisos según su nuevo rol."
        confirmando={cambiarRol.isPending}
      />

      <ConfirmarModal
        abierto={Boolean(aDesactivar)}
        alCancelar={() => setADesactivar(null)}
        alConfirmar={async () => { await desactivar.mutateAsync(aDesactivar.id); setADesactivar(null) }}
        titulo="Desactivar usuario"
        mensaje={`Se desactivará la cuenta de ${aDesactivar?.nombre} y perderá el acceso al sistema.`}
        confirmando={desactivar.isPending}
      />
    </div>
  )
}
