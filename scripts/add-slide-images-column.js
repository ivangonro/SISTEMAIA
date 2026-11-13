import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}
const supabase = createClient(url, key);

console.log('Agregando columna slide_images a la tabla topics...');

const { error } = await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS slide_images jsonb DEFAULT \'{}\';'
});

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('Columna slide_images agregada exitosamente.');
