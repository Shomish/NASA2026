/**
 * @fileoverview Configuración de Vitest para las pruebas unitarias.
 * @module vitest.config
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'server/**/*.test.js'],
    globals: false,
    env: { NODE_ENV: 'test' },
    testTimeout: 15000,
    // Los tests de servidor comparten la base MySQL: ejecutar archivos en serie.
    fileParallelism: false,
  },
})
