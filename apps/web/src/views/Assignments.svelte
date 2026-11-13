<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';
  import TakeQuiz from '../components/TakeQuiz.svelte';
  export let user;

  let assignments = [], evaluations = [], areas = [], loading = true, error = '', msg = '';
  let showForm = false, showTake = null;
  let form = { evaluationId: '', area: '', dueDate: '' };
  const canEdit = ['admin', 'rrhh'].includes(user.role);

  onMount(load);

  async function load() {
    loading = true; error = '';
    try {
      const [a, e, ar] = await Promise.all([
        api('/assignments'),
        api('/evaluations'),
        api('/users/areas').catch(() => ({ areas: [] })),
      ]);
      assignments = a.assignments; evaluations = e.evaluations; areas = ar.areas;
    } catch (err) { error = err.message; }
    loading = false;
  }

  async function create(e) {
    e.preventDefault(); error = ''; msg = '';
    try {
      await api('/assignments', { method: 'POST', body: form });
      showForm = false; form = { evaluationId: '', area: '', dueDate: '' };
      msg = 'Asignacion creada'; load();
    } catch (err) { error = err.message; }
  }

  async function reportArea(a) {
    error = ''; msg = '';
    try {
      await api('/jobs/report-area', { method: 'POST', body: { assignmentId: a.id } });
      msg = `Reporte de avance enviado al supervisor de ${a.area}`;
    } catch (err) { error = err.message; }
  }

  async function toggleStatus(a) {
    const status = a.status === 'open' ? 'closed' : 'open';
    await api(`/assignments/${a.id}`, { method: 'PUT', body: { status } });
    load();
  }
</script>

<div class="row" style="justify-content:space-between">
  <h2>Asignaciones de evaluaciones</h2>
  {#if canEdit}<button on:click={() => showForm = !showForm}>{showForm ? 'Cancelar' : 'Nueva asignacion'}</button>{/if}
</div>
{#if error}<p class="error">{error}</p>{/if}
{#if msg}<p class="success">{msg}</p>{/if}

{#if showForm}
<form class="card" on:submit={create}>
  <div class="grid cols-2">
    <div>
      <label>Evaluacion</label>
      <select bind:value={form.evaluationId} required>
        <option value="" disabled>Selecciona</option>
        {#each evaluations as ev}<option value={ev.id}>{ev.title}</option>{/each}
      </select>
    </div>
    <div>
      <label>Area</label>
      <input list="areas" bind:value={form.area} required placeholder="Ej. Ventas" />
      <datalist id="areas">{#each areas as a}<option value={a}></option>{/each}</datalist>
    </div>
    <div>
      <label>Fecha limite</label>
      <input type="date" bind:value={form.dueDate} />
    </div>
  </div>
  <button style="margin-top:12px">Asignar</button>
</form>
{/if}

{#if showTake}
  <TakeQuiz assignment={showTake} onDone={() => { showTake = null; load(); }} />
{/if}

{#if loading}<p class="muted">Cargando...</p>{:else}
<table>
  <thead><tr><th>Evaluacion</th><th>Tema</th><th>Area</th><th>Estado</th><th>Vence</th><th></th></tr></thead>
  <tbody>
    {#each assignments as a}
      <tr>
        <td><b>{a.evaluations?.title || '-'}</b></td>
        <td>{a.topics?.title || '-'}</td>
        <td>{a.area}</td>
        <td><span class="badge {a.status === 'open' ? 'ok' : 'warn'}">{a.status}</span></td>
        <td>{a.due_date || '-'}</td>
        <td class="row">
          {#if a.status === 'open' && (canEdit || user.area === a.area)}
            <button class="secondary" on:click={() => showTake = a}>Responder</button>
          {/if}
          {#if canEdit}
            <button class="secondary" on:click={() => reportArea(a)}>Reporte email</button>
            <button class="secondary" on:click={() => toggleStatus(a)}>{a.status === 'open' ? 'Cerrar' : 'Reabrir'}</button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
{/if}

