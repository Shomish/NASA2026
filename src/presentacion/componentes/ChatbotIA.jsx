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
import { useTraduccion } from '../../shared/idioma.js'
import { useAlmacenSesion } from '../../features/auth/almacenSesion.js'
import { PROTOCOLO_EMERGENCIA, detectarEmergencia } from '../../../shared/emergencia.js'
import { crearAlertaEmergencia } from '../../features/gestion/api.js'
import { encolar } from '../../features/gestion/outbox.js'

/**
 * Chatbot de IA interactivo.
 * @param {object} props - Propiedades.
 * @param {object} props.contexto - Contexto (persona, signos, sueno, mental, nutricion).
 * @param {import('../../infraestructura/indice.js').ConectorLLM} props.conectorLLM - Conector LLM opcional.
 * @returns {import('react').JSX.Element} Chatbot.
 */
export default function ChatbotIA({ contexto, conectorLLM }) {
  const t = useTraduccion()
  const usuario = useAlmacenSesion((s) => s.usuario)
  // Nombre a usar: el tripulante activo o, en su defecto, quien inició sesión.
  const nombreMostrado = contexto.persona?.nombre ?? usuario?.nombre ?? 'tripulante'
  const [mensajes, setMensajes] = useState([
    {
      rol: 'bot',
      texto: t('chat.saludo', { nombre: nombreMostrado }),
    },
  ])
  const [entrada, setEntrada] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [enLinea, setEnLinea] = useState(false)
  const [nubeDisponible, setNubeDisponible] = useState(false)
  const finRef = useRef(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, escribiendo])

  // Verifica si el proveedor de IA está disponible en el servidor.
  useEffect(() => {
    let activo = true
    conectorLLM?.disponible().then((disponible) => {
      if (activo) {
        setNubeDisponible(disponible)
        // Si no hay nube disponible, arranca en modo local (offline) de forma explícita.
        if (!disponible) setEnLinea(false)
      }
    })
    return () => {
      activo = false
    }
  }, [conectorLLM])

  /**
   * Alterna entre el motor en la nube (Gemini) y el motor local.
   * Al activar la nube se registra el consentimiento; al desactivarla se revoca.
   */
  const alternarMotor = async () => {
    if (!enLinea) {
      if (!nubeDisponible) return
      const aceptado = await conectorLLM?.fijarConsentimiento(true)
      if (aceptado) setEnLinea(true)
    } else {
      await conectorLLM?.fijarConsentimiento(false)
      setEnLinea(false)
    }
  }

  /**
   * Construye el contexto textual para el LLM.
   */
  const construirContexto = () => {
    const { persona, signos } = contexto
    return {
      nombre: persona?.nombre,
      rol: persona?.rol,
      edad: persona?.edad,
      pesoKg: persona?.pesoKg,
      imc: persona ? calcularIMC(persona.pesoKg, persona.alturaCm) : null,
      condiciones: persona?.condiciones,
      alergias: persona?.alergias,
      objetivoSalud: persona?.objetivoSalud,
      signosVitales: signos,
    }
  }

  /**
   * Registra una alerta de emergencia: API si hay conexión, outbox si no.
   * @param {{motivos: string[]}} emergencia - Resultado de la detección.
   */
  const registrarEmergencia = async (emergencia) => {
    const tripulanteId = Number(contexto.persona?.id)
    if (!Number.isFinite(tripulanteId)) return
    const mensaje = `Posible emergencia en el chat: ${emergencia.motivos.join(', ')}`.slice(0, 255)
    try {
      if (typeof navigator === 'undefined' || !navigator.onLine) throw new Error('sin conexión')
      await crearAlertaEmergencia({ tripulante_id: tripulanteId, mensaje })
    } catch {
      await encolar('crear_alerta', { tripulante_id: tripulanteId, mensaje })
    }
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

    const emergencia = detectarEmergencia(texto, contexto.signos ?? {})
    if (emergencia.emergencia) {
      let respuesta = PROTOCOLO_EMERGENCIA
      if (enLinea) {
        const respuestaServidor = await conectorLLM.consultar(texto, construirContexto())
        if (respuestaServidor) respuesta = respuestaServidor
        else await registrarEmergencia(emergencia)
      } else {
        await registrarEmergencia(emergencia)
      }
      setEscribiendo(false)
      setMensajes((m) => [...m, { rol: 'bot', texto: respuesta }])
      return
    }

    let respuesta = null
    if (enLinea) {
      respuesta = await conectorLLM.consultar(texto, construirContexto())
    }
    if (!respuesta) {
      // Contexto efectivo: si no hay tripulante, usa el nombre de quien inició sesión.
      const contextoEfectivo = contexto.persona
        ? contexto
        : { ...contexto, persona: { nombre: nombreMostrado } }
      respuesta = responderChatbot(texto, contextoEfectivo)
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
        <div className="flex-1">
          <h3 className="font-semibold text-tinta leading-tight">{t('chat.titulo')}</h3>
          <p className="text-xs font-mono text-tinta-suave">
            {nombreMostrado !== 'tripulante' ? `${t('chat.trabajando')} ${nombreMostrado}` : t('chat.sinTripulante')} · {enLinea ? t('chat.motorNube') : t('chat.motorLocal')}
          </p>
        </div>
        <button
          type="button"
          onClick={alternarMotor}
          disabled={!enLinea && !nubeDisponible}
          title={nubeDisponible ? undefined : t('chat.nubeNoConfigurada')}
          className="rounded-boton border border-borde px-2.5 py-1.5 text-xs text-tinta-suave hover:text-tinta disabled:opacity-50"
          aria-label="Cambiar motor"
        >
          {enLinea ? t('chat.usarLocal') : nubeDisponible ? t('chat.usarNube') : t('chat.nubeNoConfigurada')}
        </button>
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
                  {m.rol === 'bot' ? 'IA' : t('chat.tu')}
                </span>
              </div>
              {m.texto}
            </div>
          </div>
        ))}
        {escribiendo && (
          <div className="flex items-center gap-2 text-tinta-suave text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            {t('chat.analizando')}
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          className="flex-1 bg-superficie-alta border border-borde rounded-xl px-3 py-2.5 text-sm text-tinta outline-none focus:border-primario"
          placeholder={t('chat.placeholder')}
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
