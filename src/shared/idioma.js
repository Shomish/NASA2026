/**
 * @fileoverview Internacionalización mínima (es/en).
 * Guarda el idioma en localStorage y expone `t()` para los textos clave.
 * La traducción completa de la aplicación es una iteración posterior; aquí se
 * deja la infraestructura y las cadenas más visibles (landing).
 * @module shared/idioma
 */

import { create } from 'zustand'

/** Traducciones de las cadenas visibles de la landing. */
const TRADUCCIONES = {
  es: {
    'landing.titulo': 'Tu salud, evaluada por ti,',
    'landing.subtitulo': 'incluso sin conexión.',
    'landing.descripcion': 'Una herramienta visual para que los astronautas evalúen su propia salud durante misiones largas: entiende los cinco peligros del vuelo espacial, registra tus indicadores y recibe guía para cuidarte.',
    'landing.entrar': 'Entrar al sistema',
    'landing.crear': 'Crear cuenta',
    'landing.queHace': 'Qué hace AYNI HEALTH',
  },
  en: {
    'landing.titulo': 'Assess your own health,',
    'landing.subtitulo': 'even offline.',
    'landing.descripcion': 'A visual tool for astronauts to assess their own health during long missions: understand the five hazards of spaceflight, log your indicators and get guidance to stay healthy.',
    'landing.entrar': 'Enter the system',
    'landing.crear': 'Create account',
    'landing.queHace': 'What AYNI HEALTH does',
  },
}

const IDIOMAS = ['es', 'en']

/**
 * Store de idioma.
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<object>>}
 */
export const useIdioma = create((set) => ({
  idioma: (() => { try { return localStorage.getItem('ayni-idioma') === 'en' ? 'en' : 'es' } catch { return 'es' } })(),
  fijarIdioma: (idioma) => {
    try { localStorage.setItem('ayni-idioma', idioma) } catch { /* */ }
    set({ idioma })
  },
}))

/** Idiomas disponibles. */
export { IDIOMAS }

/**
 * Traduce una clave según el idioma actual.
 * @param {string} clave - Clave de traducción.
 * @returns {string} Texto traducido.
 */
export function t(clave) {
  const idioma = useIdioma.getState().idioma
  return TRADUCCIONES[idioma]?.[clave] ?? TRADUCCIONES.es[clave] ?? clave
}
