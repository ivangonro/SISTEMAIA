import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Cliente con service_role: solo backend, nunca exponer al frontend.
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
