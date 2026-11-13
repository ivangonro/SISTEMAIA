import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { topicsRouter } from './routes/topics.js';
import { evaluationsRouter } from './routes/evaluations.js';
import { assignmentsRouter } from './routes/assignments.js';
import { responsesRouter } from './routes/responses.js';
import { matricesRouter } from './routes/matrices.js';
import { jobsRouter } from './routes/jobs.js';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'sistema-ia-api' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/responses', responsesRouter);
app.use('/api/matrices', matricesRouter);
app.use('/api/jobs', jobsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Export para Vercel serverless
export default app;

// Servidor local (no se ejecuta al importar en Vercel)
if (process.env.NODE_ENV !== 'vercel') {
  app.listen(config.port, () => {
    console.log(`API escuchando en http://localhost:${config.port}`);
  });
}
