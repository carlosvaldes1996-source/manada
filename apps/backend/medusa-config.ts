import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL

// URL pública del backend. En prod la fija Railway (MEDUSA_BACKEND_URL, p. ej.
// https://api.tumanada.cl); en dev cae al default local. Se usa para construir
// la URL pública de los archivos subidos (ver módulo `file` más abajo).
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

/**
 * Config del backend Manada (Medusa v2).
 *
 * Dev local (sin REDIS_URL): event-bus / cache / workflow-engine quedan
 * in-memory (comportamiento original de `apps/backend/DEV.md`, intacto).
 * Producción (Railway, con REDIS_URL): se activan los módulos Redis durables.
 *
 * Secretos: SIN fallback inseguro. Si faltan JWT/COOKIE_SECRET, Medusa levanta
 * sin secreto fuerte → los secretos reales se inyectan por entorno (Etapa 4).
 */
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    // MVP-first: un solo servicio "shared" (HTTP + Admin + jobs). Se puede
    // separar en server/worker con tracción, solo cambiando esta env var.
    workerMode: (process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server') || 'shared',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    // URL pública del backend para que el Admin (/app) resuelva sus llamadas
    // en producción. En dev queda undefined → Medusa usa el default local.
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    // Módulo custom `pet` (D34): perfil de mascota como fuente única (siempre).
    { resolve: './src/modules/pet' },
    // Módulo custom `payment-method` (API.md §10): referencias a tarjetas
    // guardadas (solo brand/last4/vencimiento + punteros a la pasarela).
    { resolve: './src/modules/payment-method' },
    // Almacenamiento de archivos (packshots subidos desde el Admin). Provider
    // local: guarda en `<cwd>/static` (= el dir que Medusa expone en `/static`,
    // hardcodeado) y devuelve URLs bajo `backend_url`. Por defecto ese URL sería
    // `http://localhost:9000/static` → roto en prod; aquí lo anclamos al backend
    // público. En Railway el filesystem es efímero: montar un volumen en
    // `.medusa/server/static` para que los archivos sobrevivan a cada deploy
    // (ver DEPLOYMENT.md §Runbook). En dev cae al default local, sin cambios.
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: { backend_url: `${BACKEND_URL}/static` },
          },
        ],
      },
    },
    // Emails transaccionales (D45): Notification Module + provider Resend.
    // Sin RESEND_API_KEY el provider entra en modo DEV (loguea, no envía) →
    // no bloquea dev ni el arranque; producción se activa con la env var.
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: './src/modules/resend',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM || 'Manada <onboarding@resend.dev>',
            },
          },
        ],
      },
    },
    // Módulos Redis SOLO cuando hay REDIS_URL (prod). En dev el spread es vacío
    // → se conservan los módulos in-memory por defecto.
    ...(REDIS_URL
      ? [
          {
            resolve: '@medusajs/medusa/cache-redis',
            options: { redisUrl: REDIS_URL },
          },
          {
            resolve: '@medusajs/medusa/event-bus-redis',
            options: { redisUrl: REDIS_URL },
          },
          {
            resolve: '@medusajs/medusa/workflow-engine-redis',
            options: { redis: { url: REDIS_URL } },
          },
        ]
      : []),
  ],
})
