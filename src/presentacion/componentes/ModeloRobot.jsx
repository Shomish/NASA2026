/**
 * @fileoverview Modelo 3D del avatar de "Mi cuerpo".
 * Carga three.js/GLTFLoader de forma diferida y cae a un aviso si no hay WebGL.
 * @module presentacion/componentes/ModeloRobot
 */

import { useEffect, useRef, useState } from 'react'
import { PersonStanding } from 'lucide-react'

const RUTA_MODELO = `${import.meta.env.BASE_URL}models/cute_home_robot.glb`

/**
 * Visor 3D del modelo GLB.
 * @param {object} props - Propiedades.
 * @param {string} [props.className] - Clases del contenedor.
 * @returns {import('react').JSX.Element} Visor.
 */
export default function ModeloRobot({ className = '' }) {
  const contenedorRef = useRef(null)
  const [estado, setEstado] = useState('cargando')
  const [progreso, setProgreso] = useState(0)

  useEffect(() => {
    let cancelado = false
    let renderer
    let mixer
    let frame
    let control
    let resizeObserver
    const contenedor = contenedorRef.current
    if (!contenedor) return undefined

    const ajustar = () => {
      if (!renderer) return
      const ancho = contenedor.clientWidth
      const alto = contenedor.clientHeight
      if (!ancho || !alto) return
      renderer.setSize(ancho, alto, false)
      const camara = renderer.__camara
      if (camara) {
        camara.aspect = ancho / alto
        camara.updateProjectionMatrix()
      }
    }

    const iniciar = async () => {
      try {
        const canvasPrueba = document.createElement('canvas')
        const gl = canvasPrueba.getContext('webgl2') || canvasPrueba.getContext('webgl')
        if (!gl) throw new Error('WebGL no disponible')

        const THREE = await import('three')
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
        if (cancelado) return

        const escena = new THREE.Scene()
        const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
        camara.position.set(0, 1.9, 6.2)

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.__camara = camara
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.setClearColor(0x000000, 0)
        contenedor.appendChild(renderer.domElement)
        renderer.domElement.setAttribute('aria-label', 'Modelo 3D del cuerpo')
        renderer.domElement.setAttribute('role', 'img')

        escena.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 2.2))
        const luz = new THREE.DirectionalLight(0xffffff, 2.4)
        luz.position.set(4, 7, 6)
        escena.add(luz)
        const relleno = new THREE.DirectionalLight(0xffffff, 0.8)
        relleno.position.set(-4, 3, -4)
        escena.add(relleno)

        const cargador = new GLTFLoader()
        const gltf = await new Promise((resolver, rechazar) => {
          cargador.load(
            RUTA_MODELO,
            resolver,
            (evento) => {
              if (evento.total) setProgreso(Math.round((evento.loaded / evento.total) * 100))
            },
            rechazar,
          )
        })
        if (cancelado) return

        const modelo = gltf.scene
        modelo.traverse((hijo) => {
          if (hijo.name?.toLowerCase().includes('suelo') || hijo.name === 'Cylinder001') hijo.visible = false
        })

        const caja = new THREE.Box3().setFromObject(modelo)
        const tamano = caja.getSize(new THREE.Vector3())
        const escala = 2.5 / tamano.y
        modelo.scale.setScalar(escala)
        const cajaEscalada = new THREE.Box3().setFromObject(modelo)
        const centro = cajaEscalada.getCenter(new THREE.Vector3())
        modelo.position.x -= centro.x
        modelo.position.z -= centro.z
        modelo.position.y -= cajaEscalada.min.y
        escena.add(modelo)

        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(modelo)
          mixer.clipAction(gltf.animations[0]).play()
        }

        control = new OrbitControls(camara, renderer.domElement)
        control.target.set(0, 1.2, 0)
        control.enablePan = false
        control.enableDamping = true
        control.autoRotate = true
        control.autoRotateSpeed = 1.1
        control.minDistance = 3.8
        control.maxDistance = 9
        control.minPolarAngle = Math.PI * 0.25
        control.maxPolarAngle = Math.PI * 0.72
        control.update()

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(ajustar)
          resizeObserver.observe(contenedor)
        } else {
          window.addEventListener('resize', ajustar)
        }
        ajustar()

        const reloj = new THREE.Clock()
        const animar = () => {
          if (cancelado) return
          frame = requestAnimationFrame(animar)
          const delta = reloj.getDelta()
          mixer?.update(delta)
          control.update()
          renderer.render(escena, camara)
        }
        animar()
        setEstado('listo')
      } catch {
        if (!cancelado) setEstado('error')
      }
    }

    iniciar()

    return () => {
      cancelado = true
      if (frame) cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', ajustar)
      control?.dispose()
      renderer?.dispose()
      if (renderer?.domElement?.parentElement === contenedor) contenedor.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div ref={contenedorRef} className="h-full w-full [&>canvas]:h-full [&>canvas]:w-full" />
      {estado === 'cargando' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-superficie-alta/60 text-xs text-tinta-suave">
          <PersonStanding size={28} className="animate-pulse text-primario" />
          Cargando modelo 3D… {progreso > 0 ? `${progreso}%` : ''}
        </div>
      )}
      {estado === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-superficie-alta/60 px-6 text-center text-xs text-tinta-suave">
          <PersonStanding size={28} className="text-primario" />
          Vista 3D no disponible en este navegador. Puedes seleccionar los sistemas en la lista.
        </div>
      )}
    </div>
  )
}
