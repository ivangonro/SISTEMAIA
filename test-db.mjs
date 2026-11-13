// Prueba de conexion a Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
function get(key) {
  const m = envText.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}

const url = get('SUPABASE_URL');
const serviceKey = get('SUPABASE_SERVICE_ROLE_KEY').replace(/\s*#.*$/, '').trim();
const anonKey = get('SUPABASE_ANON_KEY').replace(/\s*#.*$/, '').trim();

console.log('URL:', url);
console.log('service_key largo:', serviceKey.length, '| termina en:', serviceKey.slice(-15));
console.log('anon_key largo:', anonKey.length, '| termina en:', anonKey.slice(-15));

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1) Ping basico: listar tablas via REST
const { data, error } = await supabase.from('users').select('id').limit(1);
console.log('\n--- Query a tabla users ---');
if (error) console.log('ERROR:', error.message, '| code:', error.code);
else console.log('OK, filas devueltas:', data?.length);

// 2) Verificar que existe la tabla topics
const t = await supabase.from('topics').select('id').limit(1);
console.log('topics:', t.error ? `ERROR ${t.error.message}` : 'OK');

// 3) Probar anon key tambien
const pub = createClient(url, anonKey, { auth: { persistSession: false } });
const a = await pub.from('topics').select('id').limit(1);
console.log('anon -> topics:', a.error ? `ERROR ${a.error.message}` : 'OK (RLS permite lectura)');
