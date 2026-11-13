import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { supabase } from '../db.js';

export const responsesRouter = Router();
responsesRouter.use(requireAuth);

function levelFor(score) {
  if (score >= 90) return 'Experto';
  if (score >= 75) return 'Avanzado';
  if (score >= 60) return 'Competente';
  if (score >= 40) return 'En desarrollo';
  return 'Inicial';
}

// POST /responses  { assignmentId, answers:[{questionId, selectedIndex}] }
// Calcula score %, guarda respuesta y actualiza matriz de habilidades.
responsesRouter.post('/', async (req, res) => {
  try {
    const { assignmentId, answers, collaboratorName } = req.body || {};
    if (!assignmentId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'assignmentId y answers[] son requeridos' });
    }

    const { data: assignment, error: aErr } = await supabase
      .from('assignments').select('*, evaluations(questions, title), topics(title)').eq('id', assignmentId).single();
    if (aErr || !assignment) return res.status(404).json({ error: 'Asignacion no encontrada' });

    const questions = assignment.evaluations?.questions || [];
    const byId = Object.fromEntries(questions.map(q => [q.id, q]));

    let correct = 0;
    const normalized = answers.map(a => {
      const q = byId[a.questionId];
      const ok = q && a.selectedIndex === q.correctIndex;
      if (ok) correct++;
      return { questionId: a.questionId, selectedIndex: a.selectedIndex, correct: !!ok };
    });
    const score = questions.length ? Math.round((correct / questions.length) * 10000) / 100 : 0;

    const { data: response, error } = await supabase
      .from('responses')
      .insert({
        assignment_id: assignmentId,
        user_id: req.user.sub,
        answers: normalized,
        score,
      })
      .select().single();
    if (error) throw error;

    // Actualizar matriz de habilidades (por colaborador si se indica nombre, si no agregado del area)
    await supabase.from('skill_matrices').upsert({
      assignment_id: assignmentId,
      area: assignment.area,
      collaborator: collaboratorName || null,
      topic_title: assignment.topics?.title || assignment.evaluations?.title || 'Evaluacion',
      score,
      level: levelFor(score),
    }, { onConflict: 'assignment_id,area,collaborator,topic_title' });

    res.status(201).json({ response, score, level: levelFor(score) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /responses?assignment_id=
responsesRouter.get('/', async (req, res) => {
  let q = supabase.from('responses').select('*').order('submitted_at', { ascending: false });
  if (req.query.assignment_id) q = q.eq('assignment_id', req.query.assignment_id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ responses: data });
});
