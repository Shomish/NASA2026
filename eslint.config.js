/**
 * @fileoverview Configuración de ESLint (flat config, ESLint 9).
 * Reglas base + React + React Hooks + JSDoc, sin TypeScript (se añadirá en la migración gradual).
 * @module eslint.config
 */

import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import boundaries from 'eslint-plugin-boundaries'

export default [
  { ignores: ['dist', 'node_modules', 'server/data'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      jsdoc: jsdocPlugin,
      boundaries,
    },
    settings: {
      react: { version: 'detect' },
      'boundaries/elements': [
        { type: 'dominio', pattern: 'src/dominio/**/*' },
        { type: 'aplicacion', pattern: 'src/aplicacion/**/*' },
        { type: 'infraestructura', pattern: 'src/infraestructura/**/*' },
        { type: 'presentacion', pattern: 'src/presentacion/**/*' },
        { type: 'features', pattern: 'src/features/**/*' },
        { type: 'datos', pattern: 'src/datos/**/*' },
        { type: 'servidor', pattern: 'server/**/*' },
      ],
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'jsdoc/require-jsdoc': 'off',
      // Regla de límites en modo warn: alerta si se viola la regla de dependencia.
      'boundaries/dependencies': [
        'warn',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'dominio' } },
              disallow: [
                { to: { element: { type: 'aplicacion' } } },
                { to: { element: { type: 'infraestructura' } } },
                { to: { element: { type: 'presentacion' } } },
                { to: { element: { type: 'features' } } },
                { to: { element: { type: 'servidor' } } },
              ],
            },
            {
              from: { element: { type: 'servidor' } },
              disallow: [
                { to: { element: { type: 'presentacion' } } },
                { to: { element: { type: 'features' } } },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    // Los logs de arranque del servidor son legítimos.
    files: ['server/**/*.js'],
    rules: { 'no-console': 'off' },
  },
]
