<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';
  export let user, navigate;

  let stats = { topics: 0, evaluations: 0, assignments: 0, matrices: 0, jobs: 0 };

  onMount(async () => {
    const [t, e, a, m, j] = await Promise.all([
      api('/topics').catch(() => ({ topics: [] })),
      api('/evaluations').catch(() => ({ evaluations: [] })),
      api('/assignments').catch(() => ({ assignments: [] })),
      api('/matrices').catch(() => ({ matrices: [] })),
      api('/jobs').catch(() => ({ jobs: [] })),
    ]);
    stats = {
      topics: t.topics.length, evaluations: e.evaluations.length,
      assignments: a.assignments.length, matrices: m.matrices.length, jobs: j.jobs.length,
    };
  });
</script>

<h2>Dashboard</h2>
<div class="grid cols-2">
  {#each [['Temas', stats.topics, 'topics'], ['Evaluaciones', stats.evaluations, 'evaluations'], ['Asignaciones', stats.assignments, 'assignments'], ['Matriz de habilidades', stats.matrices, 'matrices'], ['Trabajos generados', stats.jobs, 'generate']] as [label, value, view]}
    <div class="card" style="cursor:pointer" on:click={() => navigate(view)}>
      <div class="muted">{label}</div>
      <div style="font-size:36px;font-weight:700">{value}</div>
    </div>
  {/each}
</div>
<div class="card">
  <h3>Flujo del sistema</h3>
  <ol class="muted">
    <li>Crear <b>temas</b> de desarrollo organizacional.</li>
    <li>Generar <b>presentaciones PPTX</b> o <b>videos</b> (decks animados) desde Temas o Generar.</li>
    <li>Crear <b>evaluaciones</b> por tema y <b>asignarlas</b> a un area.</li>
    <li>Las respuestas calculan el <b>% de avance</b> y alimentan la <b>matriz de habilidades</b>.</li>
    <li>Enviar <b>reportes por correo</b> al supervisor del area.</li>
  </ol>
</div>
