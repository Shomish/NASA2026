# Tabla de equivalencias · Modelo del curso ↔ AYNI HEALTH

El modelo clásico del curso (usuarios / libros / préstamos) se mapea de forma directa
al modelo de AYNI HEALTH, cumpliendo la rúbrica sin simplificar el dominio.

| Concepto del curso | Equivalente en AYNI HEALTH | Explicación |
|--------------------|---------------------------|-------------|
| **Usuarios** (login, roles) | **`usuarios`** | Autenticación con email + bcrypt, rol (`administrador`, `medico`, `tripulante`). |
| **Libros** (CRUD) | **`tripulantes`** | CRUD completo de tripulantes (nombre, cargo, edad, peso, altura, misión). |
| **Préstamos** (solicitud → aprobación → devolución) | **`registros`** | Registro de salud con estados `pendiente → validado → cerrado`, `fecha_registro` y `fecha_cierre`. |
| **Código único del préstamo** | **`registros.codigo`** | Generado con `crypto.randomBytes(4).toString('hex').toUpperCase()`. |
| **Fecha de préstamo / devolución** | **`registros.fecha_registro` / `fecha_cierre`** | Marca temporal del alta y del cierre. |
| **Detalle del préstamo** | **tablas 1:1** (`signos_vitales`, `registros_sueno`, `evaluaciones_phq9`, `registros_radiacion`, `notas_diario`) | Cada tipo de registro guarda su detalle específico. |

## Regla de negocio equivalente

- "Solo se puede prestar un libro disponible" → "Solo se registran datos válidos de un tripulante activo".
- "El préstamo se aprueba y luego se devuelve" → "El registro lo valida un médico/administrador y se cierra con `fecha_cierre`".
- "Control de roles" → "El rol `tripulante` solo ve/modifica sus propios datos; `médico` y `administrador` ven todo".

## Validación y auditoría

- Validación con **Zod** en cada endpoint.
- **Auditoría** (`auditoria`) registra creaciones, cambios de rol, validaciones, cierres y borrados.
- **bcrypt** (coste 12) para el hash de contraseñas.
- **Borrado lógico** (`eliminado_en`) y **restauración**.
