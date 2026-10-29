# ADR-0012 · Bloqueo de login y rate limit persistentes en MySQL

## Estado
Aceptado.

## Contexto
El controlador de autenticación mantenía el bloqueo por intentos fallidos en un `Map` en memoria y el rate limit usaba `MemoryStore`. Al reiniciar el servidor (o con varias instancias) se perdían los contadores y el bloqueo, lo que debilitaba la protección anti fuerza bruta y rompía el despliegue horizontal.

## Decisión
- **Bloqueo de login**: usar las columnas existentes `usuarios.intentos_fallidos` y `usuarios.bloqueado_hasta`. Tras 5 fallos se bloquea 15 min; un login correcto limpia ambos. Si el email no existe no se registra fallo (anti-enumeración y anti-DoS).
- **Rate limit**: `express-rate-limit` con un store propio respaldado por la tabla `rate_limits` (clave, total, `vence_en`, índice por expiración). Se aplica solo a `/auth/login`, `/auth/register`, `/auth/refresh` y `/chat`, cada uno con prefijo de clave para no mezclar contadores. Incluye limpieza oportunista de filas vencidas.
- **Siembra**: `sembrar()` no se ejecuta en `NODE_ENV=production` y usa `findOrCreate`, de modo que nunca resetea `intentos_fallidos` ni `bloqueado_hasta`.

## Consecuencias
- **Positivas:** el bloqueo y los contadores sobreviven al reinicio y se comparten entre instancias; coherente con el despliegue en la nube.
- **Negativas:** cada intento de login/registro/refresh/chat toca MySQL (una lectura + un incremento), latencia adicional aceptable para estos endpoints de baja frecuencia.
- La tabla `rate_limits` se limpia al sembrar en desarrollo/CI (no en producción).
