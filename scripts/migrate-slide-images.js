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

const { data, error } = await supabase
  .from('topics')
  .select('id')
  .limit(1);

if (error) {
  console.error('Error verificando tabla:', error);
  process.exit(1);
}

console.log('Verificando si la columna slide_images existe...');

try {
  const { error: alterError } = await supabase
    .rpc('exec_sql', {
      sql: 'ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS slide_images jsonb DEFAULT \'{}\';'
    });

  if (alterError) {
    console.log('Método RPC no disponible, intentando con API REST...');
    console.log('Por favor, ejecuta manualmente en Supabase SQL Editor:');
    console.log('ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS slide_images jsonb DEFAULT \'{}\';');
  } else {
    console.log('Columna slide_images agregada exitosamente.');
  }
} catch (e) {
  console.log('Por favor, ejecuta manualmente en Supabase SQL Editor:');
  console.log('ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS slide_images jsonb DEFAULT \'{}\';');
}
