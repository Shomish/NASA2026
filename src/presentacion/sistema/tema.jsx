/**
 * @fileoverview Proveedor de tema (modo claro/oscuro).
 * Gestiona el atributo `data-theme` en <html> y persiste la preferencia en localStorage.
 * @module presentacion/sistema/tema
 */

import { createContext, useContext, useEffect, useState } from 'react'

/** Clave de localStorage para la preferencia de tema. */
const CLAVE_TEMA = 'ayni-tema'

/** @type {import('react').Context<{tema: 'dark'|'light', alternar: () => void, fijar: (t: 'dark'|'light') => void}>} */
const ContextoTema = createContext({ tema: 'dark', alternar: () => {}, fijar: () => {} })

/**
 * Lee la preferencia de tema guardada (con fallback a oscuro).
 * @returns {'dark' | 'light'} Tema inicial.
 */
function leerTemaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA)
    if (guardado === 'light' || guardado === 'dark') return guardado
  } catch {
    /* localStorage no disponible. */
  }
  return 'dark'
}

/**
 * Proveedor de tema de la aplicación.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.children - Contenido.
 * @returns {import('react').JSX.Element} Proveedor.
 */
export function ProveedorTema({ children }) {
  const [tema, setTema] = useState(leerTemaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      localStorage.setItem(CLAVE_TEMA, tema)
    } catch {
      /* Se ignora si no hay almacenamiento. */
    }
  }, [tema])

  /**
   * Alterna entre claro y oscuro.
   */
  const alternar = () => setTema((t) => (t === 'dark' ? 'light' : 'dark'))

  /**
   * Fija un tema concreto.
   * @param {'dark' | 'light'} nuevoTema - Tema a fijar.
   */
  const fijar = (nuevoTema) => setTema(nuevoTema)

  return <ContextoTema.Provider value={{ tema, alternar, fijar }}>{children}</ContextoTema.Provider>
}

/**
 * Hook para acceder al tema actual y sus controles.
 * @returns {{tema: 'dark'|'light', alternar: () => void, fijar: (t: 'dark'|'light') => void}} Contexto del tema.
 */
export function useTema() {
  return useContext(ContextoTema)
}
