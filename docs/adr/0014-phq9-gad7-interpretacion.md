# ADR-0014 · PHQ-9 y GAD-7: interpretación compartida e ítem 9

## Estado
Aceptado.

## Contexto
Los formularios de salud mental necesitan interpretar el puntaje del PHQ-9 y del GAD-7, y la pregunta 9 del PHQ-9 (ideación) debe activar SIEMPRE una alerta de apoyo, sin depender del puntaje total.

## Decisión
- Módulo compartido `shared/evaluaciones.js` con `interpretarPhq9` (0-4 mínima, 5-9 leve, 10-14 moderada, 15-19 moderadamente severa, 20-27 severa), `interpretarGad7` (0-4, 5-9, 10-14, 15+) y `item9Phq9Positivo`.
- El servidor usa `item9Phq9Positivo` en `generarAlertas` para crear una alerta crítica ante cualquier respuesta distinta de "nunca" en la pregunta 9.
- El frontend calcula `puntaje`, `nivel` e `item9_positivo` al guardar el detalle de `salud_mental`.

## Consecuencias
- **Positivas:** una sola fuente de verdad para la interpretación; el ítem 9 se prioriza en código, no por umbral de puntaje.
- Los rangos del PHQ-9/GAD-7 son fijos y públicos; los umbrales editables siguen en `umbrales_clinicos`.
