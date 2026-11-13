<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';

  let users = [], loading = true, error = '';

  onMount(async () => {
    try { users = (await api('/users')).users; }
    catch (e) { error = e.message; }
    loading = false;
  });

  async function remove(id) {
    if (!confirm('¿Eliminar usuario?')) return;
    try { await api(`/users/${id}`, { method: 'DELETE' }); users = users.filter(u => u.id !== id); }
    catch (e) { error = e.message; }
  }
</script>

<h2>Usuarios</h2>
{#if error}<p class="error">{error}</p>{/if}
{#if loading}<p class="muted">Cargando...</p>{:else}
<table>
  <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Area</th><th></th></tr></thead>
  <tbody>
    {#each users as u}
      <tr>
        <td><b>{u.full_name}</b></td>
        <td>{u.email}</td>
        <td><span class="badge info">{u.role}</span></td>
        <td>{u.area || '-'}</td>
        <td><button class="danger" on:click={() => remove(u.id)}>Eliminar</button></td>
      </tr>
    {/each}
  </tbody>
</table>
<p class="muted">Nota: las contrasenas se almacenan con hash bcrypt. El registro publico esta disponible en la pantalla de login.</p>
{/if}
