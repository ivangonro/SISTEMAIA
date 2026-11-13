import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { supabase } from '../db.js';
import { enqueue } from '../loadBalancer.js';
import { buildPresentation } from '../services/presentation.js';
import { buildVideo } from '../services/video.js';
import { sendAreaReport, supervisorsByArea } from '../services/email.js';
import { loadBalancerStatus } from '../loadBalancer.js';

export const jobsRouter = Router();
jobsRouter.use(requireAuth);

// Estado del balanceador de cargas
jobsRouter.get('/lb/status', requireRole('admin', 'rrhh'), (_req, res) => {
  res.json({ loadBalancer: loadBalancerStatus() });
});

// Encola un trabajo pesado a traves del balanceador
async function runJob(type, payload, createdBy) {
  const { data: job, error } = await supabase
    .from('jobs').insert({ type, status: 'queued', payload, created_by: createdBy })
    .select().single();
  if (error) throw error;

  enqueue(job, async (j, worker) => {
    await supabase.from('jobs').update({ status: 'processing', worker_id: worker.id }).eq('id', j.id);
    try {
      let result;
      if (j.type === 'presentation') {
        result = await buildPresentation(j.payload.topicId, j.payload.options || {});
      } else if (j.type === 'video') {
        result = await buildVideo(j.payload.topicId, j.payload.options || {});
      } else if (j.type === 'email_report') {
        result = await sendAreaReport(j.payload.assignmentId, j.payload.email, j.payload.name);
      } else {
        throw new Error(`Tipo de trabajo desconocido: ${j.type}`);
      }
      const safeResult = result.buffer
        ? { filename: result.filename, size: result.buffer.length, topic: result.topic?.title }
        : { ...(result.html ? { filename: result.filename, html: result.html, durationSec: result.durationSec } : {}), ...result };
      await supabase.from('jobs')
        .update({ status: 'done', result: safeResult, finished_at: new Date().toISOString() })
        .eq('id', j.id);
      return safeResult;
    } catch (err) {
      await supabase.from('jobs')
        .update({ status: 'failed', error: err.message, finished_at: new Date().toISOString() })
        .eq('id', j.id);
      throw err;
    }
  }).catch(() => {});

  return job;
}

jobsRouter.post('/generate', requireRole('admin', 'rrhh'), async (req, res) => {
  const { type, topicId, options = {} } = req.body || {};
  if (!['presentation', 'video'].includes(type) || !topicId) {
    return res.status(400).json({ error: 'type (presentation|video) y topicId son requeridos' });
  }
  const job = await runJob(type, { topicId, options }, req.user.sub);
  res.status(202).json({ job });
});

jobsRouter.post('/report-area', requireRole('admin', 'rrhh'), async (req, res) => {
  const { assignmentId } = req.body || {};
  const { data: assignment } = await supabase
    .from('assignments').select('*').eq('id', assignmentId).single();
  if (!assignment) return res.status(404).json({ error: 'Asignacion no encontrada' });

  const supervisors = await supervisorsByArea(assignment.area);
  const targets = supervisors.length
    ? supervisors
    : [{ email: req.body.email, full_name: req.body.name }].filter(s => s.email);
  if (!targets.length) return res.status(400).json({ error: 'No hay supervisor con email para el area' });

  const jobs = [];
  for (const s of targets) {
    jobs.push(await runJob('email_report', { assignmentId, email: s.email, name: s.full_name }, req.user.sub));
  }
  res.status(202).json({ jobs });
});

jobsRouter.get('/', async (req, res) => {
  let q = supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(50);
  if (req.query.status) q = q.eq('status', req.query.status);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ jobs: data });
});

jobsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Trabajo no encontrado' });
  res.json({ job: data });
});

// Descarga directa del PPTX generado (sin pasar por jobs)
jobsRouter.get('/download/presentation/:topicId', requireRole('admin', 'rrhh'), async (req, res) => {
  try {
    const { buffer, filename } = await buildPresentation(req.params.topicId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Descarga directa del video HTML generado (sin pasar por jobs)
jobsRouter.get('/download/video/:topicId', requireRole('admin', 'rrhh'), async (req, res) => {
  try {
    const { html, filename } = await buildVideo(req.params.topicId);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
