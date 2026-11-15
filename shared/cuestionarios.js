/**
 * @fileoverview PHQ-9 y GAD-7 completos, en español e inglés.
 * PHQ-9: Kroenke et al. (2001); versión española validada por Saldivia et al. (2019).
 * GAD-7: Spitzer et al. (2006).
 * @module shared/cuestionarios
 */

/** Preguntas oficiales por cuestionario e idioma. */
export const CUESTIONARIOS = {
  phq9: {
    es: [
      'Poco interés o placer en hacer las cosas.',
      'Sentirse desanimado(a), deprimido(a) o sin esperanza.',
      'Problemas para dormir o mantenerse dormido(a), o dormir demasiado.',
      'Sentirse cansado(a) o tener poca energía.',
      'Poco apetito o comer en exceso.',
      'Sentirse mal con uno mismo(a), o sentir que es un fracaso o que ha quedado mal consigo mismo(a) o con su familia.',
      'Dificultad para concentrarse en las cosas, como leer el periódico o ver televisión.',
      'Moverse o hablar tan lentamente que otras personas podrían notarlo, o al contrario, estar tan inquieto(a) o agitado(a) que se mueve mucho más de lo habitual.',
      'Pensamientos de que sería mejor estar muerto(a) o de hacerse daño de alguna manera.',
    ],
    en: [
      'Little interest or pleasure in doing things.',
      'Feeling down, depressed, or hopeless.',
      'Trouble falling or staying asleep, or sleeping too much.',
      'Feeling tired or having little energy.',
      'Poor appetite or overeating.',
      'Feeling bad about yourself — or that you are a failure or have let yourself or your family down.',
      'Trouble concentrating on things, such as reading the newspaper or watching television.',
      'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual.',
      'Thoughts that you would be better off dead or of hurting yourself in some way.',
    ],
  },
  gad7: {
    es: [
      'Sentirse nervioso(a), ansioso(a) o con los nervios de punta.',
      'No poder dejar de preocuparse o no poder controlar la preocupación.',
      'Preocuparse demasiado por diferentes cosas.',
      'Dificultad para relajarse.',
      'Estar tan inquieto(a) que es difícil quedarse quieto(a).',
      'Sentirse fácilmente molesto(a) o irritable.',
      'Sentir miedo, como si algo terrible pudiera pasar.',
    ],
    en: [
      'Feeling nervous, anxious, or on edge.',
      'Not being able to stop or control worrying.',
      'Worrying too much about different things.',
      'Trouble relaxing.',
      'Being so restless that it is hard to sit still.',
      'Becoming easily annoyed or irritable.',
      'Feeling afraid, as if something awful might happen.',
    ],
  },
}

/** Textos de interfaz del módulo de salud mental. */
export const TEXTOS_MENTALES = {
  es: {
    titulo: 'Salud mental',
    phq9: 'PHQ-9 (depresión)',
    gad7: 'GAD-7 (ansiedad)',
    guardar: 'Guardar evaluación',
    faltan: 'Responde todas las preguntas',
    faltaPregunta: 'Falta responder',
    aviso: 'Este cuestionario es una herramienta de tamizaje, no un diagnóstico. Comparte el resultado con el médico de vuelo o un profesional de salud.',
    ayudaItem9: 'Has marcado pensamientos de hacerte daño. Busca ayuda inmediata: avisa al oficial médico y a control de misión. No estás solo.',
    sinEvaluaciones: 'Aún no hay evaluaciones.',
    resultado: 'Resultado',
    opciones: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
    niveles: {
      'mínima': 'mínima',
      leve: 'leve',
      moderada: 'moderada',
      'moderadamente severa': 'moderadamente severa',
      severa: 'severa',
    },
  },
  en: {
    titulo: 'Mental health',
    phq9: 'PHQ-9 (depression)',
    gad7: 'GAD-7 (anxiety)',
    guardar: 'Save assessment',
    faltan: 'Answer all questions',
    faltaPregunta: 'Missing answer',
    aviso: 'This questionnaire is a screening tool, not a diagnosis. Share the result with the flight surgeon or a health professional.',
    ayudaItem9: 'You have reported thoughts of self-harm. Seek immediate help: notify the flight surgeon and mission control. You are not alone.',
    sinEvaluaciones: 'No assessments yet.',
    resultado: 'Result',
    opciones: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    niveles: {
      'mínima': 'minimal',
      leve: 'mild',
      moderada: 'moderate',
      'moderadamente severa': 'moderately severe',
      severa: 'severe',
    },
  },
}
