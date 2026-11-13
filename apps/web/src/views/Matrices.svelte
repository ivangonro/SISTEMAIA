<script>
  import { onMount } from 'svelte';
  import { api } from '../lib/api.js';

  let matrices = [], summary = [], areas = [], loading = true, error = '';
  let filterArea = '';

  onMount(load);
  async function load() {
    loading = true; error = '';
    try {
      const [m, s] = await Promise.all([
        api('/matrices'),
        api('/matrices/summary/areas').catch(() => ({ summary: [] })),
      ]);
      matrices = m.matrices; summary = s.summary;
    } catch (e) { error = e.message; }
    loading = false;
  }

  const levelColor = (l) => ({
    'Inicial': 'err', 'En desarrollo': 'warn', 'Competente': 'info',
    'Avanzado': 'ok', 'Experto': 'ok',
  }[l] || 'info');
</script>

<h2>Matricas de habilidades</h2>
{#if error}<p class="error">{error}</p>{/if}

<h3>% de avance por area</h3>
{#if summary.length}
<table>
  <thead><tr><th>Area</th><th>Evaluaciones</th><th>Avance promedio</th><th>Nivel</th></tr></thead>
  <tbody>
    {#each summary as s}
      {@const lvl = s.avgScore >= 75 ? 'Avanzado' : s.avgScore >= 60 ? 'Competente' : s.avgScore >= 40 ? 'En desarrollo' : 'Inicial'}
      <tr>
        <td><b>{s.area}</b></td>
        <td>{s.evaluations}</td>
        <td>
          <div class="row">
            <div style="flex:1;background:#0b1220;border-radius:6px;height:14px;overflow:hidden">
              <div style="width:{s.avgScore}%;background:var(--accent);height:100%"></div>
            </div>
            <span>{s.avgScore}%</span>
          </div>
        </td>
        <td><span class="badge {levelColor(lvl)}">{lvl}</span></td>
      </tr>
    {/each}
  </tbody>
</table>
{:else}<p class="muted">Aun no hay datos. Responde evaluaciones para generar la matriz.</p>{/if}

<h3 style="margin-top:24px">Detalle por tema / colaborador</h3>
{#if loading}<p class="muted">Cargando...</p>{:else}
<table>
  <thead><tr><th>Area</th><th>Colaborador</th><th>Tema</th><th>Score</th><th>Nivel</th><th>Fecha</th></tr></thead>
  <tbody>
    {#each matrices as m}
      <tr>
        <td>{m.area}</td>
        <td>{#if m.collaborator}{m.collaborator}{:else}<span class="muted">(area)</span>{/if}</td>
        <td>{m.topic_title}</td>
        <td><b>{Number(m.score).toFixed(1)}%</b></td>
        <td><span class="badge {levelColor(m.level)}">{m.level}</span></td>
        <td class="muted">{new Date(m.generated_at).toLocaleDateString()}</td>
      </tr>
    {/each}
  </tbody>
</table>
{/if}
