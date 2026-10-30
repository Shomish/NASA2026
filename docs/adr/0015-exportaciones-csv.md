# ADR-0015 · Exportaciones CSV con protección contra inyección de fórmulas

## Estado
Aceptado.

## Contexto
El historial se puede exportar a CSV. Las celdas que empiezan con `=`, `+`, `-` o `@` pueden inyectar fórmulas al abrir el archivo en una hoja de cálculo.

## Decisión
- `shared/exportacion.js` (cargado de forma diferida, fuera del bundle inicial) con `protegerCelda` que prefija una comilla simple (`'`) a esas celdas.
- CSV con BOM UTF-8 y nombre de archivo con fecha `DD-MM-YYYY`.
- El tripulante solo exporta sus registros (los datos ya llegan filtrados por el servidor). Las exportaciones a PDF (jsPDF + autotable) y Excel (exceljs) quedan para una iteración posterior.

## Consecuencias
- **Positivas:** exportación segura frente a inyección de fórmulas.
- **Negativas:** solo CSV por ahora; PDF y Excel pendientes.
