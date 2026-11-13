<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';
  export let user;

  let topics = [], evaluations = [], loading = true, error = '', msg = '';
  let selectedTopic = '';
  let questions = [{ text: '', options: ['', '', '', ''], correctIndex: 0 }];
  let title = '';
  const canEdit = ['admin', 'rrhh'].includes(user.role);

  onMount(async () => {
    try {
      topics = (await api('/topics')).topics;
      evaluations = (await api('/evaluations')).evaluations;
    } catch (e) { error = e.message; }
    loading = false;
  });

  function addQuestion() { questions = [...questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }]; }
  function removeQuestion(i) { questions = questions.filter((_, x) => x !== i); }
  function setCorrect(qi, oi) { questions[qi].correctIndex = oi; questions = questions; }

  async function create(e) {
    e.preventDefault(); error = ''; msg = '';
    const qs = questions.filter(q => q.text && q.options.every(o => o));
    if (!qs.length) { error = 'Agrega al menos una pregunta completa'; return; }
    try {
      await api('/evaluations', { method: 'POST', body: { topicId: selectedTopic, title, questions: qs } });
      title = ''; questions = [{ text: '', options: ['', '', '', ''], correctIndex: 0 }];
      evaluations = (await api('/evaluations')).evaluations;
      msg = 'Evaluacion creada';
    } catch (err) { error = err.message; }
  }
</script>

<h2>Evaluaciones</h2>
{#if error}<p class="error">{error}</p>{/if}
{#if msg}<p class="success">{msg}</p>{/if}

{#if canEdit}
<form class="card" on:submit={create}>
  <div class="grid cols-2">
    <div>
      <label>Tema</label>
      <select bind:value={selectedTopic} required>
        <option value="" disabled>Selecciona tema</option>
        {#each topics as t}<option value={t.id}>{t.title}</option>{/each}
      </select>
    </div>
    <div>
      <label>Titulo de la evaluacion</label>
      <input bind:value={title} placeholder="Ej. Quiz Liderazgo - modulo 1" required />
    </div>
  </div>
  {#each questions as q, qi}
    <div class="card" style="background:var(--panel2)">
      <div class="row" style="justify-content:space-between">
        <b>Pregunta {qi + 1}</b>
        {#if questions.length > 1}<button type="button" class="danger" on:click={() => removeQuestion(qi)}>Quitar</button>{/if}
      </div>
      <input placeholder="Texto de la pregunta" bind:value={q.text} style="margin-top:8px" />
      <label>Opciones (marca la correcta)</label>
      {#each q.options as opt, oi}
        <div class="row" style="margin:4px 0">
          <input type="radio" name="correct-{qi}" checked={q.correctIndex === oi} on:change={() => setCorrect(qi, oi)} style="width:auto" />
          <input bind:value={q.options[oi]} placeholder="Opcion {oi + 1}" />
        </div>
      {/each}
    </div>
  {/each}
  <div class="row">
    <button type="button" class="secondary" on:click={addQuestion}>+ Pregunta</button>
    <button>Guardar evaluacion</button>
  </div>
</form>
{/if}

<h3>Evaluaciones registradas</h3>
{#if loading}<p class="muted">Cargando...</p>{:else}
<table>
  <thead><tr><th>Titulo</th><th>Tema</th><th>Preguntas</th><th>Creada</th></tr></thead>
  <tbody>
    {#each evaluations as ev}
      <tr>
        <td><b>{ev.title}</b></td>
        <td>{ev.topics?.title || '-'}</td>
        <td>{(ev.questions || []).length}</td>
        <td class="muted">{new Date(ev.created_at).toLocaleDateString()}</td>
      </tr>
    {/each}
  </tbody>
</table>
{/if}
