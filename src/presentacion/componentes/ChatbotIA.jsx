/**
 * @fileoverview Componente ChatbotIA
 * Asistente de IA interactivo (chat) contextual al perfil y datos del astronauta.
 * @module presentacion/componentes/ChatbotIA
 */

import { useEffect, useRef, useState } from 'react'
import { Bot, Send, User } from 'lucide-react'
import { Tarjeta } from './UtilidadesUi.jsx'
import { responderChatbot } from '../../aplicacion/indice.js'
import { calcularIMC } from '../../dominio/indice.js'

/**
 * Chatbot de IA interactivo.
 * @param {object} props - Propiedades.
 * @param {object} props.contexto - Contexto (persona, signos, sueno, mental, nutricion).
 * @param {import('../../infraestructura/indice.js').ConectorLLM} props.conectorLLM - Conector LLM opcional.
 * @returns {import('react').JSX.Element} Chatbot.
 */
export default function ChatbotIA({ contexto, conectorLLM }) {
  const [mensajes, setMensajes] = useState([
    {
      rol: 'bot',
      texto: `Hola ${contexto.persona?.nombre ?? 'tripulante'}. Soy tu médico de IA. Pregúntame por tu salud, nutrición, sueño o riesgos.`,
    },
  ])
  const [entrada, setEntrada] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [enLinea, setEnLinea] = useState(false)
  const finRef = useRef(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, escribiendo])

  // Verifica si el proveedor de IA está disponible en el servidor.
  useEffect(() => {
    let activo = true
    conectorLLM?.disponible().then((disponible) => {
      if (activo) setEnLinea(disponible)
    })
    return () => {
      activo = false
    }
  }, [conectorLLM])

  /**
   * Construye el contexto textual para el LLM.
   */
  const construirContexto = () => {
    const { persona, signos } = contexto
    return JSON.stringify(
      {
        nombre: persona?.nombre,
        rol: persona?.rol,
        edad: persona?.edad,
        pesoKg: persona?.pesoKg,
        imc: persona ? calcularIMC(persona.pesoKg, persona.alturaCm) : null,
        condiciones: persona?.condiciones,
        alergias: persona?.alergias,
        objetivoSalud: persona?.objetivoSalud,
        signosVitales: signos,
      },
      null,
      2,
    )
  }

  /**
   * Envía un mensaje y obtiene la respuesta.
   */
  const enviar = async () => {
    const texto = entrada.trim()
    if (!texto) return
    setMensajes((m) => [...m, { rol: 'usuario', texto }])
    setEntrada('')
    setEscribiendo(true)

    let respuesta = null
    if (enLinea) {
      respuesta = await conectorLLM.consultar(texto, construirContexto())
    }
    if (!respuesta) {
      respuesta = responderChatbot(texto, contexto)
    }

    setEscribiendo(false)
    setMensajes((m) => [...m, { rol: 'bot', texto: respuesta }])
  }

  return (
    <Tarjeta clase="p-5 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primario/20 border border-primario/30 flex items-center justify-center text-primario">
          <Bot size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-tinta leading-tight">Médico de IA</h3>
          <p className="text-xs font-mono text-tinta-suave">
            {enLinea ? 'LLM en la nube · en línea' : 'Motor local · offline'}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-3 rounded-xl text-sm ${
                m.rol === 'usuario'
                  ? 'bg-primario text-white'
                  : 'bg-superficie-alta text-tinta border border-borde'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {m.rol === 'bot' ? <Bot size={12} className="text-primario" /> : <User size={12} />}
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                  {m.rol === 'bot' ? 'IA' : 'Tú'}
                </span>
              </div>
              {m.texto}
            </div>
          </div>
        ))}
        {escribiendo && (
          <div className="flex items-center gap-2 text-tinta-suave text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Analizando...
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          className="flex-1 bg-superficie-alta border border-borde rounded-xl px-3 py-2.5 text-sm text-tinta outline-none focus:border-primario"
          placeholder="Pregunta: ¿cómo está mi salud?"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
        />
        <button
          type="button"
          onClick={enviar}
          className="px-3 rounded-xl bg-primario hover:bg-primario-fuerte text-white flex items-center"
        >
          <Send size={16} />
        </button>
      </div>
    </Tarjeta>
  )
}
