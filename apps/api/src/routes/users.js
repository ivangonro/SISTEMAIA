import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { supabase } from '../db.js';

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get('/', requireRole('admin', 'rrhh'), async (_req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, email, full_name, role, area, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

usersRouter.get('/areas', async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('area').eq('role', 'supervisor').not('area', 'is', null);
  if (error) return res.status(500).json({ error: error.message });
  const areas = [...new Set((data || []).map(u => u.area).filter(Boolean))];
  res.json({ areas });
});

usersRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  if (req.params.id === req.user.sub) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
