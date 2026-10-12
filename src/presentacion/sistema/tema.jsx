/**
 * @fileoverview Proveedor de tema (paleta + modo).
 * Inyecta los tokens del tema seleccionado como variables CSS en <html> y
 * gestiona las preferencias (paleta, modo, personalización) en localStorage.
 * @module presentacion/sistema/tema
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { obtenerTema, temas } from './temas/indice.js'

/** Claves de localStorage. */
const CLAVE_PALETA = 'ayni-paleta'
const CLAVE_MODO = 'ayni-modo'
const CLAVE_PERSONALIZADO = 'ayni-tema-personalizado'

/**
 * Lee un valor de localStorage de forma segura.
 * @param {string} clave - Clave a leer.
 * @param {string} defecto - Valor por defecto.
 * @returns {string} Valor leído o el defecto.
 */
function leer(clave, defecto) {
  try {
    const valor = localStorage.getItem(clave)
    return valor ?? defecto
  } catch {
    return defecto
  }
}

/**
 * Escribe un valor en localStorage de forma segura.
 * @param {string} clave - Clave.
 * @param {string} valor - Valor.
 */
function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, valor)
  } catch {
    /* Almacenamiento no disponible. */
  }
}

/**
 * Lee los tokens personalizados guardados (o un objeto vacío si son inválidos).
 * @returns {Record<string, string>} Overrides de tokens.
 */
function leerPersonalizado() {
  try {
    const crudo = localStorage.getItem(CLAVE_PERSONALIZADO)
    const datos = crudo ? JSON.parse(crudo) : {}
    return datos && typeof datos === 'object' ? datos : {}
  } catch {
    return {}
  }
}

/** @type {import('react').Context<object>} */
const ContextoTema = createContext({})

/**
 * Proveedor de tema de la aplicación.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.children - Contenido.
 * @returns {import('react').JSX.Element} Proveedor.
 */
export function ProveedorTema({ children }) {
  const [paleta, setPaleta] = useState(() => leer(CLAVE_PALETA, 'cusco'))
  const [modo, setModo] = useState(() => leer(CLAVE_MODO, 'oscuro'))
  const [personalizado, setPersonalizado] = useState(leerPersonalizado)
  const [sistemaOscuro, setSistemaOscuro] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  )

  // Escucha los cambios del sistema cuando el modo es "sistema".
  useEffect(() => {
    if (modo !== 'sistema') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const manejar = (evento) => setSistemaOscuro(evento.matches)
    mq.addEventListener('change', manejar)
    return () => mq.removeEventListener('change', manejar)
  }, [modo])

  const modoEfectivo = modo === 'sistema' ? (sistemaOscuro ? 'oscuro' : 'claro') : modo

  // Aplica los tokens del tema (base + personalizados) sobre <html>.
  useEffect(() => {
    const tema = obtenerTema(paleta)
    const tokens = { ...(tema[modoEfectivo] ?? {}), ...personalizado }
    const raiz = document.documentElement
    for (const [clave, valor] of Object.entries(tokens)) {
      raiz.style.setProperty(`--${clave}`, valor)
    }
    raiz.dataset.paleta = paleta
    raiz.dataset.modo = modoEfectivo
  }, [paleta, modoEfectivo, personalizado])

  // Persistencia.
  useEffect(() => guardar(CLAVE_PALETA, paleta), [paleta])
  useEffect(() => guardar(CLAVE_MODO, modo), [modo])
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_PERSONALIZADO, JSON.stringify(personalizado))
    } catch {
      /* Sin almacenamiento. */
    }
  }, [personalizado])

  /**
   * Fija una paleta (y limpia la personalización anterior).
   * @param {string} id - Identificador de la paleta.
   */
  const fijarPaleta = (id) => {
    setPaleta(id)
    setPersonalizado({})
  }

  /**
   * Fija el modo (claro / oscuro / sistema).
   * @param {'claro'|'oscuro'|'sistema'} nuevoModo - Modo.
   */
  const fijarModo = (nuevoModo) => setModo(nuevoModo)

  /**
   * Alterna entre claro y oscuro.
   */
  const alternarModo = () => setModo((m) => (m === 'oscuro' ? 'claro' : 'oscuro'))

  /**
   * Aplica overrides de tokens (editor de tema).
   * @param {Record<string, string>} overrides - Tokens a sobreescribir.
   */
  const aplicarPersonalizado = (overrides) => setPersonalizado((prev) => ({ ...prev, ...overrides }))

  /**
   * Restablece los tokens personalizados.
   */
  const restablecerPersonalizado = () => setPersonalizado({})

  const valor = {
    paleta,
    modo,
    modoEfectivo,
    tema: obtenerTema(paleta),
    temas,
    personalizado,
    fijarPaleta,
    fijarModo,
    alternarModo,
    aplicarPersonalizado,
    restablecerPersonalizado,
  }

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
}

/**
 * Hook para acceder al tema actual y sus controles.
 * @returns {object} Contexto del tema.
 */
export function useTema() {
  return useContext(ContextoTema)
}
