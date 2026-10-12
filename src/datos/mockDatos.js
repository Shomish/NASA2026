/**
 * @fileoverview Datos de prueba (mock): tripulación múltiple, despensa, contramedidas y vitales.
 * @module datos/mockDatos
 */

import { Astronauta } from '../dominio/indice.js'

/**
 * Tripulación inicial (múltiples astronautas con perfiles diversos).
 * @type {Astronauta[]}
 */
export const tripulacionInicial = [
  new Astronauta({
    id: 'ana-quispe',
    nombre: 'Ana Quispe',
    rol: 'Comandante',
    edad: 38,
    sexo: 'femenino',
    pesoKg: 62,
    alturaCm: 165,
    diaMision: 120,
    mision: 'Misión Artemis',
    destino: 'Tránsito a Marte',
    condiciones: ['perdida_osea', 'estres'],
    alergias: ['lactosa'],
    objetivoSalud: 'Mantener densidad ósea y gestionar el estrés',
  }),
  new Astronauta({
    id: 'diego-mamani',
    nombre: 'Diego Mamani',
    rol: 'Ingeniero de Vuelo',
    edad: 41,
    sexo: 'masculino',
    pesoKg: 78,
    alturaCm: 178,
    diaMision: 120,
    mision: 'Misión Artemis',
    destino: 'Tránsito a Marte',
    condiciones: ['atrofia_muscular'],
    alergias: [],
    objetivoSalud: 'Preservar masa muscular',
  }),
  new Astronauta({
    id: 'lucia-condori',
    nombre: 'Lucía Condori',
    rol: 'Oficial Médico',
    edad: 35,
    sexo: 'femenino',
    pesoKg: 58,
    alturaCm: 160,
    diaMision: 120,
    mision: 'Misión Artemis',
    destino: 'Tránsito a Marte',
    condiciones: ['anemia', 'hipoxia'],
    alergias: ['mani'],
    objetivoSalud: 'Corregir anemia y adaptación a la hipoxia',
  }),
]

/**
 * Signos vitales de referencia (FC y O₂) de las últimas 24 horas.
 * @type {Array<{hora: string, frecuenciaCardiaca: number, saturacion: number}>}
 */
export const vitales24Horas = [
  { hora: '00:00', frecuenciaCardiaca: 68, saturacion: 98 },
  { hora: '02:00', frecuenciaCardiaca: 61, saturacion: 97 },
  { hora: '04:00', frecuenciaCardiaca: 60, saturacion: 97 },
  { hora: '06:00', frecuenciaCardiaca: 70, saturacion: 98 },
  { hora: '08:00', frecuenciaCardiaca: 82, saturacion: 99 },
  { hora: '10:00', frecuenciaCardiaca: 84, saturacion: 98 },
  { hora: '12:00', frecuenciaCardiaca: 90, saturacion: 96 },
  { hora: '14:00', frecuenciaCardiaca: 84, saturacion: 97 },
  { hora: '16:00', frecuenciaCardiaca: 80, saturacion: 97 },
  { hora: '18:00', frecuenciaCardiaca: 76, saturacion: 98 },
  { hora: '20:00', frecuenciaCardiaca: 72, saturacion: 97 },
  { hora: '22:00', frecuenciaCardiaca: 65, saturacion: 98 },
]

/**
 * Despensa global (raciones ISS).
 * @type {Array<object>}
 */
export const despensaGlobal = [
  { id: 'pollo_termo', nombre: 'Pollo termoestabilizado', calorias: 320, proteinas: 28, carbohidratos: 12, grasas: 14, stock: 18, etiquetas: ['proteina'] },
  { id: 'salmon_liof', nombre: 'Salmón liofilizado', calorias: 280, proteinas: 30, carbohidratos: 6, grasas: 15, stock: 12, etiquetas: ['proteina', 'omega3'] },
  { id: 'arroz', nombre: 'Arroz fortificado', calorias: 210, proteinas: 5, carbohidratos: 45, grasas: 1, stock: 30, etiquetas: ['carbohidrato'] },
  { id: 'pasta', nombre: 'Pasta integral', calorias: 340, proteinas: 12, carbohidratos: 66, grasas: 3, stock: 24, etiquetas: ['carbohidrato'] },
  { id: 'verduras', nombre: 'Verduras rehidratadas', calorias: 60, proteinas: 3, carbohidratos: 12, grasas: 0, stock: 22, etiquetas: ['fibra'] },
  { id: 'frutos_secos', nombre: 'Frutos secos mixtos', calorias: 180, proteinas: 6, carbohidratos: 8, grasas: 15, stock: 16, etiquetas: ['grasa'] },
  { id: 'barra_proteina', nombre: 'Barra de proteína', calorias: 220, proteinas: 20, carbohidratos: 25, grasas: 6, stock: 20, etiquetas: ['proteina'] },
  { id: 'jugo', nombre: 'Jugo fortificado', calorias: 90, proteinas: 1, carbohidratos: 22, grasas: 0, stock: 28, etiquetas: ['carbohidrato'] },
]

/**
 * Contramedidas andinas (superalimentos).
 * @type {Array<object>}
 */
export const contramedidasAndinas = [
  { id: 'maca', nombre: 'Maca', nombreCientifico: 'Lepidium meyenii', color: 'violet', imagen: 'maca', beneficio: 'Densidad ósea y resistencia', riesgo: 'perdida_osea', dosis: '3 g/día', detalle: 'Raíz andina que favorece la densidad ósea y el equilibrio hormonal.' },
  { id: 'quinua', nombre: 'Quinua', nombreCientifico: 'Chenopodium quinoa', color: 'emerald', imagen: 'quinua', beneficio: 'Proteína completa muscular', riesgo: 'atrofia_muscular', dosis: '100-150 g/día', detalle: 'Grano con los 9 aminoácidos esenciales, estudiado por la NASA.' },
  { id: 'kiwicha', nombre: 'Kiwicha', nombreCientifico: 'Amaranthus caudatus', color: 'rose', imagen: 'kiwicha', beneficio: 'Hierro para glóbulos rojos', riesgo: 'anemia', dosis: '50 g/día', detalle: 'Alta en hierro biodisponible y lisina.' },
  { id: 'muna', nombre: 'Muña', nombreCientifico: 'Minthostachys mollis', color: 'teal', imagen: 'muna', beneficio: 'Alivio digestivo', riesgo: 'digestivo', dosis: 'Infusión 5 g ×2', detalle: 'Hierba digestiva y respiratoria de los Andes.' },
  { id: 'sacha_inchi', nombre: 'Sacha Inchi', nombreCientifico: 'Plukenetia volubilis', color: 'orange', imagen: 'sacha-inchi', beneficio: 'Omega-3 antiinflamatorio', riesgo: 'inflamacion', dosis: '10-15 ml/día', detalle: 'Fuente vegetal con el mayor contenido de omega-3.' },
  { id: 'coca', nombre: 'Hoja de coca', nombreCientifico: 'Erythroxylum coca', color: 'amber', imagen: 'coca', beneficio: 'Adaptación a la hipoxia', riesgo: 'hipoxia', dosis: 'Uso tradicional', detalle: 'Práctica andina de adaptación a la altitud.' },
]

/**
 * Opciones de condiciones para el formulario de tripulantes.
 * @type {Array<{id: string, etiqueta: string}>}
 */
export const opcionesCondiciones = [
  { id: 'perdida_osea', etiqueta: 'Pérdida ósea' },
  { id: 'atrofia_muscular', etiqueta: 'Atrofia muscular' },
  { id: 'anemia', etiqueta: 'Anemia espacial' },
  { id: 'inflamacion', etiqueta: 'Inflamación' },
  { id: 'digestivo', etiqueta: 'Problemas digestivos' },
  { id: 'estres', etiqueta: 'Estrés psicológico' },
  { id: 'hipoxia', etiqueta: 'Hipoxia / fatiga' },
]
