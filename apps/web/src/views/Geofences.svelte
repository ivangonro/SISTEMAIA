<script>
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  const COLORS = ['#7c6cf0', '#f472b6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];
  const LS_KEY = 'sia_geocercas';

  let mapEl;
  let map, fenceLayer, drawLayer, markersLayer;
  let fences = [];
  let userMarker = null;
  let mode = 'none';           // none | circle | polygon | marker
  let draft = null;            // dibujo en curso
  let hint = '';

  onMount(() => {
    try { fences = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { fences = []; }

    map = L.map(mapEl).setView([19.4326, -99.1332], 11); // Ciudad de Mexico por defecto
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    fenceLayer = L.layerGroup().addTo(map);
    drawLayer = L.layerGroup().addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    renderFences();

    map.on('click', onMapClick);
    map.on('mousemove', onMapMove);
    map.on('dblclick', onMapDblClick);

    // Centrar automaticamente en la ubicacion del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const latlng = [pos.coords.latitude, pos.coords.longitude];
          map.setView(latlng, 16);
          if (userMarker) userMarker.remove();
          userMarker = createUserMarker(latlng).addTo(map);
        },
        () => { hint = 'Ubicacion no disponible: mostrando vista general'; },
        { timeout: 8000 }
      );
    }
  });

  onDestroy(() => { if (map) map.remove(); });

  // Icono pulsante para ubicacion del usuario
  function createUserMarker(latlng) {
    const icon = L.divIcon({
      className: 'user-pulse-icon',
      html: `<div class="pulse-ring"></div><div class="pulse-dot"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    return L.marker(latlng, { icon, interactive: false });
  }

  // Icono personalizado con foto/avatar
  function createAvatarMarker(latlng, name, imageUrl = null) {
    const imgHtml = imageUrl
      ? `<img src="${imageUrl}" alt="${name}" />`
      : `<div class="avatar-initial">${name.charAt(0).toUpperCase()}</div>`;
    const icon = L.divIcon({
      className: 'avatar-marker',
      html: imgHtml,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    });
    const marker = L.marker(latlng, { icon });
    marker.bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -54] });
    return marker;
  }

  function nextColor() { return COLORS[fences.length % COLORS.length]; }

  function setMode(m) {
    cancelDraw();
    mode = m;
    hint = m === 'circle'
      ? 'Clic 1: centro de la geocerca · Clic 2: borde (define el radio)'
      : m === 'polygon'
        ? 'Clic para agregar vertices · Doble clic para cerrar'
        : m === 'marker'
          ? 'Clic en el mapa para colocar un marcador'
          : '';
    map.doubleClickZoom[m === 'polygon' ? 'disable' : 'enable']();
  }

  function onMapClick(e) {
    if (mode === 'circle') {
      if (!draft) startCircle(e.latlng);
      else finishCircle(e.latlng);
    } else if (mode === 'polygon') {
      addPolygonPoint(e.latlng);
    } else if (mode === 'marker') {
      addMarker(e.latlng);
    }
  }

  function onMapMove(e) {
    if (!draft) return;
    if (draft.type === 'circle') {
      draft.circle.setRadius(draft.center.distanceTo(e.latlng));
    } else if (draft.type === 'polygon') {
      draft.preview.setLatLngs([...draft.points, e.latlng]);
    }
  }

  function onMapDblClick() {
    if (mode === 'polygon' && draft && draft.points.length >= 3) finishPolygon();
  }

  function startCircle(center) {
    const color = nextColor();
    draft = {
      type: 'circle', center, color,
      circle: L.circle(center, { radius: 100, color, weight: 2, dashArray: '6 6', fillOpacity: 0.15 }).addTo(drawLayer),
    };
  }

  function finishCircle(edge) {
    const radius = Math.max(10, Math.round(draft.center.distanceTo(edge)));
    const fence = {
      id: crypto.randomUUID(), name: `Geocerca ${fences.length + 1}`,
      type: 'circle', lat: draft.center.lat, lng: draft.center.lng,
      radius, color: draft.color,
    };
    fences = [...fences, fence];
    save(); renderFences();
    cancelDraw();
  }

  function addPolygonPoint(latlng) {
    if (!draft) {
      draft = { type: 'polygon', points: [], markers: [], color: nextColor() };
      draft.preview = L.polyline([], { color: draft.color, weight: 2, dashArray: '6 6' }).addTo(drawLayer);
    }
    draft.points.push(latlng);
    draft.markers.push(L.circleMarker(latlng, { radius: 5, color: draft.color, fillOpacity: 0.9 }).addTo(drawLayer));
    draft.preview.setLatLngs(draft.points);
  }

  function finishPolygon() {
    const pts = draft.points.map(p => [p.lat, p.lng]);
    const fence = {
      id: crypto.randomUUID(), name: `Geocerca ${fences.length + 1}`,
      type: 'polygon', latlngs: pts, color: draft.color,
    };
    fences = [...fences, fence];
    save(); renderFences();
    cancelDraw();
  }

  let markers = [];
  function addMarker(latlng) {
    const name = prompt('Nombre del marcador:', `Marcador ${markers.length + 1}`);
    if (!name) return;
    const marker = createAvatarMarker(latlng, name);
    marker.addTo(markersLayer);
    markers = [...markers, { id: crypto.randomUUID(), name, lat: latlng.lat, lng: latlng.lng }];
    hint = '';
  }

  function removeMarker(id) {
    markers = markers.filter(m => m.id !== id);
    renderMarkers();
  }

  function cancelDraw() {
    if (draft) drawLayer.clearLayers();
    draft = null;
    if (mode !== 'none' && !hint) hint = '';
  }

  function renderFences() {
    fenceLayer.clearLayers();
    for (const f of fences) {
      const layer = f.type === 'circle'
        ? L.circle([f.lat, f.lng], { radius: f.radius, color: f.color, weight: 2, fillOpacity: 0.12 })
        : L.polygon(f.latlngs, { color: f.color, weight: 2, fillOpacity: 0.12 });
      layer.bindTooltip(f.name, { permanent: false });
      layer.addTo(fenceLayer);
    }
  }

  function renderMarkers() {
    markersLayer.clearLayers();
    for (const m of markers) {
      const marker = createAvatarMarker([m.lat, m.lng], m.name);
      marker.addTo(markersLayer);
    }
  }

  function save() { localStorage.setItem(LS_KEY, JSON.stringify(fences)); }

  function removeFence(id) {
    fences = fences.filter(f => f.id !== id);
    save(); renderFences();
  }

  function clearAll() {
    if (!fences.length) return;
    if (confirm('¿Eliminar todas las geocercas?')) {
      fences = []; save(); renderFences();
    }
  }

  function myLocation() {
    if (!navigator.geolocation) { hint = 'Tu navegador no soporta geolocalizacion'; return; }
    navigator.geolocation.getCurrentPosition(
      pos => map.setView([pos.coords.latitude, pos.coords.longitude], 16),
      () => { hint = 'No se pudo obtener tu ubicacion'; },
      { timeout: 8000 }
    );
  }

  function fmt(f) {
    return f.type === 'circle'
      ? `Circulo · radio ${f.radius >= 1000 ? (f.radius / 1000).toFixed(2) + ' km' : f.radius + ' m'}`
      : `Poligono · ${f.latlngs.length} vertices`;
  }
</script>

<div class="geo-wrap">
  <div class="map-toolbar card">
    <b>Geocercas</b>
    <div class="row" style="margin-top:8px">
      <button class:active={mode === 'circle'} on:click={() => setMode(mode === 'circle' ? 'none' : 'circle')}>Círculo</button>
      <button class:active={mode === 'polygon'} on:click={() => setMode(mode === 'polygon' ? 'none' : 'polygon')}>Polígono</button>
      <button class:active={mode === 'marker'} on:click={() => setMode(mode === 'marker' ? 'none' : 'marker')}>Marcador</button>
      <button class="secondary" on:click={myLocation}>Mi ubicación</button>
      <button class="danger" on:click={clearAll}>Limpiar</button>
    </div>
    {#if hint}<p class="hint">{hint}</p>{/if}
  </div>

  <div class="map-side card">
    <h3>Geocercas ({fences.length})</h3>
    {#if !fences.length}
      <p class="muted">Aún no hay geocercas. Dibuja un círculo o polígono sobre el mapa.</p>
    {:else}
      <ul class="fence-list">
        {#each fences as f}
          <li>
            <span class="dot" style="background:{f.color}"></span>
            <div>
              <b>{f.name}</b>
              <div class="muted" style="font-size:12px">{fmt(f)}</div>
            </div>
            <button class="secondary" style="padding:4px 10px" on:click={() => removeFence(f.id)}>✕</button>
          </li>
        {/each}
      </ul>
    {/if}
    <h3 style="margin-top:16px">Marcadores ({markers.length})</h3>
    {#if !markers.length}
      <p class="muted">Agrega marcadores para ubicar personas o puntos de interés.</p>
    {:else}
      <ul class="fence-list">
        {#each markers as m}
          <li>
            <span class="dot" style="background:#3b82f6"></span>
            <div>
              <b>{m.name}</b>
              <div class="muted" style="font-size:12px">{m.lat.toFixed(5)}, {m.lng.toFixed(5)}</div>
            </div>
            <button class="secondary" style="padding:4px 10px" on:click={() => removeMarker(m.id)}>✕</button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="map-container" bind:this={mapEl}></div>
</div>

<style>
  .geo-wrap { position: relative; }
  .map-container {
    height: calc(100vh - 170px); min-height: 480px;
    border-radius: 16px; border: 1px solid var(--border); overflow: hidden;
    z-index: 0;
  }
  .map-toolbar {
    position: absolute; top: 16px; left: 16px; z-index: 1000;
    padding: 14px 16px; width: 250px;
    background: rgba(255,255,255,.92); backdrop-filter: blur(6px);
    box-shadow: 0 4px 16px rgba(42,45,69,.12);
  }
  .map-toolbar button { padding: 6px 12px; font-size: 13px; }
  button.active { outline: 2px solid var(--accent-2); }
  .hint { font-size: 12px; color: var(--muted); margin: 8px 0 0; }
  .map-side {
    position: absolute; top: 16px; right: 16px; z-index: 1000;
    width: 260px; max-height: calc(100vh - 200px); overflow-y: auto;
    background: rgba(255,255,255,.92); backdrop-filter: blur(6px);
    box-shadow: 0 4px 16px rgba(42,45,69,.12);
  }
  .map-side h3 { margin: 0 0 10px; font-size: 16px; }
  .fence-list { list-style: none; margin: 0; padding: 0; }
  .fence-list li {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 0; border-bottom: 1px solid var(--border);
  }
  .fence-list li:last-child { border-bottom: 0; }
  .dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .fence-list li > div { flex: 1; }

  /* Marcador pulsante de ubicacion del usuario */
  :global(.user-pulse-icon) {
    position: relative;
  }
  :global(.pulse-ring) {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(59, 130, 246, 0.25);
    animation: pulse 2s ease-out infinite;
  }
  :global(.pulse-dot) {
    position: absolute; inset: 50%; width: 16px; height: 16px;
    transform: translate(-50%, -50%); border-radius: 50%;
    background: #3b82f6; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.25);
  }
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  /* Marcador de avatar */
  :global(.avatar-marker) {
    position: relative;
  }
  :global(.avatar-marker img) {
    width: 48px; height: 48px; border-radius: 50%;
    border: 3px solid #fff; box-shadow: 0 3px 12px rgba(0,0,0,.2);
    object-fit: cover;
  }
  :global(.avatar-initial) {
    width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg, #7c6cf0, #f472b6);
    color: #fff; font-size: 20px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    border: 3px solid #fff; box-shadow: 0 3px 12px rgba(0,0,0,.2);
  }
</style>
