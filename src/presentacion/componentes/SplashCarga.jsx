/**
 * @fileoverview Componente SplashCarga
 * Pantalla de carga inicial con logo y estado, mostrada mientras la aplicación
 * se monta. Evita el "flash" de pantalla vacía durante el arranque.
 * @module presentacion/componentes/SplashCarga
 */

import { Activity } from 'lucide-react'

/**
 * Splash de carga inicial.
 * @returns {import('react').JSX.Element} Splash.
 */
export default function SplashCarga() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] animate-pulse">
        <Activity size={26} className="text-white" />
      </div>
      <div className="text-center space-y-1">
        <div className="font-semibold text-[#F9FAFB] tracking-tight">AYNI HEALTH</div>
        <div className="text-xs font-mono text-[#9CA3AF]">Inicializando monitor autónomo…</div>
      </div>
      <div className="w-32 h-1 rounded-full bg-[#1F2937] overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-violet-500 animate-[pulso_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  )
}
