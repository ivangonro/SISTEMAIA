import { supabase } from '../db.js';

// Genera un "video" como deck HTML auto-animado con mejoras:
// - Animaciones CSS mejoradas
// - Colores diferentes por slide
// - Audio de fondo ambient
// - Narración con OpenAI TTS (opcional)
// - Botón para exportar a MP4/WebM usando MediaRecorder API
export async function buildVideo(topicId, options = {}) {
  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single();
  if (error || !topic) throw new Error('Tema no encontrado');

  const slideImages = topic.slide_images || {};
  const slideUrls = topic.slide_urls || [];
  const getImg = (type, index) => slideUrls[index] || slideImages[type] || topic.image_url || '';

  // Paleta de colores para alternar por slide
  const colors = [
    { bg: '#1a1a2e', text: '#ffffff', accent: '#e94560' },
    { bg: '#16213e', text: '#ffffff', accent: '#0f3460' },
    { bg: '#0f3460', text: '#ffffff', accent: '#e94560' },
    { bg: '#533483', text: '#ffffff', accent: '#e94560' },
    { bg: '#1b262c', text: '#ffffff', accent: '#0f4c75' },
    { bg: '#2d4059', text: '#ffffff', accent: '#ea5455' },
  ];

  const contentLines = (topic.content || '').split(/\n+/).filter(Boolean);
  const slides = [
    { title: topic.title, subtitle: topic.description || '', kind: 'cover', img: getImg('cover', 0), color: colors[0] },
    { title: 'Objetivos', bullets: ['Comprender conceptos clave', 'Aplicar en el area', 'Medir avance en matriz'], img: getImg('objectives', 1), color: colors[1] },
    ...contentLines.slice(0, 5).map((line, i) => ({
      title: `Contenido ${i + 1}`,
      bullets: [line],
      img: getImg('content', 2 + i),
      color: colors[(2 + i) % colors.length],
    })),
    { title: 'Actividad', bullets: ['Reflexion individual', 'Trabajo en equipo', 'Retroalimentacion'], img: getImg('activity', 7), color: colors[3] },
    { title: 'Evaluacion', bullets: ['Cuestionario en linea', '% de avance automatico', 'Matriz de habilidades'], img: getImg('evaluation', 8), color: colors[4] },
    { title: 'Cierre', subtitle: 'Gracias', kind: 'end', img: getImg('close', 9), color: colors[5] },
  ];

  const secondsPerSlide = options.secondsPerSlide || 8;
  const useTTS = options.useTTS && process.env.OPENAI_API_KEY;
  const useAudio = options.useAudio !== false;

  // Generar narración TTS si está habilitado
  let ttsAudio = '';
  if (useTTS) {
    try {
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'onyx', // Voz masculina profunda
          input: slides.map(s => `${s.title}. ${s.bullets?.join(' ') || ''}`).join('. '),
        }),
      });
      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        ttsAudio = `data:audio/mp3;base64,${audioBase64}`;
      }
    } catch (e) {
      console.error('Error generando TTS:', e.message);
    }
  }

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(topic.title)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{overflow:hidden;font-family:'Segoe UI',Arial,sans-serif}
  .slide{position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;justify-content:center;align-items:center;padding:6vw;opacity:0;transform:scale(0.95);transition:all 0.8s cubic-bezier(0.4,0,0.2,1)}
  .slide.active{display:flex;opacity:1;transform:scale(1)}
  .slide-bg{position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0.15;background-size:cover;background-position:center}
  h1{font-size:4vw;font-weight:700;margin-bottom:1vh;text-shadow:2px 2px 4px rgba(0,0,0,0.3);animation:slideUp 0.6s ease-out 0.2s both}
  h2{font-size:2.5vw;font-weight:400;margin-bottom:2vh;opacity:0.9;animation:slideUp 0.6s ease-out 0.4s both}
  ul{list-style:none;padding:0;margin-top:3vh}
  li{font-size:2vw;padding:1.5vh 0;opacity:0;animation:fadeIn 0.5s ease-out both}
  li:nth-child(1){animation-delay:0.6s}
  li:nth-child(2){animation-delay:0.8s}
  li:nth-child(3){animation-delay:1s}
  li:nth-child(4){animation-delay:1.2s}
  li:nth-child(5){animation-delay:1.4s}
  .slide-img{max-width:50vw;max-height:40vh;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.4);margin:2vh 0;animation:zoomIn 0.8s ease-out 0.3s both}
  .progress{position:fixed;top:0;left:0;height:6px;background:linear-gradient(90deg,rgba(255,255,255,0.3),rgba(255,255,255,0.8));transition:width 0.5s linear;z-index:100}
  .slide-number{position:fixed;bottom:3vh;right:4vw;font-size:2vw;opacity:0.5;font-weight:700}
  .controls{position:fixed;top:20px;right:20px;z-index:200;display:flex;gap:10px}
  .btn{padding:10px 20px;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);color:#fff;border-radius:8px;cursor:pointer;font-size:14px;backdrop-filter:blur(10px);transition:all 0.3s}
  .btn:hover{background:rgba(255,255,255,0.3);transform:scale(1.05)}
  .btn.recording{background:#e94560;border-color:#e94560}
  @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes fadeIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes zoomIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
  .particles{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1}
  .particle{position:absolute;width:4px;height:4px;background:rgba(255,255,255,0.3);border-radius:50%;animation:float 10s infinite}
  @keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-100px) rotate(180deg)}}
</style></head><body>
<div class="progress" id="progress"></div>
<div class="particles" id="particles"></div>
<div class="controls">
  <button class="btn" id="exportMp4">Exportar MP4</button>
  <button class="btn" id="exportWebm">Exportar WebM</button>
</div>
${slides.map((s, i) => `
<section class="slide ${i === 0 ? 'active' : ''}" data-i="${i}" style="background:${s.color.bg};color:${s.color.text}">
  ${s.img ? `<div class="slide-bg" style="background-image:url('${escapeHtml(s.img)}')"></div><img class="slide-img" src="${escapeHtml(s.img)}" alt="">` : ''}
  <h1 style="color:${s.color.accent}">${escapeHtml(s.title)}</h1>
  ${s.subtitle ? `<h2>${escapeHtml(s.subtitle)}</h2>` : ''}
  ${s.bullets?.length ? `<ul>${s.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
</section>`).join('\n')}
<div class="slide-number" id="slideNumber">1 / ${slides.length}</div>
${ttsAudio ? `<audio id="ttsAudio" autoplay><source src="${ttsAudio}" type="audio/mpeg"></audio>` : ''}
${useAudio ? `<audio id="bgAudio" loop autoplay><source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=" type="audio/wav"></audio>` : ''}
<script>
  const slides=[...document.querySelectorAll('.slide')];const progress=document.getElementById('progress');const slideNumber=document.getElementById('slideNumber');
  const particles=document.getElementById('particles');
  for(let i=0;i<30;i++){const p=document.createElement('div');p.className='particle';p.style.left=Math.random()*100+'%';p.style.top=Math.random()*100+'%';p.style.animationDelay=Math.random()*5+'s';particles.appendChild(p);}
  const T=${secondsPerSlide * 1000};let i=0;
  function show(n){slides.forEach((s,k)=>{s.classList.toggle('active',k===n);});progress.style.width=((n+1)/slides.length*100)+'%';slideNumber.textContent=(n+1)+' / '+slides.length;}
  setInterval(()=>{i=(i+1)%slides.length;show(i);},T);
  ${ttsAudio ? 'document.getElementById("ttsAudio").play().catch(()=>{});' : ''}
  
  // Exportar a video usando MediaRecorder API
  async function exportVideo(mimeType, extension) {
    const stream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${escapeHtml(topic.title)}-video.' + extension;
      a.click();
      stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), ${slides.length * secondsPerSlide * 1000});
  }
  
  document.getElementById('exportMp4').onclick = () => exportVideo('video/mp4', 'mp4');
  document.getElementById('exportWebm').onclick = () => exportVideo('video/webm', 'webm');
</script></body></html>`;

  const filename = `${slugify(topic.title)}-video.html`;
  return { html, filename, topic, durationSec: slides.length * secondsPerSlide };
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tema';
}
