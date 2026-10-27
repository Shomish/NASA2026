# ADR-0011 · Reglas de acceso y estados de registro

## Estado
Aceptado.

## Contexto
El núcleo (2A) expone tripulantes, registros y usuarios. Es necesario fijar quién puede leer/escribir cada entidad y la máquina de estados de un registro, para cerrar los vectores de mass assignment y de acceso indebido (IDOR).

## Decisión

**Reglas de acceso**

| Entidad | Lectura | Escritura |
|---------|---------|-----------|
| `tripulantes` | Administrador y médico ven todos; el tripulante solo el suyo. | Solo administrador (crear, editar, desactivar). |
| `registros` | Administrador y médico ven todos; el tripulante solo los propios. | Crear/editar/borrar/restaurar el propietario (tripulante) o médico/administrador. Validar y cerrar solo médico/administrador. |
| `usuarios` | Solo administrador. | Solo administrador (crear, cambiar rol, desactivar). Se protege al último administrador activo (`ULTIMO_ADMIN`, 409). |

**Estados de registro**: `pendiente → validado → cerrado`.
- `validar` solo desde `pendiente` (médico/administrador).
- `cerrar` solo desde `validado` (médico/administrador), fijando `fecha_cierre`.
- Un registro `cerrado` no se puede editar.
- El borrado es lógico (`eliminado_en`) y reversible (`restaurar`), con la misma regla de acceso que el borrado.

**Mass assignment**: cada endpoint valida con Zod y solo acepta los campos de su tabla; las claves extra (`estado`, `rol`, `usuario_id`, `codigo`, `registro_id`, `id`, …) se descartan. El detalle de cada registro se valida con un esquema por tipo, lo que impide inyectar `registro_id` ajeno.

## Consecuencias
- **Positivas:** el frontend delega la autorización en el servidor (el rol solo decide qué controles mostrar); los ataques de mass assignment e IDOR quedan cubiertos por pruebas de integración (`reglas.test.js`).
- **Negativas:** los estados son estrictos; una acción fuera de orden devuelve `409 ESTADO_INVALIDO` y el cliente debe mostrar el mensaje.
- El código crypto usa `generarCodigoUnico()` con reintento ante colisión (el código es único en `registros`).
