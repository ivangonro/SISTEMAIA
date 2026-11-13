<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';
  export let user;

  let topics = [], jobs = [], lb = null, loading = true, error = '', msg = '';
  let selTopic = '', type = 'presentation', seconds = 8, useTTS = false, useAudio = true;
  const canEdit = ['admin', 'rrhh'].includes(user.role);

  onMount(load);
  async function load() {
    loading = true;
    try {
      const [t, j, s] = await Promise.all([
        api('/topics'),
        api('/jobs'),
        api('/jobs/lb/status').catch(() => null),
      ]);
      topics = t.topics; jobs = j.jobs; lb = s?.loadBalancer || null;
    } catch (e) { error = e.message; }
    loading = false;
  }

  async function generate(e) {
    e.preventDefault(); error = ''; msg = '';
    try {
      await api('/jobs/generate', {
        method: 'POST',
        body: { type, topicId: selTopic, options: { secondsPerSlide: Number(seconds), useTTS, useAudio } },
      });
      msg = 'Trabajo encolado en el balanceador de cargas';
      load();
    } catch (err) { error = err.message; }
  }

  const statusBadge = (s) => ({ queued: 'warn', processing: 'info', done: 'ok', failed: 'err' }[s] || 'info');
</script>

<h2>Generar presentaciones y videos</h2>
{#if error}<p class="error">{error}</p>{/if}
{#if msg}<p class="success">{msg}</p>{/if}

{#if canEdit}
<form class="card" on:submit={generate}>
  <div class="grid cols-2">
    <div>
      <label>Tipo de salida</label>
      <select bind:value={type}>
        <option value="presentation">PowerPoint (.pptx)</option>
        <option value="video">Video (deck HTML animado)</option>
      </select>
    </div>
    <div>
      <label>Tema</label>
      <select bind:value={selTopic} required>
        <option value="" disabled>Selecciona tema</option>
        {#each topics as t}<option value={t.id}>{t.title}</option>{/each}
      </select>
    </div>
    {#if type === 'video'}
      <div>
        <label>Segundos por slide</label>
        <input type="number" min="3" max="30" bind:value={seconds} />
      </div>
      <div>
        <label><input type="checkbox" bind:checked={useTTS} /> Usar narración con voz masculina (requiere OPENAI_API_KEY)</label>
      </div>
      <div>
        <label><input type="checkbox" bind:checked={useAudio} /> Audio de fondo ambient</label>
      </div>
    {/if}
  </div>
  <button style="margin-top:14px" disabled={!selTopic}>Generar</button>
</form>
{/if}

{#if lb}
<div class="card">
  <h3>Balanceador de cargas</h3>
  <p class="muted">Workers: {lb.maxWorkers} · En cola: {lb.queued}</p>
  <div class="row">
    {#each lb.workers as w}
      <span class="badge {w.activeJobs ? 'info' : 'ok'}">{w.id}: {w.activeJobs} activo{w.activeJobs === 1 ? '' : 's'}</span>
    {/each}
  </div>
</div>
{/if}

<h3>Trabajos</h3>
{#if loading}<p class="muted">Cargando...</p>{:else}
<table>
  <thead><tr><th>Tipo</th><th>Estado</th><th>Worker</th><th>Fecha</th><th>Resultado / Error</th></tr></thead>
  <tbody>
    {#each jobs as j}
      <tr>
        <td>{j.type}</td>
        <td><span class="badge {statusBadge(j.status)}">{j.status}</span></td>
        <td class="muted">{j.worker_id || '-'}</td>
        <td class="muted">{new Date(j.created_at).toLocaleString()}</td>
        <td class="muted">{j.error || j.result?.filename || '-'}</td>
      </tr>
    {/each}
  </tbody>
</table>
{/if}
