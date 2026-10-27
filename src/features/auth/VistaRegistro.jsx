/**
 * @fileoverview Vista de registro de usuarios (solo crea rol tripulante).
 * Registro público → inicia sesión. El rol lo impone el servidor.
 * @module features/auth/VistaRegistro
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react'
import { esquemaRegistro } from '../../../shared/esquemaLogin.js'
import { apiRegister } from './api.js'
import { toast } from '../../presentacion/sistema/Tostada.jsx'
import { useTema } from '../../presentacion/sistema/tema.jsx'

/**
 * Vista de registro de usuario.
 * @returns {import('react').JSX.Element} Vista.
 */
export function VistaRegistro() {
  const navigate = useNavigate()
  const { modoEfectivo, alternarModo } = useTema()
  const [mostrar, setMostrar] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(esquemaRegistro) })

  const alEnviar = async (datos) => {
    setError('')
    try {
      await apiRegister(datos)
      toast.success('Cuenta creada', { description: 'Ya puedes iniciar sesión.' })
      navigate('/login', { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-fondo p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta">
            <ArrowLeft size={16} /> Volver al login
          </Link>
          <button type="button" onClick={alternarModo} className="flex h-8 w-8 items-center justify-center rounded-boton border border-borde text-tinta-suave hover:text-tinta" aria-label="Alternar modo">
            {modoEfectivo === 'dark' ? <Eye size={15} /> : <Lock size={15} />}
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primario to-primario-fuerte">
            <UserPlus size={22} className="text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-tinta">Crear cuenta</h1>
          <p className="text-sm text-tinta-suave">Regístrate como tripulante para acceder al sistema de monitoreo.</p>
        </div>

        <form onSubmit={handleSubmit(alEnviar)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="reg-nombre">Nombre</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave" />
              <input id="reg-nombre" autoComplete="name" className="h-11 w-full rounded-boton border border-borde bg-superficie-elevada pl-9 pr-3 text-base text-tinta placeholder:text-tinta-suave focus:outline-none focus:ring-2 focus:ring-primario" placeholder="Tu nombre" {...register('nombre')} />
            </div>
            {errors.nombre && <p className="mt-1 text-xs text-critico">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="reg-email">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave" />
              <input id="reg-email" autoComplete="email" className="h-11 w-full rounded-boton border border-borde bg-superficie-elevada pl-9 pr-3 text-base text-tinta placeholder:text-tinta-suave focus:outline-none focus:ring-2 focus:ring-primario" placeholder="tripulante@ayni.health" {...register('email')} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-critico">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="reg-contrasena">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave" />
              <input id="reg-contrasena" type={mostrar ? 'text' : 'password'} autoComplete="new-password" className="h-11 w-full rounded-boton border border-borde bg-superficie-elevada pl-9 pr-10 text-base text-tinta placeholder:text-tinta-suave focus:outline-none focus:ring-2 focus:ring-primario" placeholder="Mínimo 8 caracteres" {...register('contrasena')} />
              <button type="button" onClick={() => setMostrar((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-tinta-suave hover:text-tinta" aria-label="Mostrar contraseña">
                {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.contrasena && <p className="mt-1 text-xs text-critico">{errors.contrasena.message}</p>}
          </div>

          {error && (
            <p className="rounded-boton border border-critico/40 bg-critico/10 px-3 py-2 text-sm text-critico" role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-boton bg-gradient-to-r from-[#E8894F] to-[#C2603A] text-base font-semibold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60">
            {isSubmitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-tinta-suave">Al crear la cuenta se asigna el rol de tripulante. Un administrador puede asignar otros roles más adelante.</p>
      </div>
    </div>
  )
}
