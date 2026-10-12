/**
 * @fileoverview Componente EditorTema
 * Permite seleccionar paleta, modo y editar colores clave con vista previa
 * en vivo, medidor de contraste WCAG AA, restablecer y exportar/importar JSON.
 * @module presentacion/sistema/EditorTema
 */

import { useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Check, Download, RotateCcw, Upload, X } from 'lucide-react'
import { useTema } from './tema.jsx'
import { Boton } from './Boton.jsx'
import { cn } from './cn.js'
import { contrasteWCAG, rgbAHex, hexARgb } from './temas/contraste.js'

/** Colores editables del editor. */
const CAMPOS_EDITABLES = [
  { clave: 'primario', etiqueta: 'Primario (teja)' },
  { clave: 'secundario', etiqueta: 'Secundario (dorado)' },
  { clave: 'acento', etiqueta: 'Acento (turquesa)' },
]

/**
 * Editor de tema del sistema de diseño.
 * @returns {import('react').JSX.Element} Editor.
 */
export function EditorTema() {
  const {
    paleta,
    modo,
    temas,
    tema,
    personalizado,
    fijarPaleta,
    fijarModo,
    aplicarPersonalizado,
    restablecerPersonalizado,
  } = useTema()

  const [campoActivo, setCampoActivo] = useState(null)
  const inputArchivo = useRef(null)

  const tokensActuales = { ...tema[modo === 'sistema' ? 'oscuro' : modo], ...personalizado }
  const textoContraste = contrasteWCAG(rgbAHex(tokensActuales.tinta), rgbAHex(tokensActuales.fondo))
  const primarioContraste = contrasteWCAG(rgbAHex(tokensActuales.primario), rgbAHex(tokensActuales.fondo))

  /**
   * Aplica un color editado (hex) a un token.
   * @param {string} clave - Token.
   * @param {string} hex - Color hexadecimal.
   */
  const cambiarColor = (clave, hex) => {
    aplicarPersonalizado({ [clave]: hexARgb(hex) })
  }

  /**
   * Obtiene el color hex actual de un token.
   * @param {string} clave - Token.
   * @returns {string} Color hexadecimal.
   */
  const colorActual = (clave) => rgbAHex(tokensActuales[clave])

  /**
   * Exporta el tema actual como JSON.
   */
  const exportarTema = () => {
    const datos = { paleta, modo, personalizado }
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `tema-ayni-${paleta}.json`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(url)
  }

  /**
   * Importa un tema desde un archivo JSON.
   * @param {import('react').ChangeEvent<HTMLInputElement>} evento - Evento de archivo.
   */
  const importarTema = async (evento) => {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    try {
      const datos = JSON.parse(await archivo.text())
      if (datos.paleta) fijarPaleta(datos.paleta)
      if (datos.modo) fijarModo(datos.modo)
      if (datos.personalizado && typeof datos.personalizado === 'object') {
        aplicarPersonalizado(datos.personalizado)
      }
    } catch {
      /* JSON inválido. */
    }
  }

  return (
    <div className="space-y-5">
      {/* Selector de paleta */}
      <div>
        <div className="mb-2 text-sm font-medium text-tinta">Paleta</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {temas.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => fijarPaleta(t.id)}
              className={cn(
                'rounded-tarjeta border p-3 text-left transition-colors',
                paleta === t.id ? 'border-primario bg-superficie-alta' : 'border-borde bg-superficie hover:border-borde-fuerte',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full" style={{ background: rgbAHex(t.oscuro.primario) }} />
                <span className="font-medium text-tinta">{t.nombre}</span>
              </div>
              <p className="mt-1 text-xs text-tinta-suave">{t.descripcion}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selector de modo */}
      <div>
        <div className="mb-2 text-sm font-medium text-tinta">Modo</div>
        <div className="flex gap-2">
          {['claro', 'oscuro', 'sistema'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => fijarModo(m)}
              className={cn(
                'min-h-[44px] rounded-boton border px-4 text-sm font-medium capitalize transition-colors',
                modo === m ? 'border-primario bg-primario/10 text-primario' : 'border-borde text-tinta-suave',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Selectores de color */}
      <div>
        <div className="mb-2 text-sm font-medium text-tinta">Colores editables</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {CAMPOS_EDITABLES.map((campo) => (
            <div key={campo.clave} className="rounded-tarjeta border border-borde bg-superficie p-3">
              <button
                type="button"
                onClick={() => setCampoActivo(campoActivo === campo.clave ? null : campo.clave)}
                className="flex w-full items-center gap-2 text-sm"
              >
                <span className="h-6 w-6 rounded-insignia border border-borde-fuerte" style={{ background: colorActual(campo.clave) }} />
                <span className="font-medium text-tinta">{campo.etiqueta}</span>
              </button>
              {campoActivo === campo.clave && (
                <div className="mt-3">
                  <HexColorPicker color={colorActual(campo.clave)} onChange={(hex) => cambiarColor(campo.clave, hex)} />
                  <button
                    type="button"
                    onClick={() => setCampoActivo(null)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-tinta-suave hover:text-tinta"
                  >
                    <X size={14} /> Cerrar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Medidor de contraste */}
      <div className="rounded-tarjeta border border-borde bg-superficie p-4">
        <div className="mb-2 text-sm font-medium text-tinta">Contraste WCAG AA</div>
        <ul className="space-y-2 text-sm">
          <ContrasteFila etiqueta="Texto sobre fondo" ratio={textoContraste} />
          <ContrasteFila etiqueta="Primario sobre fondo" ratio={primarioContraste} />
        </ul>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Boton variante="secundario" onClick={restablecerPersonalizado}>
          <RotateCcw size={16} /> Restablecer
        </Boton>
        <Boton variante="secundario" onClick={exportarTema}>
          <Download size={16} /> Exportar JSON
        </Boton>
        <Boton variante="secundario" onClick={() => inputArchivo.current?.click()}>
          <Upload size={16} /> Importar JSON
        </Boton>
        <input ref={inputArchivo} type="file" accept="application/json" className="hidden" onChange={importarTema} />
      </div>
    </div>
  )
}

/**
 * Fila del medidor de contraste.
 * @param {object} props - Propiedades.
 * @param {string} props.etiqueta - Etiqueta.
 * @param {number} props.ratio - Ratio de contraste.
 * @returns {import('react').JSX.Element} Fila.
 */
function ContrasteFila({ etiqueta, ratio }) {
  const cumple = ratio >= 4.5
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-tinta-suave">{etiqueta}</span>
      <span className="flex items-center gap-2 font-mono text-sm">
        <span className={cumple ? 'text-exito' : 'text-critico'}>{ratio.toFixed(2)}:1</span>
        {cumple ? <Check size={16} className="text-exito" /> : <X size={16} className="text-critico" />}
      </span>
    </li>
  )
}
