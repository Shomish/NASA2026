-- ============================================================
-- SOLO REFERENCIA. NO USAR PARA CREAR LA BASE.
-- La base se crea con `npm run db:setup` (modelos Sequelize + migraciones).
-- Este script puede estar desactualizado (puerto, ENUM y tablas nuevas).
-- ============================================================

-- ============================================================
-- AYNI HEALTH · Esquema relacional completo (MySQL)
-- Ejecutar desde Workbench en 127.0.0.1:3313
-- ============================================================

CREATE DATABASE IF NOT EXISTS ayni_health CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS ayni_health_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ayni_health;

-- NÚCLEO
CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  rol ENUM('administrador','medico','tripulante') NOT NULL DEFAULT 'tripulante',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  bloqueado_hasta DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE tripulantes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  cargo VARCHAR(80) NULL,
  edad INT NULL,
  peso_kg DECIMAL(5,1) NULL,
  altura_cm DECIMAL(5,1) NULL,
  dia_mision INT NULL,
  mision VARCHAR(120) NULL,
  objetivo VARCHAR(255) NULL,
  alergias JSON NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tripulante_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE registros (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(8) NOT NULL UNIQUE,
  usuario_id INT UNSIGNED NOT NULL,
  tripulante_id INT UNSIGNED NOT NULL,
  tipo ENUM('signos_vitales','sueno','salud_mental','radiacion','diario') NOT NULL,
  estado ENUM('pendiente','validado','cerrado') NOT NULL DEFAULT 'pendiente',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME NULL,
  eliminado_en DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_registros_tripulante_fecha (tripulante_id, fecha_registro),
  INDEX idx_registros_tipo (tipo),
  INDEX idx_registros_estado (estado),
  CONSTRAINT fk_registro_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_registro_tripulante FOREIGN KEY (tripulante_id) REFERENCES tripulantes(id)
) ENGINE=InnoDB;

-- DETALLE DE REGISTROS (1:1)
CREATE TABLE signos_vitales (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registro_id INT UNSIGNED NOT NULL,
  presion_sistolica INT NULL,
  presion_diastolica INT NULL,
  spo2 DECIMAL(4,1) NULL,
  frecuencia_cardiaca INT NULL,
  masa_kg DECIMAL(5,1) NULL,
  temperatura_c DECIMAL(4,1) NULL,
  CONSTRAINT fk_signo_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE registros_sueno (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registro_id INT UNSIGNED NOT NULL,
  horas DECIMAL(4,1) NOT NULL,
  calidad INT NULL,
  despertares INT NULL,
  CONSTRAINT fk_sueno_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE evaluaciones_phq9 (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registro_id INT UNSIGNED NOT NULL,
  respuestas JSON NOT NULL,
  puntaje INT NOT NULL,
  nivel VARCHAR(40) NULL,
  item9_positivo BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_phq9_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE registros_radiacion (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registro_id INT UNSIGNED NOT NULL,
  dosis_msv DECIMAL(6,2) NOT NULL,
  acumulada_msv DECIMAL(8,2) NOT NULL,
  CONSTRAINT fk_radiacion_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notas_diario (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registro_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  contenido TEXT NOT NULL,
  etiquetas JSON NULL,
  CONSTRAINT fk_nota_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ALERTAS
CREATE TABLE alertas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tripulante_id INT UNSIGNED NOT NULL,
  registro_origen_id INT UNSIGNED NULL,
  severidad ENUM('info','atencion','critica') NOT NULL DEFAULT 'info',
  mensaje VARCHAR(255) NOT NULL,
  estado ENUM('nueva','leida','resuelta') NOT NULL DEFAULT 'nueva',
  resuelta_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerta_tripulante FOREIGN KEY (tripulante_id) REFERENCES tripulantes(id),
  CONSTRAINT fk_alerta_registro FOREIGN KEY (registro_origen_id) REFERENCES registros(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- NUTRICIÓN
CREATE TABLE alimentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  nombre_alternativo VARCHAR(120) NULL,
  categoria ENUM('superalimento_andino','despensa') NOT NULL,
  kcal INT NULL,
  proteina_g DECIMAL(6,1) NULL,
  carbohidratos_g DECIMAL(6,1) NULL,
  grasa_g DECIMAL(6,1) NULL,
  porcion VARCHAR(80) NULL,
  beneficio VARCHAR(255) NULL,
  origen_andino BOOLEAN NOT NULL DEFAULT TRUE,
  imagen_url VARCHAR(255) NULL,
  imagen_atribucion VARCHAR(255) NULL,
  blurhash VARCHAR(60) NULL,
  imagen_fijada_manual BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE contramedidas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alimento_id INT UNSIGNED NOT NULL,
  objetivo VARCHAR(160) NOT NULL,
  dosis_texto VARCHAR(80) NULL,
  via VARCHAR(60) NULL,
  CONSTRAINT fk_contramedida_alimento FOREIGN KEY (alimento_id) REFERENCES alimentos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE planes_nutricionales (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tripulante_id INT UNSIGNED NOT NULL,
  objetivo VARCHAR(255) NULL,
  alergias JSON NULL,
  imc_referencia DECIMAL(4,1) NULL,
  vigente BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_plan_tripulante FOREIGN KEY (tripulante_id) REFERENCES tripulantes(id)
) ENGINE=InnoDB;

CREATE TABLE plan_alimentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_id INT UNSIGNED NOT NULL,
  alimento_id INT UNSIGNED NOT NULL,
  porcion VARCHAR(80) NULL,
  frecuencia VARCHAR(60) NULL,
  CONSTRAINT fk_plan_alimento_plan FOREIGN KEY (plan_id) REFERENCES planes_nutricionales(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_alimento_alimento FOREIGN KEY (alimento_id) REFERENCES alimentos(id)
) ENGINE=InnoDB;

CREATE TABLE cache_imagenes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consulta VARCHAR(190) NOT NULL UNIQUE,
  proveedor VARCHAR(40) NULL,
  url VARCHAR(255) NULL,
  atribucion VARCHAR(255) NULL,
  blurhash VARCHAR(60) NULL,
  expira_en DATETIME NULL
) ENGINE=InnoDB;

-- CHAT DE IA
CREATE TABLE conversaciones_ia (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  tripulante_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(160) NULL,
  proveedor VARCHAR(40) NULL,
  modo ENUM('local','nube') NOT NULL DEFAULT 'local',
  estado ENUM('activa','archivada') NOT NULL DEFAULT 'activa',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_conversacion_tripulante FOREIGN KEY (tripulante_id) REFERENCES tripulantes(id)
) ENGINE=InnoDB;

CREATE TABLE mensajes_ia (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversacion_id INT UNSIGNED NOT NULL,
  rol ENUM('usuario','asistente','sistema') NOT NULL,
  contenido TEXT NOT NULL,
  motor ENUM('local','nube') NOT NULL DEFAULT 'local',
  escalamiento BOOLEAN NOT NULL DEFAULT FALSE,
  alerta_id INT UNSIGNED NULL,
  valoracion ENUM('util','no_util') NULL,
  tokens_entrada INT NULL,
  tokens_salida INT NULL,
  latencia_ms INT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mensaje_conversacion FOREIGN KEY (conversacion_id) REFERENCES conversaciones_ia(id) ON DELETE CASCADE,
  CONSTRAINT fk_mensaje_alerta FOREIGN KEY (alerta_id) REFERENCES alertas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- SISTEMA
CREATE TABLE umbrales_clinicos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parametro VARCHAR(60) NOT NULL UNIQUE,
  min_normal DECIMAL(8,2) NULL,
  max_normal DECIMAL(8,2) NULL,
  min_critico DECIMAL(8,2) NULL,
  max_critico DECIMAL(8,2) NULL,
  unidad VARCHAR(20) NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_umbral_usuario FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE sesiones_refresh (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  familia VARCHAR(64) NULL,
  expira_en DATETIME NOT NULL,
  revocado_en DATETIME NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE auditoria (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  accion VARCHAR(80) NOT NULL,
  entidad VARCHAR(60) NOT NULL,
  entidad_id VARCHAR(40) NULL,
  ip VARCHAR(45) NULL,
  detalle JSON NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE operaciones_sync (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  idempotency_key VARCHAR(80) NOT NULL UNIQUE,
  usuario_id INT UNSIGNED NULL,
  operacion VARCHAR(60) NOT NULL,
  estado ENUM('pendiente','procesada','error') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sync_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE consentimientos_ia (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  tripulante_id INT UNSIGNED NOT NULL,
  acepta_nube BOOLEAN NOT NULL DEFAULT FALSE,
  version_texto VARCHAR(20) NULL,
  fecha_aceptacion DATETIME NOT NULL,
  revocado_en DATETIME NULL,
  CONSTRAINT fk_consentimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_consentimiento_tripulante FOREIGN KEY (tripulante_id) REFERENCES tripulantes(id)
) ENGINE=InnoDB;

CREATE TABLE uso_ia (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  solicitudes INT NOT NULL DEFAULT 0,
  tokens_entrada INT NOT NULL DEFAULT 0,
  tokens_salida INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_uso_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE configuracion_ia (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor VARCHAR(40) NOT NULL DEFAULT 'gemini',
  modelo VARCHAR(80) NULL,
  activo BOOLEAN NOT NULL DEFAULT FALSE,
  limite_diario_por_usuario INT NOT NULL DEFAULT 50,
  limite_mensual_global INT NOT NULL DEFAULT 10000,
  version_prompt_sistema VARCHAR(20) NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_ia_usuario FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;
