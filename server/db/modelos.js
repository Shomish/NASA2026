/**
 * @fileoverview Modelos del dominio (23 tablas) con Sequelize.
 * Núcleo: Usuario, Tripulante, Registro. Detalle, alertas, nutrición, chat y sistema.
 * @module server/db/modelos
 */

import { DataTypes } from 'sequelize'
import { sequelize } from './conexion.js'

/* ==================== NÚCLEO ==================== */

export const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(100), allowNull: false },
  rol: { type: DataTypes.ENUM('administrador', 'medico', 'tripulante'), allowNull: false, defaultValue: 'tripulante' },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  intentos_fallidos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  bloqueado_hasta: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'usuarios' })

export const Tripulante = sequelize.define('Tripulante', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, unique: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  cargo: { type: DataTypes.STRING(80), allowNull: true },
  edad: { type: DataTypes.INTEGER, allowNull: true },
  peso_kg: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  altura_cm: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  dia_mision: { type: DataTypes.INTEGER, allowNull: true },
  mision: { type: DataTypes.STRING(120), allowNull: true },
  objetivo: { type: DataTypes.STRING(255), allowNull: true },
  alergias: { type: DataTypes.JSON, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'tripulantes' })

export const Registro = sequelize.define('Registro', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING(8), allowNull: false, unique: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tripulante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tipo: { type: DataTypes.ENUM('signos_vitales', 'sueno', 'salud_mental', 'radiacion', 'diario'), allowNull: false },
  estado: { type: DataTypes.ENUM('pendiente', 'validado', 'cerrado'), allowNull: false, defaultValue: 'pendiente' },
  fecha_registro: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_cierre: { type: DataTypes.DATE, allowNull: true },
  eliminado_en: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'registros', paranoid: false })

/* ==================== DETALLE DE REGISTROS (1:1) ==================== */

export const SignoVital = sequelize.define('SignoVital', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  registro_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  presion_sistolica: { type: DataTypes.INTEGER, allowNull: true },
  presion_diastolica: { type: DataTypes.INTEGER, allowNull: true },
  spo2: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
  frecuencia_cardiaca: { type: DataTypes.INTEGER, allowNull: true },
  masa_kg: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  temperatura_c: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
}, { tableName: 'signos_vitales', timestamps: false })

export const RegistroSueno = sequelize.define('RegistroSueno', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  registro_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  horas: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
  calidad: { type: DataTypes.INTEGER, allowNull: true },
  despertares: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'registros_sueno', timestamps: false })

export const EvaluacionPhq9 = sequelize.define('EvaluacionPhq9', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  registro_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  respuestas: { type: DataTypes.JSON, allowNull: false },
  puntaje: { type: DataTypes.INTEGER, allowNull: false },
  nivel: { type: DataTypes.STRING(40), allowNull: true },
  item9_positivo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'evaluaciones_phq9', timestamps: false })

export const RegistroRadiacion = sequelize.define('RegistroRadiacion', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  registro_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dosis_msv: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
  acumulada_msv: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
}, { tableName: 'registros_radiacion', timestamps: false })

export const NotaDiario = sequelize.define('NotaDiario', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  registro_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  titulo: { type: DataTypes.STRING(160), allowNull: false },
  contenido: { type: DataTypes.TEXT, allowNull: false },
  etiquetas: { type: DataTypes.JSON, allowNull: true },
}, { tableName: 'notas_diario', timestamps: false })

/* ==================== ALERTAS ==================== */

export const Alerta = sequelize.define('Alerta', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  tripulante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  registro_origen_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  severidad: { type: DataTypes.ENUM('info', 'atencion', 'critica'), allowNull: false, defaultValue: 'info' },
  mensaje: { type: DataTypes.STRING(255), allowNull: false },
  estado: { type: DataTypes.ENUM('nueva', 'leida', 'resuelta'), allowNull: false, defaultValue: 'nueva' },
  resuelta_por: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'alertas' })

/* ==================== NUTRICIÓN ==================== */

export const Alimento = sequelize.define('Alimento', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  nombre_alternativo: { type: DataTypes.STRING(120), allowNull: true },
  categoria: { type: DataTypes.ENUM('superalimento_andino', 'despensa'), allowNull: false },
  kcal: { type: DataTypes.INTEGER, allowNull: true },
  proteina_g: { type: DataTypes.DECIMAL(6, 1), allowNull: true },
  carbohidratos_g: { type: DataTypes.DECIMAL(6, 1), allowNull: true },
  grasa_g: { type: DataTypes.DECIMAL(6, 1), allowNull: true },
  porcion: { type: DataTypes.STRING(80), allowNull: true },
  beneficio: { type: DataTypes.STRING(255), allowNull: true },
  origen_andino: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  imagen_url: { type: DataTypes.STRING(255), allowNull: true },
  imagen_atribucion: { type: DataTypes.STRING(255), allowNull: true },
  blurhash: { type: DataTypes.STRING(60), allowNull: true },
  imagen_fijada_manual: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'alimentos' })

export const Contramedida = sequelize.define('Contramedida', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  alimento_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  objetivo: { type: DataTypes.STRING(160), allowNull: false },
  dosis_texto: { type: DataTypes.STRING(80), allowNull: true },
  via: { type: DataTypes.STRING(60), allowNull: true },
}, { tableName: 'contramedidas', timestamps: false })

export const PlanNutricional = sequelize.define('PlanNutricional', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  tripulante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  objetivo: { type: DataTypes.STRING(255), allowNull: true },
  alergias: { type: DataTypes.JSON, allowNull: true },
  imc_referencia: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
  vigente: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'planes_nutricionales' })

export const PlanAlimento = sequelize.define('PlanAlimento', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  alimento_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  porcion: { type: DataTypes.STRING(80), allowNull: true },
  frecuencia: { type: DataTypes.STRING(60), allowNull: true },
}, { tableName: 'plan_alimentos', timestamps: false })

export const CacheImagen = sequelize.define('CacheImagen', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  consulta: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  proveedor: { type: DataTypes.STRING(40), allowNull: true },
  url: { type: DataTypes.STRING(255), allowNull: true },
  atribucion: { type: DataTypes.STRING(255), allowNull: true },
  blurhash: { type: DataTypes.STRING(60), allowNull: true },
  expira_en: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'cache_imagenes', timestamps: false })

/* ==================== CHAT DE IA ==================== */

export const ConversacionIA = sequelize.define('ConversacionIA', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tripulante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  titulo: { type: DataTypes.STRING(160), allowNull: true },
  proveedor: { type: DataTypes.STRING(40), allowNull: true },
  modo: { type: DataTypes.ENUM('local', 'nube'), allowNull: false, defaultValue: 'local' },
  estado: { type: DataTypes.ENUM('activa', 'archivada'), allowNull: false, defaultValue: 'activa' },
}, { tableName: 'conversaciones_ia' })

export const MensajeIA = sequelize.define('MensajeIA', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  conversacion_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rol: { type: DataTypes.ENUM('usuario', 'asistente', 'sistema'), allowNull: false },
  contenido: { type: DataTypes.TEXT, allowNull: false },
  motor: { type: DataTypes.ENUM('local', 'nube'), allowNull: false, defaultValue: 'local' },
  escalamiento: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  alerta_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  valoracion: { type: DataTypes.ENUM('util', 'no_util'), allowNull: true },
  tokens_entrada: { type: DataTypes.INTEGER, allowNull: true },
  tokens_salida: { type: DataTypes.INTEGER, allowNull: true },
  latencia_ms: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'mensajes_ia' })

/* ==================== SISTEMA ==================== */

export const UmbralClinico = sequelize.define('UmbralClinico', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  parametro: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  min_normal: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
  max_normal: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
  min_critico: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
  max_critico: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
  unidad: { type: DataTypes.STRING(20), allowNull: true },
  actualizado_por: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'umbrales_clinicos', timestamps: true })

export const SesionRefresh = sequelize.define('SesionRefresh', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  token_hash: { type: DataTypes.STRING(64), allowNull: false },
  familia: { type: DataTypes.STRING(64), allowNull: true },
  expira_en: { type: DataTypes.DATE, allowNull: false },
  revocado_en: { type: DataTypes.DATE, allowNull: true },
  ip: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'sesiones_refresh', timestamps: false })

export const Auditoria = sequelize.define('Auditoria', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  accion: { type: DataTypes.STRING(80), allowNull: false },
  entidad: { type: DataTypes.STRING(60), allowNull: false },
  entidad_id: { type: DataTypes.STRING(40), allowNull: true },
  ip: { type: DataTypes.STRING(45), allowNull: true },
  detalle: { type: DataTypes.JSON, allowNull: true },
}, { tableName: 'auditoria', timestamps: true, updatedAt: false, createdAt: 'creado_en' })

export const OperacionSync = sequelize.define('OperacionSync', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  idempotency_key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  operacion: { type: DataTypes.STRING(60), allowNull: false },
  estado: { type: DataTypes.ENUM('pendiente', 'procesada', 'error'), allowNull: false, defaultValue: 'pendiente' },
}, { tableName: 'operaciones_sync', timestamps: true, updatedAt: false, createdAt: 'creado_en' })

export const ConsentimientoIA = sequelize.define('ConsentimientoIA', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tripulante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  acepta_nube: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  version_texto: { type: DataTypes.STRING(20), allowNull: true },
  fecha_aceptacion: { type: DataTypes.DATE, allowNull: false },
  revocado_en: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'consentimientos_ia', timestamps: false })

export const UsoIA = sequelize.define('UsoIA', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  solicitudes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  tokens_entrada: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  tokens_salida: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'uso_ia', timestamps: false })

export const ConfiguracionIA = sequelize.define('ConfiguracionIA', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  proveedor: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'gemini' },
  modelo: { type: DataTypes.STRING(80), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  limite_diario_por_usuario: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
  limite_mensual_global: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10000 },
  version_prompt_sistema: { type: DataTypes.STRING(20), allowNull: true },
  actualizado_por: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'configuracion_ia', timestamps: true })

/* ==================== ASOCIACIONES ==================== */

Usuario.hasMany(Registro, { foreignKey: 'usuario_id' })
Tripulante.hasMany(Registro, { foreignKey: 'tripulante_id' })
Registro.belongsTo(Usuario, { foreignKey: 'usuario_id' })
Registro.belongsTo(Tripulante, { foreignKey: 'tripulante_id' })

Usuario.hasOne(Tripulante, { foreignKey: 'usuario_id' })
Tripulante.belongsTo(Usuario, { foreignKey: 'usuario_id' })

Registro.hasOne(SignoVital, { foreignKey: 'registro_id' })
Registro.hasOne(RegistroSueno, { foreignKey: 'registro_id' })
Registro.hasOne(EvaluacionPhq9, { foreignKey: 'registro_id' })
Registro.hasOne(RegistroRadiacion, { foreignKey: 'registro_id' })
Registro.hasOne(NotaDiario, { foreignKey: 'registro_id' })

Tripulante.hasMany(Alerta, { foreignKey: 'tripulante_id' })
Alerta.belongsTo(Tripulante, { foreignKey: 'tripulante_id' })

Tripulante.hasMany(PlanNutricional, { foreignKey: 'tripulante_id' })
PlanNutricional.belongsToMany(Alimento, { through: PlanAlimento, foreignKey: 'plan_id', otherKey: 'alimento_id' })
Alimento.hasMany(Contramedida, { foreignKey: 'alimento_id' })

Usuario.hasMany(SesionRefresh, { foreignKey: 'usuario_id' })
Usuario.hasMany(Auditoria, { foreignKey: 'usuario_id' })
Usuario.hasMany(ConversacionIA, { foreignKey: 'usuario_id' })
Tripulante.hasMany(ConversacionIA, { foreignKey: 'tripulante_id' })
ConversacionIA.hasMany(MensajeIA, { foreignKey: 'conversacion_id' })
MensajeIA.belongsTo(Alerta, { foreignKey: 'alerta_id' })

Usuario.hasMany(ConsentimientoIA, { foreignKey: 'usuario_id' })
Usuario.hasMany(UsoIA, { foreignKey: 'usuario_id' })
ConfiguracionIA.belongsTo(Usuario, { foreignKey: 'actualizado_por' })

export const modelos = {
  Usuario, Tripulante, Registro, SignoVital, RegistroSueno, EvaluacionPhq9, RegistroRadiacion,
  NotaDiario, Alerta, Alimento, Contramedida, PlanNutricional, PlanAlimento, CacheImagen,
  ConversacionIA, MensajeIA, UmbralClinico, SesionRefresh, Auditoria, OperacionSync,
  ConsentimientoIA, UsoIA, ConfiguracionIA,
}
