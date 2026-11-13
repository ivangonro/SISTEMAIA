import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { supabase } from '../db.js';

export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth);

// GET /assignments?area=
assignmentsRouter.get('/', async (req, res) => {
  let q = supabase
    .from('assignments')
    .select('*, evaluations(title, topic_id), topics(title)')
    .order('created_at', { ascending: false });
  if (req.user.role === 'supervisor') q = q.eq('area', req.user.area);
  else if (req.query.area) q = q.eq('area', req.query.area);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ assignments: data });
});

// POST /assignments  { evaluationId, area, dueDate }
assignmentsRouter.post('/', requireRole('admin', 'rrhh'), async (req, res) => {
  const { evaluationId, area, dueDate } = req.body || {};
  if (!evaluationId || !area) return res.status(400).json({ error: 'evaluationId y area son requeridos' });
  const { data: ev } = await supabase.from('evaluations').select('topic_id').eq('id', evaluationId).single();
  const { data, error } = await supabase
    .from('assignments')
    .insert({ evaluation_id: evaluationId, topic_id: ev?.topic_id, area, due_date: dueDate, supervisor_id: req.user.sub })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ assignment: data });
});

assignmentsRouter.put('/:id', requireRole('admin', 'rrhh'), async (req, res) => {
  const { status, dueDate } = req.body || {};
  const { data, error } = await supabase
    .from('assignments').update({ status, due_date: dueDate })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ assignment: data });
});

assignmentsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  const { error } = await supabase.from('assignments').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
