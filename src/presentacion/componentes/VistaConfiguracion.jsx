/**
 * @fileoverview Vista Configuración.
 * Perfil, tema (paleta/modo), umbrales clínicos editables y gestión de usuarios.
 * @module presentacion/componentes/VistaConfiguracion
 */

import { useState, useEffect } from 'react'
import { ShieldCheck, User, Palette, SlidersHorizontal, Users, Bot, KeyRound } from 'lucide-react'
import { useTema } from '../sistema/tema.jsx'
import { useAlmacenSesion } from '../../features/auth/almacenSesion.js'
import { Boton, Entrada, Tarjeta, Insignia } from '../sistema/indice.js'
import { RANGOS_SIGNO_VITAL } from '../../dominio/indice.js'
import { toast } from '../sistema/Tostada.jsx'
import { obtenerConfigIA, actualizarConfigIA } from '../../features/gestion/api.js'

/**
 * Vista de configuración.
 * @returns {import('react').JSX.Element} Configuración.
 */
export default function VistaConfiguracion() {
  const { temas, paleta, fijarPaleta, modo, fijarModo } = useTema()
  const usuario = useAlmacenSesion((s) => s.usuario)
  const [umbrales, setUmbrales] = useState(
    Object.fromEntries(Object.entries(RANGOS_SIGNO_VITAL).map(([k, v]) => [k, { min: v.normalMin, max: v.normalMax }])),
  )

  // Configuración de IA.
  const [iaActivo, setIaActivo] = useState(false)
  const [iaProveedor, setIaProveedor] = useState('gemini')
  const [iaModelo, setIaModelo] = useState('gemini-flash-latest')
  const [iaClave, setIaClave] = useState('')
  const [iaUrlBase, setIaUrlBase] = useState('')
  const [iaConfigurada, setIaConfigurada] = useState(false)
  const [guardandoIA, setGuardandoIA] = useState(false)

  useEffect(() => {
    obtenerConfigIA()
      .then((c) => {
        setIaActivo(Boolean(c?.activo))
        setIaProveedor(c?.proveedor === 'openai' ? 'openai' : 'gemini')
        setIaModelo(c?.modelo ?? 'gemini-flash-latest')
        setIaUrlBase(c?.url_base ?? '')
        setIaConfigurada(Boolean(c?.clave_configurada))
      })
      .catch(() => {})
  }, [])

  /** Al cambiar de proveedor, sugiere el modelo y la URL por defecto. */
  const cambiarProveedor = (prov) => {
    setIaProveedor(prov)
    if (prov === 'openai') {
      if (!iaModelo || iaModelo.startsWith('gemini')) setIaModelo('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free')
      if (!iaUrlBase) setIaUrlBase('https://openrouter.ai/api/v1')
    } else {
      if (!iaModelo || iaModelo.includes('/')) setIaModelo('gemini-flash-latest')
      setIaUrlBase('')
    }
  }

  const guardarIA = async () => {
    setGuardandoIA(true)
    try {
      const resultado = await actualizarConfigIA({ activo: iaActivo, proveedor: iaProveedor, modelo: iaModelo, clave_api: iaClave, url_base: iaUrlBase })
      setIaConfigurada(Boolean(resultado?.clave_configurada))
      setIaClave('')
      toast.success(resultado?.activo ? 'IA activada.' : 'Configuración de IA guardada.')
    } catch (e) {
      toast.error(e.message ?? 'No se pudo guardar la configuración.')
    } finally {
      setGuardandoIA(false)
    }
  }

  /**
   * Actualiza un umbral clínico.
   * @param {string} clave - Signo vital.
   * @param {'min' | 'max'} extremo - Mínimo o máximo.
   * @param {string} valor - Nuevo valor.
   */
  const actualizarUmbral = (clave, extremo, valor) => {
    setUmbrales((prev) => ({ ...prev, [clave]: { ...prev[clave], [extremo]: Number(valor) } }))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-bold">Configuración</h1>
        <p className="text-tinta-suave">Gestiona tu perfil, apariencia y parámetros del sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Perfil */}
        <Tarjeta variante="elevado">
          <div className="mb-3 flex items-center gap-2 font-semibold"><User size={18} className="text-primario" /> Perfil</div>
          <div className="space-y-3">
            <Entrada defaultValue={usuario?.nombre ?? 'Ana Quispe'} disabled />
            <Entrada defaultValue={usuario?.username ?? 'admin'} disabled />
            <div className="flex items-center gap-2">
              <span className="text-sm text-tinta-suave">Rol:</span>
              <Insignia variante="primario">{usuario?.rol ?? 'administrador'}</Insignia>
            </div>
          </div>
        </Tarjeta>

        {/* Tema */}
        <Tarjeta variante="elevado">
          <div className="mb-3 flex items-center gap-2 font-semibold"><Palette size={18} className="text-primario" /> Apariencia</div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-tinta-suave">Paleta</label>
              <div className="flex gap-2">
                {temas.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => fijarPaleta(t.id)}
                    className={`rounded-boton border px-3 py-2 text-sm ${paleta === t.id ? 'border-primario bg-primario/10 text-primario' : 'border-borde text-tinta-suave'}`}
                  >
                    {t.nombre}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-tinta-suave">Modo</label>
              <div className="flex gap-2">
                {['claro', 'oscuro', 'sistema'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => fijarModo(m)}
                    className={`rounded-boton border px-3 py-2 text-sm capitalize ${modo === m ? 'border-primario bg-primario/10 text-primario' : 'border-borde text-tinta-suave'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Tarjeta>
      </div>

      {/* Umbrales clínicos */}
      <Tarjeta variante="elevado">
        <div className="mb-3 flex items-center gap-2 font-semibold"><SlidersHorizontal size={18} className="text-primario" /> Umbrales clínicos (administrador)</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(RANGOS_SIGNO_VITAL).map(([clave, rango]) => (
            <div key={clave} className="rounded-boton border border-borde p-3">
              <div className="mb-1 text-sm text-tinta">{rango.etiqueta}</div>
              <div className="flex items-center gap-2">
                <Entrada type="number" defaultValue={umbrales[clave].min} onChange={(e) => actualizarUmbral(clave, 'min', e.target.value)} />
                <span className="text-tinta-suave">–</span>
                <Entrada type="number" defaultValue={umbrales[clave].max} onChange={(e) => actualizarUmbral(clave, 'max', e.target.value)} />
                <span className="font-mono text-xs text-tinta-suave">{rango.unidad}</span>
              </div>
            </div>
          ))}
        </div>
        <Boton variante="primario" className="mt-3" onClick={() => toast.success('Umbrales guardados')}>Guardar umbrales</Boton>
      </Tarjeta>

      {/* Médico de IA */}
      <Tarjeta variante="elevado">
        <div className="mb-1 flex items-center gap-2 font-semibold"><Bot size={18} className="text-primario" /> Médico de IA</div>
        <p className="mb-3 text-xs text-tinta-suave">Elige el proveedor de IA y el modelo. La clave se guarda solo en el servidor.</p>
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-sm text-tinta-suave">Proveedor</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => cambiarProveedor('gemini')}
                className={`rounded-boton border px-3 py-2 text-sm ${iaProveedor === 'gemini' ? 'border-primario bg-primario/10 text-primario' : 'border-borde text-tinta-suave'}`}
              >
                Google AI Studio (Gemini)
              </button>
              <button
                type="button"
                onClick={() => cambiarProveedor('openai')}
                className={`rounded-boton border px-3 py-2 text-sm ${iaProveedor === 'openai' ? 'border-primario bg-primario/10 text-primario' : 'border-borde text-tinta-suave'}`}
              >
                OpenRouter
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-tinta">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-borde"
              checked={iaActivo}
              onChange={(e) => setIaActivo(e.target.checked)}
            />
            Activar IA en la nube
          </label>

          <div>
            <label className="mb-1 block text-sm text-tinta-suave">Modelo</label>
            <input
              list="modelos-ia"
              className="h-10 w-full rounded-boton border border-borde bg-superficie-elevada px-3 text-sm text-tinta"
              value={iaModelo}
              onChange={(e) => setIaModelo(e.target.value)}
              placeholder="gemini-flash-latest"
            />
            <datalist id="modelos-ia">
              <option value="gemini-flash-latest" />
              <option value="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" />
              <option value="meta-llama/llama-3.3-70b-instruct" />
              <option value="meta-llama/llama-3.3-70b-instruct:free" />
              <option value="google/gemma-4-31b-it:free" />
              
              <option value="llama-3.3-70b-versatile" />
            </datalist>
          </div>

          <div>
            <label className="mb-1 block text-sm text-tinta-suave">URL base (OpenRouter/Groq; vacío para Gemini)</label>
            <Entrada value={iaUrlBase} onChange={(e) => setIaUrlBase(e.target.value)} placeholder="https://openrouter.ai/api/v1" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-sm text-tinta-suave"><KeyRound size={13} /> Clave de API {iaConfigurada ? '(ya configurada)' : '(vacía)'}</label>
            <Entrada type="password" value={iaClave} onChange={(e) => setIaClave(e.target.value)} placeholder="Pega la clave del proveedor" />
          </div>
          <Boton variante="primario" onClick={guardarIA} disabled={guardandoIA}>
            {guardandoIA ? 'Guardando…' : 'Guardar IA'}
          </Boton>
        </div>
      </Tarjeta>

      {/* Usuarios y roles */}
      <Tarjeta variante="elevado">
        <div className="mb-3 flex items-center gap-2 font-semibold"><Users size={18} className="text-primario" /> Usuarios y roles</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-borde text-tinta-suave">
                <th className="py-2 pr-3 font-normal">Usuario</th>
                <th className="py-2 pr-3 font-normal">Nombre</th>
                <th className="py-2 font-normal">Rol</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-borde">
                <td className="py-2 pr-3 font-mono">admin</td>
                <td className="py-2 pr-3">Administrador</td>
                <td className="py-2"><Insignia variante="primario"><ShieldCheck size={12} /> administrador</Insignia></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-tinta-suave">La gestión completa de usuarios (crear/editar/eliminar) llega en la Fase 10 con la base de datos.</p>
      </Tarjeta>
    </div>
  )
}
