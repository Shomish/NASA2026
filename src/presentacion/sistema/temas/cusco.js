/**
 * @fileoverview Tema "Cusco Atardecer" (paleta por defecto).
 * Inspirada en los techos de teja, el oro del Inti y los textiles del Cusco.
 * Los tokens usan canales RGB (r g b) para soportar opacidad en Tailwind.
 * @module presentacion/sistema/temas/cusco
 */

/**
 * Tema Cusco Atardecer.
 * @type {import('./indice.js').Tema}
 */
export const temaCusco = {
  id: 'cusco',
  nombre: 'Cusco Atardecer',
  descripcion: 'Techos de teja, oro del Inti y turquesa de las lagunas andinas.',
  oscuro: {
    fondo: '18 16 14',
    superficie: '26 22 19',
    'superficie-elevada': '35 30 25',
    'superficie-alta': '45 38 32',
    borde: '58 50 42',
    'borde-fuerte': '74 64 54',
    tinta: '247 241 232',
    'tinta-suave': '184 173 158',
    primario: '232 137 79',
    'primario-fuerte': '194 96 58',
    secundario: '224 176 79',
    'secundario-fuerte': '200 146 46',
    acento: '43 179 163',
    exito: '63 163 122',
    advertencia: '245 158 11',
    'advertencia-fuerte': '249 115 22',
    critico: '220 38 38',
    'andino-dorado': '224 176 79',
    'andino-terracota': '194 96 58',
  },
  claro: {
    fondo: '250 246 240',
    superficie: '255 255 255',
    'superficie-elevada': '253 249 243',
    'superficie-alta': '245 239 231',
    borde: '232 223 210',
    'borde-fuerte': '214 201 184',
    tinta: '31 26 22',
    'tinta-suave': '107 95 84',
    primario: '194 96 58',
    'primario-fuerte': '163 78 46',
    secundario: '200 146 46',
    'secundario-fuerte': '168 122 30',
    acento: '31 151 137',
    exito: '46 139 103',
    advertencia: '180 83 9',
    'advertencia-fuerte': '194 65 12',
    critico: '185 28 28',
    'andino-dorado': '200 146 46',
    'andino-terracota': '194 96 58',
  },
  series: ['#E8894F', '#E0B04F', '#2BB3A3', '#3FA37A', '#B83A6B', '#2F5D8A'],
}
