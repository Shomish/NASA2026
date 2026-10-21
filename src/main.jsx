/**
 * @fileoverview Punto de entrada de la aplicación.
 * Monta el router con proveedores (tema, consulta, router) y el ErrorBoundary.
 * @module main
 */

import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './presentacion/componentes/ErrorBoundary.jsx'
import SplashCarga from './presentacion/componentes/SplashCarga.jsx'
import { Router } from './app/router.jsx'
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

/** Cliente de consulta (TanStack Query). */
const clienteConsulta = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

createRoot(document.getElementById('raiz')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ProveedorTema>
        <QueryClientProvider client={clienteConsulta}>
          <BrowserRouter>
            <Suspense fallback={<SplashCarga />}>
              <Router />
            </Suspense>
          </BrowserRouter>
        </QueryClientProvider>
        <ContenedorTostadas />
      </ProveedorTema>
    </ErrorBoundary>
  </React.StrictMode>,
)
