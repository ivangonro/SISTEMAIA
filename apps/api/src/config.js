import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// El .env vive en la raiz del monorepo, no en apps/api.
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(rootDir, '.env') });

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[config] Falta la variable de entorno: ${key}`);
  }
}

export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-cambiar',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  loadBalancer: {
    maxWorkers: parseInt(process.env.MAX_WORKERS || '4', 10),
    workerTimeoutMs: parseInt(process.env.WORKER_TIMEOUT_MS || '30000', 10),
  },
};
