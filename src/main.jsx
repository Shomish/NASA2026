/**
 * @fileoverview Punto de entrada de la aplicación.
 * Monta la app con ErrorBoundary, splash de carga, proveedor de tema y toasts.
 * @module main
 */

import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from './presentacion/componentes/ErrorBoundary.jsx'
import SplashCarga from './presentacion/componentes/SplashCarga.jsx'
import { ProveedorTema, ContenedorTostadas } from './presentacion/sistema/indice.js'
import './index.css'

// Tipografías autoalojadas (@fontsource) para funcionamiento offline.
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'
import '@fontsource/atkinson-hyperlegible-next/400.css'
import '@fontsource/atkinson-hyperlegible-next/700.css'

// Carga diferida del componente raíz: habilita code-splitting y muestra el splash.
const App = lazy(() => import('./App.jsx'))

createRoot(document.getElementById('raiz')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ProveedorTema>
        <Suspense fallback={<SplashCarga />}>
          <App />
        </Suspense>
        <ContenedorTostadas />
      </ProveedorTema>
    </ErrorBoundary>
  </React.StrictMode>,
)
