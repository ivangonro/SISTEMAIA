import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}
const supabase = createClient(url, key);

console.log('Intentando agregar columna slide_images...');

// Usar la API REST para ejecutar SQL mediante pg-rest
const { data, error } = await supabase
  .from('topics')
  .select('id, slide_images')
  .limit(1);

if (error) {
  if (error.message.includes('slide_images')) {
    console.log('La columna slide_images no existe. Ejecutando ALTER TABLE...');
    // Intentar usando la función exec_sql si está disponible
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS slide_images jsonb DEFAULT \'{}\';'
    });
    if (rpcError) {
      console.error('No se pudo ejecutar el ALTER TABLE vía RPC:', rpcError.message);
      console.log('\nPor favor, ejecuta manualmente en Supabase SQL Editor:');
      console.log('ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS slide_images jsonb DEFAULT \'{}\';');
    } else {
      console.log('Columna slide_images agregada exitosamente.');
    }
  } else {
    console.error('Error verificando tabla:', error.message);
  }
} else {
  console.log('La columna slide_images ya existe en la tabla topics.');
}
