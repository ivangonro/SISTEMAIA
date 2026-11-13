<script>
  import { onMount } from 'svelte';
  import { api, apiDownload } from '../lib/api.js';
  export let user;

  let topics = [], loading = true, error = '', msg = '';
  let form = { title: '', description: '', image_url: '', slide_images: { cover: '', objectives: '', content: '', activity: '', evaluation: '', close: '' }, slide_urls_text: '', content: '', category: 'Desarrollo Organizacional' };
  let showForm = false;
  const canEdit = ['admin', 'rrhh'].includes(user.role);

  const PLANTILLA_30MIN = `0-5 min · APERTURA Y OBJETIVO
Objetivo: [que lograra el participante]
Idea fuerza: [frase central del tema]
Dinámica de apertura: [dinamica para romper el hielo]
5-10 min · CONTEXTO
[concepto clave 1]
[concepto clave 2]
10-18 min · DESARROLLO
[herramienta o tecnica principal con ejemplo]
[error comun y como evitarlo]
18-24 min · PRACTICA
[dinamica grupal o ejercicio guiado]
24-28 min · PLAN DE ACCION
[compromisos concretos con fecha y responsable]
28-30 min · CIERRE
[repaso de compromisos y evaluacion del dia]`;

  async function load() {
    loading = true;
    try { topics = (await api('/topics')).topics; }
    catch (e) { error = e.message; }
    loading = false;
  }
  onMount(load);

  async function create(e) {
    e.preventDefault(); error = ''; msg = '';
    try {
      const slide_urls = form.slide_urls_text.split('\n').map(s => s.trim()).filter(Boolean);
      await api('/topics', { method: 'POST', body: { ...form, slide_urls } });
      form = { title: '', description: '', image_url: '', slide_images: { cover: '', objectives: '', content: '', activity: '', evaluation: '', close: '' }, slide_urls_text: '', content: '', category: 'Desarrollo Organizacional' };
      showForm = false; msg = 'Tema creado'; load();
    } catch (err) { error = err.message; }
  }

  async function remove(id) {
    if (!confirm('¿Eliminar tema?')) return;
    try { await api(`/topics/${id}`, { method: 'DELETE' }); load(); }
    catch (err) { error = err.message; }
  }

  function agendaLines(content) {
    return (content || '').split(/\n+/).map(l => l.trim()).filter(Boolean);
  }
</script>

<div class="row" style="justify-content:space-between">
  <h2>Temas de desarrollo organizacional</h2>
  {#if canEdit}<button on:click={() => showForm = !showForm}>{showForm ? 'Cancelar' : 'Nuevo tema'}</button>{/if}
</div>
{#if error}<p class="error">{error}</p>{/if}
{#if msg}<p class="success">{msg}</p>{/if}

{#if showForm}
  <form class="card" on:submit={create}>
    <label>Titulo</label><input bind:value={form.title} required />
    <label>Descripcion</label><input bind:value={form.description} />
    <label>URL de imagen principal (opcional)</label><input bind:value={form.image_url} placeholder="https://..." type="url" />
    <label>Categoria</label><input bind:value={form.category} />
    
    <details style="margin: 16px 0">
      <summary style="cursor:pointer; font-weight:600; color:var(--accent)">Imágenes por diapositiva (opcional)</summary>
      <div style="padding: 12px; background:var(--bg-2); border-radius:8px; margin-top:8px">
        <label>Portada (cover)</label><input bind:value={form.slide_images.cover} placeholder="https://..." type="url" />
        <label>Objetivos</label><input bind:value={form.slide_images.objectives} placeholder="https://..." type="url" />
        <label>Contenido</label><input bind:value={form.slide_images.content} placeholder="https://..." type="url" />
        <label>Actividad</label><input bind:value={form.slide_images.activity} placeholder="https://..." type="url" />
        <label>Evaluación</label><input bind:value={form.slide_images.evaluation} placeholder="https://..." type="url" />
        <label>Cierre</label><input bind:value={form.slide_images.close} placeholder="https://..." type="url" />
      </div>
    </details>
    
    <details style="margin: 16px 0">
      <summary style="cursor:pointer; font-weight:600; color:var(--accent)">URLs específicas por slide (una por línea, en orden)</summary>
      <div style="padding: 12px; background:var(--bg-2); border-radius:8px; margin-top:8px">
        <textarea bind:value={form.slide_urls_text} rows="5" placeholder="https://imagen1.com&#10;https://imagen2.com&#10;https://imagen3.com"></textarea>
      </div>
    </details>
    
    <div class="row" style="justify-content:space-between">
      <label style="margin:10px 0 4px">Contenido / guion de la sesion</label>
      <button type="button" class="secondary" on:click={() => form.content = PLANTILLA_30MIN}>Insertar plantilla 30 min</button>
    </div>
    <textarea bind:value={form.content} rows="10" placeholder="0-5 min · APERTURA...&#10;5-10 min · ..."></textarea>
    <button style="margin-top:12px">Guardar tema</button>
  </form>
{/if}

{#if loading}
  <p class="muted">Cargando...</p>
{:else}
<div class="grid topics-grid">
  {#each topics as t}
    <article class="card topic-card">
      {#if t.image_url}
        <img class="topic-img" src={t.image_url} alt={t.title} loading="lazy" />
      {:else}
        <div class="topic-img placeholder"><span>{t.category}</span></div>
      {/if}
      <div class="topic-body">
        <div class="row" style="justify-content:space-between">
          <span class="badge info">{t.category}</span>
          <span class="row" style="gap:6px">
            <span class="badge warn">30 min</span>
            <span class="badge ok">{t.status}</span>
          </span>
        </div>
        <h3>{t.title}</h3>
        <p class="muted">{t.description}</p>
        {#if agendaLines(t.content).length}
          <details class="agenda">
            <summary>Ver agenda de la sesion</summary>
            <ul>
              {#each agendaLines(t.content) as line}<li>{line}</li>{/each}
            </ul>
          </details>
        {/if}
        <div class="row" style="margin-top:14px">
          {#if canEdit}
            <button class="secondary" on:click={() => apiDownload(`/jobs/download/presentation/${t.id}`, `${t.title}.pptx`)}>Descargar PPTX</button>
            <button class="secondary" on:click={() => apiDownload(`/jobs/download/video/${t.id}`, `${t.title}-video.html`)}>Descargar Video HTML</button>
            <button class="danger" on:click={() => remove(t.id)}>Eliminar</button>
          {/if}
        </div>
      </div>
    </article>
  {/each}
</div>
{/if}

<style>
  .topics-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
  .topic-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
  .topic-img {
    width: 100%; height: 170px; object-fit: cover; display: block;
  }
  .topic-img.placeholder {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 15px; letter-spacing: .5px;
  }
  .topic-body { padding: 18px; display: flex; flex-direction: column; flex: 1; }
  .topic-body h3 { margin: 10px 0 6px; font-size: 18px; }
  .topic-body p { margin: 0 0 8px; font-size: 14px; }
  .agenda { margin-top: auto; }
  .agenda summary {
    cursor: pointer; font-size: 13px; font-weight: 600; color: var(--accent);
    padding: 8px 0; list-style: none;
  }
  .agenda summary::before { content: '▸ '; }
  .agenda[open] summary::before { content: '▾ '; }
  .agenda ul { margin: 6px 0 0; padding-left: 18px; font-size: 13px; color: var(--muted); line-height: 1.7; }
</style>
