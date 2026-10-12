# Brief de Diseño · AYNI HEALTH (Fase 2B)

## Análisis de referencias (patrones a adaptar, sin copiar)

| Referencia | Qué extraemos |
|-----------|---------------|
| **Linear / Vercel** | Tipografía precisa, bordes con brillo sutil (glow de 1px), rejilla limpia y jerarquía tipográfica estricta. |
| **Stripe** | Degradados animados elegantes como fondo de héroe y claridad extrema del mensaje. |
| **Apple Salud / Oura / Whoop** | Anillos de progreso, narrativa premium de confianza y visualización de datos de salud (no solo números, sino *estado*). |
| **NASA / SpaceX / Axiom** | Estética aeroespacial: escala, oscuridad profunda, datos de telemetría en monoespaciada y sensación de "control de misión". |
| **Framer / Awwwards** | Scroll con reveal, transiciones suaves, storytelling por secciones y microinteracciones con propósito. |
| **Identidad andina** | Textiles (chakana), muros de piedra ensamblada de Sacsayhuamán, paleta teja/dorado/turquesa del Cusco. |

## 5 decisiones de diseño concretas

1. **Identidad "espacial + andino"**: base aeroespacial oscura (telemetría, monoespaciada) fusionada con acentos cálidos andinos (teja, dorado inca, turquesa) y textura textil sutil. Nada de grises fríos.
2. **Estados de salud con icono + texto siempre**: el color nunca es el único canal de información (accesible ante daltonismo). Teja (marca) y rojo (crítico) nunca se confunden porque el crítico siempre va con icono de alerta.
3. **Tipografía editorial para títulos, técnica para datos**: Source Serif 4 en h1/h2 de la landing e informes; IBM Plex Mono solo para cifras/telemetría; IBM Plex Sans para el resto; Atkinson Hyperlegible Next en el chat.
4. **Anillos y "narrativa de estado"**: el puntaje de salud se comunica con anillos de progreso (patrón Oura/Apple), no solo un número, transmitiendo confianza y continuidad.
5. **Mobile-first con zonas de pulgar**: acción principal como FAB inferior, bottom sheets para formularios, barra de 5 destinos. Escritorio hereda el mismo lenguaje visual con sidebar.

## 2 conceptos para el hero de la landing

**Concepto A — "Órbita andina" (recomendado).**
Hero con fondo de partículas estelares sutiles y un anillo de salud holográfico (anillo de progreso + órbita) flotando sobre un degradado teja→dorado. Mockup del dashboard con parallax y widgets flotantes ("Estado global 100/100", "SpO₂ 97%"). Titular con degradado en Source Serif 4.
*Por qué: combina lo espacial (órbita/telemetría) con lo andino (calidez de la paleta), y muestra el producto (dashboard) de inmediato.*

**Concepto B — "Muro de Sacsayhuamán".**
Hero más sobrio: fondo de piedra ensamblada (patrón geométrico sutil) con una línea de telemetría que recorre el muro. Menos "producto", más "institución/infraestructura".
*Descartado como principal porque comunica menos la funcionalidad del monitor.*

## 2 conceptos para el panel izquierdo del login

**Concepto 1 — "Tarjeta de estado en vivo" (recomendado).**
Hero oscuro con las 4 mini-cards de vidrio esmerilado, titular en degradado, y un widget animado "Estado global · 100/100 ↗" con minigráfico que refuerza el producto.
*Por qué: convence al juez de que la app está viva y es un producto, no una plantilla.*

**Concepto 2 — "Misión en contexto".**
Hero más narrativo con imagen/fotografía aeroespacial + cita sobre autonomía. Menos widgets, más emoción.
*Descartado porque pierde la muestra del producto y requiere assets fotográficos que no tenemos.*

---

**Elección propuesta:** Hero = Concepto A ("Órbita andina"); Login = Concepto 1 ("Tarjeta de estado en vivo").
