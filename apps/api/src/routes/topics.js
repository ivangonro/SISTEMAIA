import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { supabase } from '../db.js';

export const topicsRouter = Router();
topicsRouter.use(requireAuth);

// Imagen por defecto segun categoria: todo tema nuevo sin portada
// recibe una imagen acorde automaticamente.
const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
const DEFAULT_IMAGES = {
  'Liderazgo': U('photo-1522071820081-009f0129c71c'),
  'Comunicacion': U('photo-1573496359142-b8d87734a5a2'),
  'Colaboracion': U('photo-1531482615713-2afd69097998'),
  'Gestion del Cambio': U('photo-1454165804606-c3d57bc86b40'),
  'Productividad': U('photo-1484480974693-6ca0a78fb36b'),
  'Recursos Humanos': U('photo-1522202176988-66273c2fd55f'),
};
const FALLBACK_IMAGE = U('photo-1552664730-d307ca884978');

function defaultImageFor(category) {
  return DEFAULT_IMAGES[category] || FALLBACK_IMAGE;
}

topicsRouter.get('/', async (req, res) => {
  const { status, category } = req.query;
  let q = supabase.from('topics').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ topics: data });
});

topicsRouter.post('/', requireRole('admin', 'rrhh'), async (req, res) => {
  const { title, description, image_url, content, category = 'Desarrollo Organizacional' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title es requerido' });
  const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  const payload = {
    title, slug, description,
    image_url: image_url || defaultImageFor(category),
    content, category, status: 'published', created_by: req.user.sub,
  };
  let { data, error } = await supabase.from('topics').insert(payload).select().single();
  // Si la columna image_url aun no existe en la DB, reintenta sin ella.
  if (error && /image_url/.test(error.message)) {
    delete payload.image_url;
    ({ data, error } = await supabase.from('topics').insert(payload).select().single());
  }
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ topic: data });
});

topicsRouter.put('/:id', requireRole('admin', 'rrhh'), async (req, res) => {
  const { title, description, image_url, content, category, status } = req.body || {};
  const { data, error } = await supabase
    .from('topics').update({ title, description, image_url, content, category, status })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ topic: data });
});

topicsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  const { error } = await supabase.from('topics').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
