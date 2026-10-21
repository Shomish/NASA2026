/**
 * @fileoverview Componente de partículas estelares (tsParticles).
 * Carga diferida y desactivada con prefers-reduced-motion o en móviles de gama baja.
 * @module features/auth/ParticulasEstelares
 */

import { useCallback } from 'react'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

/**
 * Configuración de partículas (campo de estrellas lento).
 */
const opciones = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 45, density: { enable: true, area: 800 } },
    color: { value: '#F7F1E8' },
    opacity: { value: { min: 0.15, max: 0.5 } },
    size: { value: { min: 0.5, max: 1.5 } },
    move: { enable: true, speed: 0.25, direction: 'none', random: true },
  },
  detectRetina: true,
}

/**
 * Campo de estrellas (tsParticles).
 * @returns {import('react').JSX.Element} Partículas.
 */
export default function ParticulasEstelares() {
  const iniciar = useCallback(async (engine) => {
    await loadSlim(engine)
  }, [])

  return <Particles id="particulas-login" init={iniciar} options={opciones} className="absolute inset-0" />
}
