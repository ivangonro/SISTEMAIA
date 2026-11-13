import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { supabase } from '../db.js';

export const matricesRouter = Router();
matricesRouter.use(requireAuth);

// GET /matrices?area=&assignment_id=
matricesRouter.get('/', async (req, res) => {
  let q = supabase.from('skill_matrices').select('*').order('generated_at', { ascending: false });
  if (req.user.role === 'supervisor') q = q.eq('area', req.user.area);
  if (req.query.area) q = q.eq('area', req.query.area);
  if (req.query.assignment_id) q = q.eq('assignment_id', req.query.assignment_id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ matrices: data });
});

// GET /matrices/summary -> % de avance por area (para reportes a supervisores)
matricesRouter.get('/summary/areas', async (req, res) => {
  const { data, error } = await supabase
    .from('skill_matrices')
    .select('area, score')
    .is('collaborator', null);
  if (error) return res.status(500).json({ error: error.message });

  const byArea = {};
  for (const row of data || []) {
    (byArea[row.area] ||= []).push(Number(row.score));
  }
  const summary = Object.entries(byArea).map(([area, scores]) => ({
    area,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
    evaluations: scores.length,
  }));
  res.json({ summary });
});

// DELETE /matrices/:id  (admin/rrhh)
matricesRouter.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('skill_matrices').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
