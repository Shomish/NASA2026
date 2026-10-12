/**
 * @fileoverview Service Worker del Centro de Salud del Astronauta.
 * Proporciona caché de recursos para funcionamiento offline (PWA).
 */

const NOMBRE_CACHE = 'salud-astronauta-v1'
const RECURSOS_BASE = ['/', '/manifest.json', '/icono.svg']

/* eslint-disable no-restricted-globals */
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(RECURSOS_BASE)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves.filter((clave) => clave !== NOMBRE_CACHE).map((clave) => caches.delete(clave)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return
  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        const copia = respuesta.clone()
        caches.open(NOMBRE_CACHE).then((cache) => cache.put(evento.request, copia))
        return respuesta
      })
      .catch(() => caches.match(evento.request).then((respuesta) => respuesta || caches.match('/'))),
  )
})
