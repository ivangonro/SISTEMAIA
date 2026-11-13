import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { findUserByEmail, hashPassword, signToken, verifyPassword, requireAuth } from '../auth.js';
import { supabase } from '../db.js';
import { sendResetEmail } from '../email.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role = 'colaborador', area } = req.body || {};
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password y fullName son requeridos' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres' });
    }
    const exists = await findUserByEmail(email);
    if (exists) return res.status(409).json({ error: 'El correo ya esta registrado' });

    const password_hash = await hashPassword(password);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ email: email.toLowerCase().trim(), password_hash, full_name: fullName, role, area })
      .select('id, email, full_name, role, area, created_at')
      .single();
    if (error) throw error;

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await findUserByEmail(email || '');
    if (!user || !(await verifyPassword(password || '', user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const { password_hash, ...safe } = user;
    res.json({ token: signToken(user), user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login/registro con Google via Supabase Auth.
// El frontend envia el access_token de Supabase; aqui se verifica contra
// Supabase Auth y se crea el usuario en public.users si no existe.
authRouter.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body || {};
    if (!accessToken) return res.status(400).json({ error: 'accessToken requerido' });

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user?.email) {
      return res.status(401).json({ error: 'Token de Supabase invalido' });
    }
    const authUser = data.user;
    const email = authUser.email.toLowerCase().trim();
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split('@')[0];

    let user = await findUserByEmail(email);
    if (!user) {
      const { data: created, error: insErr } = await supabase
        .from('users')
        .insert({
          email,
          // Las cuentas OAuth no usan password; se guarda un hash aleatorio
          // para cumplir el NOT NULL y que el login por password falle.
          password_hash: randomBytes(32).toString('hex'),
          full_name: fullName,
          role: 'colaborador',
        })
        .select('id, email, full_name, role, area, created_at')
        .single();
      if (insErr) throw insErr;
      user = created;
    }

    const { password_hash, ...safe } = user;
    res.json({ token: signToken(safe), user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { data: user } = await supabase
    .from('users').select('id, email, full_name, role, area, created_at')
    .eq('id', req.user.sub).single();
  res.json({ user });
});

// Solicitar recuperación de contraseña
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Por seguridad, no revelamos si el email existe
      return res.json({ message: 'Si el email existe, recibirás instrucciones' });
    }

    // Generar token de reset (válido por 1 hora)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

    const { error } = await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_token_expires: resetTokenExpires })
      .eq('id', user.id);

    if (error) throw error;

    // Enviar email con el link de reset
    await sendResetEmail(user.email, resetToken);

    res.json({ message: 'Si el email existe, recibirás instrucciones' });
  } catch (err) {
    console.error('Error en forgot-password:', err);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Resetear contraseña con token
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Buscar usuario con el token válido y no expirado
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .gt('reset_token_expires', new Date().toISOString())
      .maybeSingle();

    if (error || !user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Actualizar contraseña y limpiar token
    const password_hash = await hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ error: 'Error al actualizar la contraseña' });
  }
});
