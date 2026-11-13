import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { supabase } from '../db.js';

export const evaluationsRouter = Router();
evaluationsRouter.use(requireAuth);

// GET /evaluations?topic_id=
evaluationsRouter.get('/', async (req, res) => {
  let q = supabase.from('evaluations').select('*, topics(title)').order('created_at', { ascending: false });
  if (req.query.topic_id) q = q.eq('topic_id', req.query.topic_id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ evaluations: data });
});

// POST /evaluations  { topicId, title, questions:[{text, options[], correctIndex}] }
evaluationsRouter.post('/', requireRole('admin', 'rrhh'), async (req, res) => {
  const { topicId, title, questions } = req.body || {};
  if (!topicId || !title || !Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ error: 'topicId, title y questions[] son requeridos' });
  }
  const normalized = questions.map((q, i) => ({
    id: q.id || `q${i + 1}`,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
  }));
  const { data, error } = await supabase
    .from('evaluations').insert({ topic_id: topicId, title, questions: normalized })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ evaluation: data });
});

// GET /evaluations/:id  (incluye preguntas; el frontend decide si oculta correctIndex al alumno)
evaluationsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('evaluations').select('*, topics(title, description)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Evaluacion no encontrada' });
  res.json({ evaluation: data });
});
