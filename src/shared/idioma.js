/**
 * @fileoverview Internacionalización (es/en) de AYNI HEALTH.
 * Guarda el idioma en localStorage (acceso diferido, nunca en la evaluación del módulo)
 * y expone `t()` y el hook `useTraduccion()` para traducir la interfaz completa.
 * @module shared/idioma
 */

import { create } from 'zustand'

/** Traducciones de todas las cadenas visibles de la interfaz. */
const TRADUCCIONES = {
  es: {
    // Landing
    'landing.titulo': 'Tu salud, evaluada por ti,',
    'landing.subtitulo': 'incluso sin conexión.',
    'landing.descripcion': 'Una herramienta visual para que los astronautas evalúen su propia salud durante misiones largas: entiende los cinco peligros del vuelo espacial, registra tus indicadores y recibe guía para cuidarte.',
    'landing.entrar': 'Entrar al sistema',
    'landing.crear': 'Crear cuenta',
    'landing.queHace': 'Qué hace AYNI HEALTH',

    // Navegación
    'nav.principal': 'Principal',
    'nav.monitoreo': 'Monitoreo',
    'nav.nutricion': 'Nutrición',
    'nav.tripulacion': 'Tripulación',
    'nav.sistema': 'Sistema',
    'nav.dashboard': 'Dashboard',
    'nav.monitor': 'Monitor de salud',
    'nav.cuerpo': 'Mi cuerpo',
    'nav.signos': 'Signos vitales',
    'nav.saludIntegral': 'Salud integral',
    'nav.calendario': 'Calendario',
    'nav.nutricionItem': 'Nutrición inteligente',
    'nav.registros': 'Registros',
    'nav.tripulantes': 'Tripulantes',
    'nav.historial': 'Historial',
    'nav.diario': 'Diario',
    'nav.alertas': 'Alertas',
    'nav.chatIa': 'Médico de IA',
    'nav.usuarios': 'Usuarios',
    'nav.auditoria': 'Auditoría',
    'nav.fundamento': 'Fundamento científico',
    'nav.configuracion': 'Configuración',
    'nav.ayuda': 'Ayuda',

    // Topbar / shell
    'shell.titulo': 'Monitor de salud',
    'shell.subtitulo': 'Monitor autónomo',
    'shell.registrar': 'Registrar medición',
    'shell.buscar': 'Buscar (Ctrl+K)',
    'shell.salir': 'Salir',
    'shell.alternarModo': 'Alternar modo',
    'shell.idioma': 'Idioma',
    'shell.expandir': 'Expandir',
    'shell.colapsar': 'Colapsar',
    'shell.abrirMenu': 'Abrir menú',
    'shell.notificaciones': 'Notificaciones',

    // Barra inferior
    'movil.inicio': 'Inicio',
    'movil.monitor': 'Monitor',
    'movil.registrar': 'Registrar',
    'movil.nutricion': 'Nutrición',
    'movil.mas': 'Más',

    // Login
    'login.hero.titulo1': 'Cuida la salud de tu tripulación,',
    'login.hero.titulo2': 'incluso sin conexión.',
    'login.hero.descripcion': 'Signos vitales, nutrición andina, sueño, salud mental y un médico de IA que funciona sin depender de control de misión.',
    'login.hero.comandante': 'Ana Quispe · Comandante',
    'login.hero.dia': 'Día 120 · SpO₂ 97%',
    'login.c1': 'Monitoreo vital autónomo',
    'login.c2': 'Nutrición con superalimentos andinos',
    'login.c3': 'Sueño, salud mental y radiación',
    'login.c4': 'Médico de IA offline',
    'login.seguro': 'Conexión segura',
    'login.bienvenida': 'Bienvenido de nuevo',
    'login.instruccion': 'Ingresa tus credenciales para acceder al sistema.',
    'login.email': 'Email',
    'login.contrasena': 'Contraseña',
    'login.recordar': 'Recordar usuario',
    'login.olvidaste': '¿Olvidaste tu contraseña?',
    'login.ingresar': 'Ingresar al sistema',
    'login.sinCuenta': '¿No tienes cuenta?',
    'login.crearCuenta': 'Crear una cuenta',
    'login.demo.titulo': 'Acceso de demostración',
    'login.demo.autocompletar': 'Autocompletar credenciales',
    'login.bloqMayus': 'Bloq Mayús activado',

    // Tour
    'tour.titulo': 'Bienvenido a AYNI HEALTH',
    'tour.siguiente': 'Siguiente',
    'tour.atras': 'Atrás',
    'tour.empezar': 'Empezar',
    'tour.p1.titulo': 'Dashboard',
    'tour.p1.texto': 'Aquí ves un resumen de tu salud: signos vitales, sueño, ánimo y alertas. Es tu punto de partida cada día.',
    'tour.p2.titulo': 'Mi cuerpo',
    'tour.p2.texto': 'Toca cada parte de la figura humana para entender qué mide cada región y si está en buen estado.',
    'tour.p3.titulo': 'Registros',
    'tour.p3.texto': 'Aquí registras tus mediciones (signos, glucosa, sueño, ánimo…). El sistema las compara con los rangos de referencia.',
    'tour.p4.titulo': 'Fundamento científico',
    'tour.p4.texto': 'Explica en lenguaje simple los cinco peligros del espacio y la guía de cada indicador.',
    'tour.p5.titulo': 'Alertas',
    'tour.p5.texto': 'Cuando algo está fuera de rango verás una alerta (rojo = avisar al médico). La campana muestra las alertas recientes.',

    // Dashboard
    'dash.buenosDias': 'Buenos días',
    'dash.buenasTardes': 'Buenas tardes',
    'dash.buenasNoches': 'Buenas noches',
    'dash.enVivo': 'En vivo ·',
    'dash.dia': 'Día',
    'dash.diaMision': 'de misión',
    'dash.registrosRecientes': 'registros recientes.',
    'dash.estadoOptimo': 'Estado óptimo',
    'dash.requiereAtencion': 'Requiere atención',
    'dash.critico': 'Crítico',
    'dash.avanzarDia': 'Avanzar día (demo)',
    'dash.avanzando': 'Avanzando…',
    'dash.estadoMision': 'Estado de misión',
    'dash.entorno': 'Entorno:',
    'dash.glucosa': 'Glucosa',
    'dash.ejercicio': 'Ejercicio',
    'dash.frecuenciaCardiaca': 'Frecuencia cardíaca',
    'dash.saturacion': 'Saturación de O₂',
    'dash.sueno': 'Sueño',
    'dash.alertasActivas': 'Alertas activas',
    'dash.tendenciaFc': 'Frecuencia cardíaca · últimos',
    'dash.dias': 'días',
    'dash.sinDatosFc': 'Sin datos de frecuencia cardíaca recientes.',
    'dash.alertasRecientes': 'Alertas recientes',
    'dash.sinResumen': 'No se pudo cargar el resumen',
    'dash.sinTripulante': 'Sin tripulante',
    'dash.sinPerfil': 'No tienes un perfil de tripulante vinculado.',
    'dash.revisarConexion': 'Revisa la conexión con el servidor.',

    // Monitor
    'monitor.sinTripulantes': 'No hay tripulantes. Ve a',
    'monitor.agrega': 'Tripulación',
    'monitor.agregaUno': 'y agrega uno.',
    'monitor.diaMision': 'Día de misión',
    'monitor.imc': 'IMC',

    // Chatbot IA
    'chat.titulo': 'Médico de IA',
    'chat.saludo': 'Hola {nombre}. Soy tu médico de IA. Pregúntame por tu salud, nutrición, sueño o riesgos.',
    'chat.sinTripulante': 'Sin tripulante',
    'chat.motorNube': 'Motor en la nube · en línea',
    'chat.motorLocal': 'Motor local · offline',
    'chat.usarNube': 'Usar nube',
    'chat.usarLocal': 'Usar motor local',
    'chat.nubeNoConfigurada': 'Nube no configurada',
    'chat.analizando': 'Analizando…',
    'chat.placeholder': 'Pregunta: ¿cómo está mi salud?',
    'chat.tu': 'Tú',
    'chat.trabajando': 'Trabajando con',

    // Notificaciones / alertas
    'alertas.titulo': 'Alertas',
    'alertas.sinAlertas': 'Sin alertas.',
    'alertas.sinLeer': 'sin leer',
    'alertas.verPerfil': 'Ver perfil',

    // Alertas sonido
    'sonido.warning': 'Advertencia, se detectaron datos atípicos. Revisa las alertas de salud.',

    // Común
    'comun.cambiar': 'Cambiar',
    'comun.cancelar': 'Cancelar',
    'comun.guardar': 'Guardar',
    'comun.guardando': 'Guardando…',
    'comun.nuevo': 'Nuevo',
    'comun.editar': 'Editar',
    'comun.eliminar': 'Eliminar',
    'comun.desactivar': 'Desactivar',
    'comun.activar': 'Activar',
    'comun.cerrar': 'Cerrar',
    'comun.validar': 'Validar',
    'comun.anterior': 'Anterior',
    'comun.siguiente': 'Siguiente',
    'comun.cargando': 'Cargando…',
  },
  en: {
    // Landing
    'landing.titulo': 'Assess your own health,',
    'landing.subtitulo': 'even offline.',
    'landing.descripcion': 'A visual tool for astronauts to assess their own health during long missions: understand the five hazards of spaceflight, log your indicators and get guidance to stay healthy.',
    'landing.entrar': 'Enter the system',
    'landing.crear': 'Create account',
    'landing.queHace': 'What AYNI HEALTH does',

    // Navegación
    'nav.principal': 'Main',
    'nav.monitoreo': 'Monitoring',
    'nav.nutricion': 'Nutrition',
    'nav.tripulacion': 'Crew',
    'nav.sistema': 'System',
    'nav.dashboard': 'Dashboard',
    'nav.monitor': 'Health monitor',
    'nav.cuerpo': 'My body',
    'nav.signos': 'Vital signs',
    'nav.saludIntegral': 'Holistic health',
    'nav.calendario': 'Calendar',
    'nav.nutricionItem': 'Smart nutrition',
    'nav.registros': 'Records',
    'nav.tripulantes': 'Crew members',
    'nav.historial': 'History',
    'nav.diario': 'Journal',
    'nav.alertas': 'Alerts',
    'nav.chatIa': 'AI Doctor',
    'nav.usuarios': 'Users',
    'nav.auditoria': 'Audit log',
    'nav.fundamento': 'Scientific background',
    'nav.configuracion': 'Settings',
    'nav.ayuda': 'Help',

    // Topbar / shell
    'shell.titulo': 'Health monitor',
    'shell.subtitulo': 'Autonomous monitor',
    'shell.registrar': 'Log measurement',
    'shell.buscar': 'Search (Ctrl+K)',
    'shell.salir': 'Sign out',
    'shell.alternarModo': 'Toggle mode',
    'shell.idioma': 'Language',
    'shell.expandir': 'Expand',
    'shell.colapsar': 'Collapse',
    'shell.abrirMenu': 'Open menu',
    'shell.notificaciones': 'Notifications',

    // Barra inferior
    'movil.inicio': 'Home',
    'movil.monitor': 'Monitor',
    'movil.registrar': 'Log',
    'movil.nutricion': 'Nutrition',
    'movil.mas': 'More',

    // Login
    'login.hero.titulo1': 'Care for your crew\u2019s health,',
    'login.hero.titulo2': 'even offline.',
    'login.hero.descripcion': 'Vital signs, Andean nutrition, sleep, mental health and an AI doctor that works without relying on mission control.',
    'login.hero.comandante': 'Ana Quispe · Commander',
    'login.hero.dia': 'Day 120 · SpO₂ 97%',
    'login.c1': 'Autonomous vital monitoring',
    'login.c2': 'Nutrition with Andean superfoods',
    'login.c3': 'Sleep, mental health and radiation',
    'login.c4': 'Offline AI doctor',
    'login.seguro': 'Secure connection',
    'login.bienvenida': 'Welcome back',
    'login.instruccion': 'Enter your credentials to access the system.',
    'login.email': 'Email',
    'login.contrasena': 'Password',
    'login.recordar': 'Remember me',
    'login.olvidaste': 'Forgot your password?',
    'login.ingresar': 'Sign in to the system',
    'login.sinCuenta': 'Don\u2019t have an account?',
    'login.crearCuenta': 'Create an account',
    'login.demo.titulo': 'Demo access',
    'login.demo.autocompletar': 'Autofill credentials',
    'login.bloqMayus': 'Caps Lock is on',

    // Tour
    'tour.titulo': 'Welcome to AYNI HEALTH',
    'tour.siguiente': 'Next',
    'tour.atras': 'Back',
    'tour.empezar': 'Start',
    'tour.p1.titulo': 'Dashboard',
    'tour.p1.texto': 'Here you see a summary of your health: vital signs, sleep, mood and alerts. It is your starting point every day.',
    'tour.p2.titulo': 'My body',
    'tour.p2.texto': 'Tap each part of the human figure to understand what each region measures and whether it is in good shape.',
    'tour.p3.titulo': 'Records',
    'tour.p3.texto': 'Here you log your measurements (signs, glucose, sleep, mood…). The system compares them against reference ranges.',
    'tour.p4.titulo': 'Scientific background',
    'tour.p4.texto': 'Explains in simple language the five hazards of space and the guidance for each indicator.',
    'tour.p5.titulo': 'Alerts',
    'tour.p5.texto': 'When something is out of range you will see an alert (red = notify the doctor). The bell shows recent alerts.',

    // Dashboard
    'dash.buenosDias': 'Good morning',
    'dash.buenasTardes': 'Good afternoon',
    'dash.buenasNoches': 'Good evening',
    'dash.enVivo': 'Live ·',
    'dash.dia': 'Day',
    'dash.diaMision': 'of mission',
    'dash.registrosRecientes': 'recent records.',
    'dash.estadoOptimo': 'Optimal state',
    'dash.requiereAtencion': 'Needs attention',
    'dash.critico': 'Critical',
    'dash.avanzarDia': 'Advance day (demo)',
    'dash.avanzando': 'Advancing…',
    'dash.estadoMision': 'Mission status',
    'dash.entorno': 'Environment:',
    'dash.glucosa': 'Glucose',
    'dash.ejercicio': 'Exercise',
    'dash.frecuenciaCardiaca': 'Heart rate',
    'dash.saturacion': 'O₂ saturation',
    'dash.sueno': 'Sleep',
    'dash.alertasActivas': 'Active alerts',
    'dash.tendenciaFc': 'Heart rate · last',
    'dash.dias': 'days',
    'dash.sinDatosFc': 'No recent heart rate data.',
    'dash.alertasRecientes': 'Recent alerts',
    'dash.sinResumen': 'Could not load summary',
    'dash.sinTripulante': 'No crew member',
    'dash.sinPerfil': 'You do not have a linked crew profile.',
    'dash.revisarConexion': 'Check the server connection.',

    // Monitor
    'monitor.sinTripulantes': 'There are no crew members. Go to',
    'monitor.agrega': 'Crew',
    'monitor.agregaUno': 'and add one.',
    'monitor.diaMision': 'Mission day',
    'monitor.imc': 'BMI',

    // Chatbot IA
    'chat.titulo': 'AI Doctor',
    'chat.saludo': 'Hello {nombre}. I am your AI doctor. Ask me about your health, nutrition, sleep or risks.',
    'chat.sinTripulante': 'No crew member',
    'chat.motorNube': 'Cloud engine · online',
    'chat.motorLocal': 'Local engine · offline',
    'chat.usarNube': 'Use cloud',
    'chat.usarLocal': 'Use local engine',
    'chat.nubeNoConfigurada': 'Cloud not configured',
    'chat.analizando': 'Analyzing…',
    'chat.placeholder': 'Ask: how is my health?',
    'chat.tu': 'You',
    'chat.trabajando': 'Working with',

    // Notificaciones / alertas
    'alertas.titulo': 'Alerts',
    'alertas.sinAlertas': 'No alerts.',
    'alertas.sinLeer': 'unread',
    'alertas.verPerfil': 'View profile',

    // Alertas sonido
    'sonido.warning': 'Warning, atypical data detected. Check your health alerts.',

    // Común
    'comun.cambiar': 'Switch',
    'comun.cancelar': 'Cancel',
    'comun.guardar': 'Save',
    'comun.guardando': 'Saving…',
    'comun.nuevo': 'New',
    'comun.editar': 'Edit',
    'comun.eliminar': 'Delete',
    'comun.desactivar': 'Deactivate',
    'comun.activar': 'Activate',
    'comun.cerrar': 'Close',
    'comun.validar': 'Validate',
    'comun.anterior': 'Previous',
    'comun.siguiente': 'Next',
    'comun.cargando': 'Loading…',
  },
}

/** Idiomas disponibles. */
export const IDIOMAS = ['es', 'en']

/**
 * Lee el idioma guardado de forma segura (sin tocar localStorage en el módulo).
 * @returns {'es'|'en'} Idioma guardado o 'es'.
 */
function leerIdioma() {
  try {
    return localStorage.getItem('ayni-idioma') === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

/**
 * Store de idioma (se inicializa de forma perezosa, no en la evaluación del módulo).
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<object>>}
 */
export const useIdioma = create((set) => ({
  idioma: 'es',
  cargarIdioma: () => set({ idioma: leerIdioma() }),
  fijarIdioma: (idioma) => {
    try { localStorage.setItem('ayni-idioma', idioma) } catch { /* sin almacenamiento */ }
    set({ idioma })
  },
}))

/**
 * Devuelve el idioma actual de forma síncrona.
 * @returns {'es'|'en'} Idioma actual.
 */
export function idiomaActual() {
  return useIdioma.getState().idioma
}

/**
 * Traduce una clave según el idioma actual, interpolando parámetros {clave}.
 * @param {string} clave - Clave de traducción.
 * @param {Record<string, string | number>} [parametros] - Parámetros de interpolación.
 * @returns {string} Texto traducido.
 */
export function t(clave, parametros) {
  const idioma = useIdioma.getState().idioma
  let texto = TRADUCCIONES[idioma]?.[clave] ?? TRADUCCIONES.es[clave] ?? clave
  if (parametros) {
    for (const [nombre, valor] of Object.entries(parametros)) {
      texto = texto.replaceAll(`{${nombre}}`, String(valor))
    }
  }
  return texto
}

/**
 * Hook reactivo de traducción: suscribe al idioma y devuelve la función `t`.
 * Al cambiar el idioma, el componente se vuelve a renderizar.
 * @returns {(clave: string, parametros?: Record<string, string | number>) => string} Traductor.
 */
export function useTraduccion() {
  useIdioma((s) => s.idioma)
  return t
}
