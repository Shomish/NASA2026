/**
 * @fileoverview Mapa corporal 3D con marcadores por sistema (modelo astronauta).
 * Basado en el prototipo AYNI HEALTH; usa three.js de forma diferida.
 * @module presentacion/componentes/MapaCorporal3D
 */

import { useEffect, useRef, useState } from 'react'
import { PersonStanding } from 'lucide-react'

const RUTA_MODELO = `${import.meta.env.BASE_URL}models/astronauta_body_map.glb`

/** Regiones y anclas calibradas para astronauta_body_map.glb. */
const REGIONES_3D = [
  { id: 'cerebro', nombre: 'Cerebro · salud mental', corto: 'Cerebro', anclas: [{ xf: 0, yf: 0.895 }] },
  { id: 'corazon', nombre: 'Corazón · cardiovascular', corto: 'Corazón', anclas: [{ xf: 0.04, yf: 0.635 }] },
  { id: 'pulmones', nombre: 'Pulmones · respiratorio', corto: 'Pulmones', anclas: [{ xf: -0.095, yf: 0.70 }, { xf: 0.095, yf: 0.70 }] },
  { id: 'musculos', nombre: 'Huesos y músculos · actividad', corto: 'Huesos/músculos', anclas: [{ xf: -0.30, yf: 0.73 }, { xf: 0.11, yf: 0.22 }] },
  { id: 'inmune', nombre: 'Sistema inmune · síntomas', corto: 'Inmune', anclas: [{ xf: 0, yf: 0.50 }] },
]

/** Estados visuales y colores numéricos (sin hex CSS). */
const ESTADOS_3D = {
  optimo: { color: 0x3fa37a, clase: 'bg-exito text-white', texto: 'Estable' },
  atencion: { color: 0xe0a23f, clase: 'bg-advertencia text-fondo', texto: 'Atención' },
  critico: { color: 0xdc2626, clase: 'bg-critico text-white', texto: 'Crítico' },
  'sin-datos': { color: 0x6b7280, clase: 'bg-tinta-suave text-fondo', texto: 'Sin datos' },
}

/** Normaliza un estado desconocido a "sin-datos". */
const estadoSeguro = (valor) => (ESTADOS_3D[valor] ? valor : 'sin-datos')

/**
 * Visor 3D del mapa corporal.
 * @param {object} props - Propiedades.
 * @param {Record<string, string>} props.estados - Estado por id de región.
 * @param {string|null} props.seleccionada - Región seleccionada.
 * @param {(id: string|null) => void} props.alSeleccionar - Callback de selección.
 * @returns {import('react').JSX.Element} Visor.
 */
export default function MapaCorporal3D({ estados = {}, seleccionada = null, alSeleccionar }) {
  const contenedorRef = useRef(null)
  const actualizarRef = useRef(null)
  const vistaRef = useRef(null)
  const estadosRef = useRef(estados)
  const seleccionadaRef = useRef(seleccionada)
  const alSeleccionarRef = useRef(alSeleccionar)
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    estadosRef.current = estados
  }, [estados])

  useEffect(() => {
    seleccionadaRef.current = seleccionada
  }, [seleccionada])

  useEffect(() => {
    alSeleccionarRef.current = alSeleccionar
  }, [alSeleccionar])

  useEffect(() => {
    actualizarRef.current?.()
  }, [estados, seleccionada])

  useEffect(() => {
    let cancelado = false
    let renderer
    let css2d
    let controls
    let frame
    let resizeObserver
    let ajustarGlobal
    let modelo = null
    const patches = []
    const labels = []
    const contenedor = contenedorRef.current
    if (!contenedor) return undefined

    const iniciar = async () => {
      try {
        const canvasPrueba = document.createElement('canvas')
        const gl = canvasPrueba.getContext('webgl2') || canvasPrueba.getContext('webgl')
        if (!gl) throw new Error('WebGL no disponible')

        const THREE = await import('three')
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
        const { CSS2DRenderer, CSS2DObject } = await import('three/examples/jsm/renderers/CSS2DRenderer.js')
        if (cancelado) return

        const escena = new THREE.Scene()
        const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.setAttribute('aria-label', 'Mapa corporal 3D del astronauta')
        renderer.domElement.setAttribute('role', 'img')
        contenedor.appendChild(renderer.domElement)

        css2d = new CSS2DRenderer()
        Object.assign(css2d.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' })
        contenedor.appendChild(css2d.domElement)

        escena.add(new THREE.HemisphereLight(0xffffff, 0x3a4350, 1.6))
        const sol = new THREE.DirectionalLight(0xffffff, 1.6)
        sol.position.set(2, 3, 4)
        escena.add(sol)
        const relleno = new THREE.DirectionalLight(0xffffff, 0.8)
        relleno.position.set(-2, 1, -4)
        escena.add(relleno)

        controls = new OrbitControls(camara, renderer.domElement)
        controls.enableDamping = true
        controls.enablePan = false
        controls.autoRotate = false

        const caja = new THREE.Box3()
        const tamano = new THREE.Vector3()
        let fitDist = 5

        const calcFit = () => {
          const fov = THREE.MathUtils.degToRad(camara.fov)
          const dh = (tamano.y / 2) / Math.tan(fov / 2)
          const hfov = 2 * Math.atan(Math.tan(fov / 2) * camara.aspect)
          const dw = (tamano.x / 2) / Math.tan(hfov / 2)
          return Math.max(dh, dw) * 1.2 + tamano.z / 2
        }

        const limites = () => {
          controls.minDistance = fitDist * 0.45
          controls.maxDistance = fitDist * 1.6
        }

        const setView = (lado = 'front') => {
          camara.position.set(0, 0, lado === 'back' ? -fitDist : fitDist)
          controls.target.set(0, 0, 0)
          controls.update()
        }
        vistaRef.current = setView

        const ajustar = () => {
          const ancho = contenedor.clientWidth
          const alto = contenedor.clientHeight
          if (!ancho || !alto) return
          renderer.setSize(ancho, alto)
          css2d.setSize(ancho, alto)
          camara.aspect = ancho / alto
          camara.updateProjectionMatrix()
          if (modelo) {
            const nuevo = calcFit()
            camara.position.multiplyScalar(nuevo / fitDist)
            fitDist = nuevo
            limites()
            controls.update()
          }
        }

        ajustarGlobal = ajustar

        const draco = new DRACOLoader()
        draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
        const loader = new GLTFLoader()
        loader.setDRACOLoader(draco)
        const gltf = await new Promise((resolver, rechazar) => {
          loader.load(RUTA_MODELO, resolver, undefined, rechazar)
        })
        draco.dispose()
        if (cancelado) return

        modelo = gltf.scene
        const cajaInicial = new THREE.Box3().setFromObject(modelo)
        const tamanoInicial = cajaInicial.getSize(new THREE.Vector3())
        modelo.scale.setScalar(2 / tamanoInicial.y)
        modelo.updateMatrixWorld(true)
        modelo.position.sub(new THREE.Box3().setFromObject(modelo).getCenter(new THREE.Vector3()))
        escena.add(modelo)
        modelo.updateMatrixWorld(true)
        caja.setFromObject(modelo)
        caja.getSize(tamano)

        const objetivos = []
        modelo.traverse((objeto) => {
          if (objeto.isMesh) objetivos.push(objeto)
        })
        const raycaster = new THREE.Raycaster()
        const cx = (caja.min.x + caja.max.x) / 2

        const crearMarcadores = () => {
          for (const region of REGIONES_3D) {
            region.puntos = []
            for (const ancla of region.anclas) {
              const frente = ancla.lado !== 'back'
              const origen = new THREE.Vector3(cx + ancla.xf * tamano.y, caja.min.y + ancla.yf * tamano.y, frente ? caja.max.z + 0.5 : caja.min.z - 0.5)
              raycaster.set(origen, new THREE.Vector3(0, 0, frente ? -1 : 1))
              const impacto = raycaster.intersectObjects(objetivos, false)[0]
              if (!impacto) continue
              const normal = impacto.face.normal.clone().transformDirection(impacto.object.matrixWorld)
              const punto = impacto.point.clone().addScaledVector(normal, 0.012)
              const patch = new THREE.Mesh(
                new THREE.CircleGeometry(0.075, 32),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
              )
              patch.position.copy(punto)
              patch.lookAt(punto.clone().add(normal))
              escena.add(patch)
              patches.push(patch)

              const el = document.createElement('button')
              el.type = 'button'
              el.className = 'pointer-events-auto flex h-7 items-center gap-1 rounded-full border-2 border-white px-2 text-[10px] font-bold shadow-lg'
              el.addEventListener('click', (evento) => {
                evento.preventDefault()
                evento.stopPropagation()
                alSeleccionarRef.current?.(region.id)
              })
              const puntoEl = document.createElement('span')
              puntoEl.className = 'h-1.5 w-1.5 rounded-full bg-current opacity-80'
              const textoEl = document.createElement('span')
              textoEl.className = 'hidden'
              textoEl.textContent = region.corto
              el.appendChild(puntoEl)
              el.appendChild(textoEl)

              const etiqueta = new CSS2DObject(el)
              etiqueta.position.copy(punto)
              escena.add(etiqueta)
              labels.push(etiqueta)
              region.puntos.push({ punto, normal, patch, el, etiqueta, textoEl })
            }
          }
        }

        const actualizar = () => {
          for (const region of REGIONES_3D) {
            const clave = estadoSeguro(estadosRef.current?.[region.id])
            const estilo = ESTADOS_3D[clave]
            const sel = seleccionadaRef.current === region.id
            for (const item of region.puntos ?? []) {
              item.patch.material.color.setHex(estilo.color)
              item.patch.material.opacity = sel ? 0.95 : 0.5
              item.patch.scale.setScalar(sel ? 1.35 : 1)
              item.el.className = `pointer-events-auto flex h-7 items-center gap-1 rounded-full border-2 border-white px-2 text-[10px] font-bold shadow-lg ${estilo.clase} ${sel ? 'ring-2 ring-white' : ''}`
              if (item.textoEl) item.textoEl.className = sel ? 'inline' : 'hidden'
              item.el.setAttribute('aria-label', `${region.nombre}: ${estilo.texto}`)
            }
          }
        }
        actualizarRef.current = actualizar
        crearMarcadores()
        actualizar()

        fitDist = calcFit()
        limites()
        setView('front')
        ajustar()
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(ajustar)
          resizeObserver.observe(contenedor)
        } else {
          window.addEventListener('resize', ajustar)
        }

        const direccion = new THREE.Vector3()
        const animar = () => {
          if (cancelado) return
          frame = requestAnimationFrame(animar)
          controls.update()
          for (const region of REGIONES_3D) {
            for (const item of region.puntos ?? []) {
              direccion.subVectors(camara.position, item.punto).normalize()
              const visible = item.normal.dot(direccion) > 0.2
              item.patch.visible = visible
              item.etiqueta.visible = visible
            }
          }
          renderer.render(escena, camara)
          css2d.render(escena, camara)
        }
        animar()
        setEstado('listo')
      } catch (error) {
        console.error('[MapaCorporal3D]', error)
        if (!cancelado) setEstado('error')
      }
    }

    iniciar()

    return () => {
      cancelado = true
      if (frame) cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', ajustarGlobal)
      controls?.dispose()
      for (const patch of patches) {
        patch.geometry.dispose()
        patch.material.dispose()
      }
      for (const etiqueta of labels) {
        etiqueta.element?.remove()
      }
      if (modelo) {
        modelo.traverse((objeto) => {
          if (objeto.isMesh) {
            objeto.geometry?.dispose()
            if (Array.isArray(objeto.material)) objeto.material.forEach((m) => m.dispose())
            else objeto.material?.dispose()
          }
        })
      }
      css2d?.domElement?.remove()
      renderer?.dispose()
      if (renderer?.domElement?.parentElement === contenedor) contenedor.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="space-y-2">
      <div className="relative h-[420px] w-full overflow-hidden rounded-tarjeta border border-borde bg-superficie-alta/40">
        <div ref={contenedorRef} className="h-full w-full" />
        {estado === 'cargando' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-superficie-alta/60 text-xs text-tinta-suave">
            <PersonStanding size={28} className="animate-pulse text-primario" />
            Cargando mapa corporal 3D…
          </div>
        )}
        {estado === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-superficie-alta/60 px-6 text-center text-xs text-tinta-suave">
            <PersonStanding size={28} className="text-primario" />
            Vista 3D no disponible en este navegador. Puedes seleccionar los sistemas en la lista.
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => vistaRef.current?.('front')} className="rounded-boton border border-borde bg-superficie px-3 py-1.5 text-xs text-tinta hover:border-primario">Frente</button>
        <button type="button" onClick={() => vistaRef.current?.('back')} className="rounded-boton border border-borde bg-superficie px-3 py-1.5 text-xs text-tinta hover:border-primario">Espalda</button>
        <button type="button" onClick={() => { vistaRef.current?.('front'); alSeleccionarRef.current?.(null) }} className="rounded-boton border border-borde bg-superficie px-3 py-1.5 text-xs text-tinta hover:border-primario">Restablecer vista</button>
      </div>
    </div>
  )
}
