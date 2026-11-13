<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';
  export let assignment, onDone;

  let evalData = null, answers = [], step = 0, result = null, error = '', collaboratorName = '';

  onMount(async () => {
    try {
      const evId = assignment.evaluation_id;
      evalData = (await api(`/evaluations/${evId}`)).evaluation;
      answers = evalData.questions.map(q => ({ questionId: q.id, selectedIndex: null }));
    } catch (e) { error = e.message; }
  });

  function choose(qi, oi) { answers[qi].selectedIndex = oi; answers = answers; }

  async function submit() {
    error = '';
    const unanswered = answers.filter(a => a.selectedIndex === null).length;
    if (unanswered && !confirm(`Hay ${unanswered} preguntas sin responder. ¿Enviar igual?`)) return;
    try {
      const data = await api('/responses', {
        method: 'POST',
        body: { assignmentId: assignment.id, answers, collaboratorName: collaboratorName || undefined },
      });
      result = data;
    } catch (e) { error = e.message; }
  }
</script>

<div class="card" style="border:2px solid var(--accent)">
  {#if result}
    <h3>Resultado</h3>
    <p style="font-size:40px;font-weight:700;color:{result.score >= 60 ? 'var(--ok)' : 'var(--danger)'}">{result.score}%</p>
    <p class="muted">Nivel: <b>{result.level}</b> — registrado en la matriz de habilidades de {assignment.area}.</p>
    <button on:click={onDone}>Cerrar</button>
  {:else if evalData}
    <h3>{evalData.title}</h3>
    <p class="muted">Area: {assignment.area} · {evalData.questions.length} preguntas</p>
    <label>Tu nombre (opcional, para matriz individual)</label>
    <input bind:value={collaboratorName} placeholder="Ej. Juan Perez" />
    {#each evalData.questions as q, qi}
      <div class="card" style="background:var(--panel2)">
        <b>{qi + 1}. {q.text}</b>
        {#each q.options as opt, oi}
          <div class="row" style="margin:6px 0">
            <input type="radio" name="q-{qi}" checked={answers[qi]?.selectedIndex === oi} on:change={() => choose(qi, oi)} style="width:auto" />
            <span>{opt}</span>
          </div>
        {/each}
      </div>
    {/each}
    {#if error}<p class="error">{error}</p>{/if}
    <button on:click={submit}>Enviar respuestas</button>
    <button class="secondary" on:click={onDone}>Cancelar</button>
  {:else}
    <p class="muted">{error || 'Cargando evaluacion...'}</p>
  {/if}
</div>
