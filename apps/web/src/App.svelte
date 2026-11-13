<script>
  import { onMount } from 'svelte';
  import { api, getUser, setSession, clearSession } from './lib/api.js';
  import { supabase } from './lib/supabase.js';
  import Login from './views/Login.svelte';
  import Dashboard from './views/Dashboard.svelte';
  import Topics from './views/Topics.svelte';
  import Evaluations from './views/Evaluations.svelte';
  import Assignments from './views/Assignments.svelte';
  import Matrices from './views/Matrices.svelte';
  import Generate from './views/Generate.svelte';
  import UsersView from './views/Users.svelte';
  import Geofences from './views/Geofences.svelte';
  import './styles.css';

  let user = null;
  let view = 'dashboard';

  const views = {
    dashboard: 'Dashboard', topics: 'Temas', evaluations: 'Evaluaciones',
    assignments: 'Asignaciones', matrices: 'Matrices', generate: 'Generar', users: 'Usuarios',
    geofences: 'Geocercas',
  };

  onMount(async () => {
    user = getUser();
    if (user) return;

    // Retorno del OAuth de Google: Supabase deja la sesion en el cliente;
    // la canjeamos por el JWT propio via /auth/google (crea el usuario si no existe).
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      try {
        const data = await api('/auth/google', {
          method: 'POST',
          body: { accessToken: session.access_token },
        });
        setSession(data.token, data.user);
        user = data.user;
        return;
      } catch { /* token invalido: se queda en login */ }
    }
    view = 'login';
  });

  async function logout() {
    clearSession();
    await supabase.auth.signOut();
    user = null; view = 'login';
  }

  function navigate(v) { view = v; }
</script>

{#if !user || view === 'login'}
  <Login onLogin={(u) => { user = u; view = 'dashboard'; }} />
{:else}
  <div class="layout">
    <aside class="sidebar">
      <h1>Sistema IA</h1>
      <p class="muted">{user.full_name} · {user.role}</p>
      <nav>
        {#each Object.entries(views) as [key, label]}
          {#if key !== 'users' || ['admin','rrhh'].includes(user.role)}
            <button class="navbtn" class:active={view === key} on:click={() => navigate(key)}>{label}</button>
          {/if}
        {/each}
      </nav>
      <button class="secondary" style="margin-top:auto" on:click={logout}>Cerrar sesion</button>
    </aside>
    <main class="content">
      {#if view === 'dashboard'}<Dashboard {user} {navigate} />{/if}
      {#if view === 'topics'}<Topics {user} />{/if}
      {#if view === 'evaluations'}<Evaluations {user} />{/if}
      {#if view === 'assignments'}<Assignments {user} />{/if}
      {#if view === 'matrices'}<Matrices {user} />{/if}
      {#if view === 'generate'}<Generate {user} />{/if}
      {#if view === 'users'}<UsersView />{/if}
      {#if view === 'geofences'}<Geofences />{/if}
    </main>
  </div>
{/if}

<style>
  .layout { display: flex; min-height: 100vh; }
  .sidebar {
    width: 230px; background: var(--panel); border-right: 1px solid var(--border);
    padding: 24px 16px;
    display: flex; flex-direction: column; gap: 8px; position: sticky; top: 0; height: 100vh;
  }
  .sidebar h1 { font-size: 20px; margin: 0 0 4px; color: var(--accent); }
  nav { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }
  .navbtn {
    background: transparent; color: var(--muted); text-align: left;
    padding: 10px 12px; border-radius: 10px; font-weight: 500;
  }
  .navbtn:hover { background: var(--panel2); color: var(--text); }
  .navbtn.active { background: linear-gradient(135deg, var(--accent), #6d5ae0); color: var(--on-accent); }
  .content { flex: 1; padding: 32px; max-width: 1200px; }
  h2 { margin-top: 0; }
</style>
