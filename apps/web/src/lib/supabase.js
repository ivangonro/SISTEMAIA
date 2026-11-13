import { createClient } from '@supabase/supabase-js';

// Cliente publico (anon key) solo para Auth de Supabase (Google OAuth).
// Las operaciones de datos siguen pasando por la API propia con JWT.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
