<script>
  import { api, setSession } from '../lib/api.js';
  import { supabase } from '../lib/supabase.js';
  export let onLogin;

  let mode = 'login'; // login | register
  let email = '', password = '', fullName = '', role = 'colaborador', area = '';
  let error = '', loading = false, googleLoading = false;

  const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80';

  async function googleLogin() {
    error = ''; googleLoading = true;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) { error = oauthError.message; googleLoading = false; }
    // Si no hay error, el navegador redirige a Google y vuelve aqui.
  }

  async function submit(e) {
    e.preventDefault();
    error = ''; loading = true;
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { email, password, fullName, role, area };
      const data = await api(path, { method: 'POST', body });
      setSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      error = err.message;
    } finally { loading = false; }
  }
</script>

<div class="auth-wrap">
  <aside class="hero">
    <img class="hero-img" src={HERO_IMAGE} alt="Equipo de trabajo" />
    <div class="hero-overlay">
      <h1>Desarrollo Organizacional</h1>
      <p class="hero-sub">Plataforma de formación continua.</p>

    </div>
  </aside>

  <main class="auth-main">
    <form class="card auth-card" on:submit={submit}>
      <h2>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h2>
      <p class="muted" style="margin-top:-6px">
        {mode === 'login' ? 'Bienvenido de nuevo' : 'Unete al sistema de formacion'}
      </p>
      {#if mode === 'register'}
        <label>Nombre completo</label>
        <input bind:value={fullName} required />
        <label>Rol</label>
        <select bind:value={role}>
          <option value="colaborador">Colaborador</option>
          <option value="supervisor">Supervisor</option>
          <option value="rrhh">RRHH</option>
          <option value="admin">Admin</option>
        </select>
        {#if role === 'supervisor'}
          <label>Area</label>
          <input bind:value={area} placeholder="Ej. Ventas" />
        {/if}
      {/if}
      <label>Correo</label>
      <input type="email" bind:value={email} required />
      <label>Contrasena</label>
      <input type="password" bind:value={password} minlength="8" required />
      {#if error}<p class="error">{error}</p>{/if}
      <div class="row" style="margin-top:16px">
        <button disabled={loading}>{loading ? '...' : mode === 'login' ? 'Entrar' : 'Registrarse'}</button>
        <button type="button" class="secondary" on:click={() => mode = mode === 'login' ? 'register' : 'login'}>
          {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
        </button>
      </div>

      <div class="oauth-divider"><span>o</span></div>
      <button type="button" class="secondary" style="width:100%" disabled={googleLoading} on:click={googleLogin}>
        {googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}
      </button>
    </form>
  </main>
</div>

<style>
  .auth-wrap {
    display: flex; min-height: 100vh;
  }
  .hero {
    flex: 1.2; position: relative; overflow: hidden;
  }
  .hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover;
  }
  .hero-overlay {
    position: absolute; inset: 0; z-index: 1; padding: 56px;
    background: linear-gradient(180deg, rgba(109,90,224,.72) 0%, rgba(109,90,224,.25) 55%, rgba(109,90,224,0) 100%);
    display: flex; flex-direction: column; justify-content: flex-start;
    color: #fff;
  }
  .hero h1 { font-size: 40px; margin: 0 0 12px; letter-spacing: -0.5px; }
  .hero-sub {
    font-size: 20px; opacity: .95; margin: auto 0 0; letter-spacing: 1px;
    text-transform: uppercase;
  }
  .auth-main {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 40px 24px; background: var(--bg);
  }
  .auth-card { width: 100%; max-width: 420px; }
  .auth-card h2 { margin-bottom: 2px; }
  .oauth-divider {
    display: flex; align-items: center; gap: 12px; margin: 20px 0 12px;
    color: var(--muted); font-size: 13px;
  }
  .oauth-divider::before, .oauth-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }
  @media (max-width: 860px) {
    .auth-wrap { flex-direction: column; }
    .hero { min-height: 320px; }
    .hero-overlay { padding: 32px 24px; }
    .hero h1 { font-size: 28px; }
  }
</style>
