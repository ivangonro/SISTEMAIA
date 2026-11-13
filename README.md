# Sistema IA — Administración y Desarrollo Organizacional

Monorepo con:

- **Frontend**: Svelte + Vite (`apps/web`)
- **Backend**: Node.js + Express (`apps/api`)
- **Base de datos**: Supabase (Postgres)
- **Deploy**: Vercel (2 proyectos: web estático + API serverless)

## Funcionalidades

- Auth con **contraseñas hasheadas en bcrypt** (bcryptjs) + JWT.
- **Temas** de desarrollo organizacional (CRUD).
- **Generación de presentaciones PowerPoint (.pptx)** con `pptxgenjs` y **videos** como decks HTML animados.
- **Evaluaciones** tipo quiz por tema, asignadas a **áreas**.
- Las respuestas calculan **% de avance** y alimentan la **matriz de habilidades** por área/colaborador.
- **Reportes por correo** (nodemailer/SMTP) al supervisor de cada área con su % de avance.
- **Balanceador de cargas** propio en el backend (`src/loadBalancer.js`): reparte trabajos pesados (PPTX, video, emails) entre N workers lógicos con estrategia menor-carga + round-robin y timeout de recuperación.

## Estructura

```
├── apps/
│   ├── api/            # Express + Supabase + bcrypt + JWT + nodemailer + pptxgenjs
│   │   ├── src/        # index.js, routes/, services/, loadBalancer.js
│   │   └── api/        # entry serverless para Vercel
│   └── web/            # Svelte + Vite (SPA)
├── supabase/schema.sql # tablas + RLS
├── scripts/seed.js     # datos iniciales
└── .env.example
```

## Setup local

```bash
npm install
cp .env.example .env   # completar valores
# 1) Ejecutar supabase/schema.sql en Supabase > SQL Editor
# 2) Seed: npm run seed
npm run dev:api        # http://localhost:3001
npm run dev:web        # http://localhost:5173 (proxy /api -> :3001)
```

Usuarios seed: `admin@sistema.local / Admin123!`, `rrhh@sistema.local / Rrhh12345!`, supervisores `sup.ventas@`, `sup.ops@`, `sup.ti@sistema.local` con `Sup12345!`.

## Deploy en Vercel (monorepo)

1. **Proyecto API**: Importa el repo, setea *Root Directory* = `apps/api`. Las env vars se configuran en el dashboard de Vercel.
2. **Proyecto Web**: Otro proyecto del mismo repo, *Root Directory* = `apps/web`. Configura `VITE_API_URL` apuntando al deploy del API si no usas el mismo dominio.
3. En el frontend, `/api/*` usa proxy en dev; en producción ajusta `src/lib/api.js` para apuntar a la URL del API o usa rewrites de Vercel.

## Variables de entorno

Ver `.env.example`. Todo lo configurable está ahí: Supabase, JWT, bcrypt, SMTP, OpenAI (opcional) y balanceador (`MAX_WORKERS`, `WORKER_TIMEOUT_MS`).

## Notas

- La "video" se genera como un deck HTML auto-animado reproducible en navegador (fácil de grabar a video real con cualquier capturador). Para MP4 real se puede integrar `ffmpeg`/`remotion` después.
- Si `OPENAI_API_KEY` está definida, los servicios pueden enriquecerse con IA; sin ella usan plantillas.
- RLS está habilitado; el backend usa `service_role`, así que el acceso siempre pasa por la API con JWT.
