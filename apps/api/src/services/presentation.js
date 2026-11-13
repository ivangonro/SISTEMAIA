import PptxGenJS from 'pptxgenjs';
import { supabase } from '../db.js';

const ACCENT = '7C6CF0';
const LIGHT_BG = 'F8FAFC';
const INK = '2A2D45';
const MUTED = '71769A';
const BODY = '3F4260';
const FAINT = '9AA0C0';

// Paleta de colores para alternar por slide
const SLIDE_COLORS = [
  { bg: ACCENT, text: 'FFFFFF', accent: 'E6E4FF' },
  { bg: '1a1a2e', text: 'FFFFFF', accent: 'e94560' },
  { bg: '16213e', text: 'FFFFFF', accent: '0f3460' },
  { bg: '0f3460', text: 'FFFFFF', accent: 'e94560' },
  { bg: '533483', text: 'FFFFFF', accent: 'e94560' },
  { bg: '1b262c', text: 'FFFFFF', accent: '0f4c75' },
];

// Descarga una imagen remota y la devuelve como data URL base64
// (pptxgenjs la incrusta en el .pptx sin depender de URLs externas).
async function fetchImageData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

// Genera un .pptx (Buffer) a partir de un tema de desarrollo organizacional.
export async function buildPresentation(topicId, options = {}) {
  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single();
  if (error || !topic) throw new Error('Tema no encontrado');

  const slideImages = topic.slide_images || {};
  const imageMap = {};
  for (const [key, url] of Object.entries(slideImages)) {
    if (url) imageMap[key] = await fetchImageData(url);
  }
  if (topic.image_url && !imageMap.cover) {
    imageMap.cover = await fetchImageData(topic.image_url);
  }
  const slidesData = buildSlides(topic, options);

  const pptx = new PptxGenJS();
  pptx.author = 'Sistema IA';
  pptx.company = 'Desarrollo Organizacional';
  pptx.title = topic.title;
  pptx.layout = 'LAYOUT_16x9';

  for (const s of slidesData) {
    const slide = pptx.addSlide();
    const colorScheme = s.colorScheme || SLIDE_COLORS[0];
    const dark = true;
    slide.background = { color: colorScheme.bg };
    const hasImage = s.img && imageMap[s.imgType || 'default'];
    slide.addText(s.title, {
      x: 0.6, y: 0.5, w: hasImage ? '56%' : '90%', h: 0.9,
      fontSize: 30, bold: true, color: colorScheme.text, fontFace: 'Calibri',
    });
    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.6, y: 1.35, w: hasImage ? '56%' : '90%', h: 0.6,
        fontSize: 16, color: colorScheme.accent, fontFace: 'Calibri',
      });
    }
    if (s.bullets?.length) {
      slide.addText(
        s.bullets.map(b => ({ text: b, options: { bullet: { code: '25AA' }, breakLine: true } })),
        { x: 0.8, y: 2.1, w: hasImage ? '55%' : '85%', h: 4.5, fontSize: 18, color: colorScheme.accent, valign: 'top' }
      );
    }
    if (hasImage) {
      slide.addImage({
        data: imageMap[s.imgType || 'default'],
        x: 6.4, y: 0.9, w: 3.2, h: 3.8,
        sizing: { type: 'cover', w: 3.2, h: 3.8 },
      });
    }
    slide.addText(`${topic.title} · Sistema IA`, {
      x: 0.6, y: 6.9, w: '90%', h: 0.4, fontSize: 10, color: colorScheme.accent,
    });
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return { buffer, filename: `${slugify(topic.title)}.pptx`, topic };
}

function buildSlides(topic, options) {
  const content = topic.content || '';
  const paragraphs = content
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  // Pagina el guion: maximo 7 puntos por slide de contenido.
  const chunks = [];
  for (let i = 0; i < paragraphs.length; i += 7) {
    chunks.push(paragraphs.slice(i, i + 7));
  }
  if (!chunks.length) {
    chunks.push(['Definicion y contexto', 'Marco teorico', 'Aplicacion practica', 'Casos de estudio']);
  }

  const slides = [
    { title: topic.title, subtitle: topic.description || topic.category, bg: ACCENT, img: true, imgType: 'cover', colorScheme: SLIDE_COLORS[0] },
    {
      title: 'Objetivos de la sesion (30 min)',
      bullets: [
        'Comprender los conceptos clave del tema.',
        'Practicar una herramienta durante la sesion.',
        'Salir con un plan de accion concreto.',
        'Evaluar el avance en la matriz de habilidades.',
      ],
      img: true,
      imgType: 'objectives',
      colorScheme: SLIDE_COLORS[1],
    },
    ...chunks.map((bullets, i) => ({
      title: i === 0 ? 'Guion de la exposicion' : `Guion de la exposicion (${i + 1})`,
      bullets,
      img: true,
      imgType: 'content',
      colorScheme: SLIDE_COLORS[(2 + i) % SLIDE_COLORS.length],
    })),
    {
      title: 'Dinámica de trabajo (30 min)',
      bullets: [
        'Apertura y objetivo (0-5 min).',
        'Desarrollo de conceptos y herramientas (5-20 min).',
        'Dinámica grupal o practica guiada (20-26 min).',
        'Compromisos y evaluacion (26-30 min).',
      ],
      img: true,
      imgType: 'activity',
      colorScheme: SLIDE_COLORS[3],
    },
    {
      title: 'Evaluacion',
      bullets: [
        'Cuestionario en linea por tema.',
        'Calculo automatico del % de avance.',
        'Resultados reflejados en la matriz de habilidades.',
      ],
      img: true,
      imgType: 'evaluation',
      colorScheme: SLIDE_COLORS[4],
    },
    {
      title: 'Cierre',
      subtitle: 'Gracias por participar',
      img: true,
      imgType: 'close',
      colorScheme: SLIDE_COLORS[5],
      bullets: options.extraNote ? [options.extraNote] : ['Proximos pasos: refuerzo y seguimiento mensual.'],
    },
  ];
  return slides;
}

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'presentacion';
}
