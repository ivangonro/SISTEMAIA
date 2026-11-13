// Seed inicial: crea admin, rrhh, supervisores por area y temas de ejemplo.
// Uso: node scripts/seed.js   (requiere .env configurado)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}
const supabase = createClient(url, key);

const users = [
  { email: 'admin@sistema.local', password: 'Admin123!', full_name: 'Administrador', role: 'admin' },
  { email: 'rrhh@sistema.local', password: 'Rrhh12345!', full_name: 'Responsable RRHH', role: 'rrhh' },
  { email: 'sup.ventas@sistema.local', password: 'Sup12345!', full_name: 'Supervisor Ventas', role: 'supervisor', area: 'Ventas' },
  { email: 'sup.ops@sistema.local', password: 'Sup12345!', full_name: 'Supervisor Operaciones', role: 'supervisor', area: 'Operaciones' },
  { email: 'sup.ti@sistema.local', password: 'Sup12345!', full_name: 'Supervisor TI', role: 'supervisor', area: 'Tecnologia' },
];

for (const u of users) {
  const password_hash = await bcrypt.hash(u.password, 12);
  const { error } = await supabase.from('users').upsert(
    { email: u.email, password_hash, full_name: u.full_name, role: u.role, area: u.area },
    { onConflict: 'email' }
  );
  if (error) console.error(`user ${u.email}:`, error.message);
  else console.log(`user ok: ${u.email}`);
}

const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const slideImages = {
  leadership: {
    cover: U('photo-1522071820081-009f0129c71c'),
    objectives: U('photo-1519389950473-47ba0277781c'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1454165804606-c3d57bc86b40'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  communication: {
    cover: U('photo-1573496359142-b8d87734a5a2'),
    objectives: U('photo-1526304640581-d334cdbbf45e'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1531482615713-2afd69097998'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  collaboration: {
    cover: U('photo-1531482615713-2afd69097998'),
    objectives: U('photo-1522202176988-66273c2fd55f'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  change: {
    cover: U('photo-1454165804606-c3d57bc86b40'),
    objectives: U('photo-1519389950473-47ba0277781c'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  emotional: {
    cover: U('photo-1573497019940-1c28c88b4f3e'),
    objectives: U('photo-1526304640581-d334cdbbf45e'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  feedback: {
    cover: U('photo-1450101499163-c8848c66ca85'),
    objectives: U('photo-1526304640581-d334cdbbf45e'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  productivity: {
    cover: U('photo-1484480974693-6ca0a78fb36b'),
    objectives: U('photo-1519389950473-47ba0277781c'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  conflict: {
    cover: U('photo-1542744173-8e7e53415bb0'),
    objectives: U('photo-1526304640581-d334cdbbf45e'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
  onboarding: {
    cover: U('photo-1522202176988-66273c2fd55f'),
    objectives: U('photo-1522202176988-66273c2fd55f'),
    content: U('photo-1552664730-d307ca884978'),
    activity: U('photo-1559136555-9303baea8ebd'),
    evaluation: U('photo-1553837522-43269d4ea984'),
    close: U('photo-1516321318423-f06f85e504b3'),
  },
};

// Temas disenados como guion de exposicion de 30 minutos.
// Cada linea del contenido es un punto del guion/presentacion:
// bloques por tiempo, conceptos, ejemplos, dinamicas y cierre.
const topics = [
  {
    title: 'Liderazgo y Gestion de Equipos',
    description: 'Guion de 30 min para fortalecer el liderazgo de supervisores y la cohesion del equipo.',
    image_url: U('photo-1522071820081-009f0129c71c'),
    slide_images: slideImages.leadership,
    slide_urls: [
      U('photo-1522071820081-009f0129c71c'),
      U('photo-1519389950473-47ba0277781c'),
      U('photo-1552664730-d307ca884978'),
      U('photo-1559136555-9303baea8ebd'),
      U('photo-1454165804606-c3d57bc86b40'),
      U('photo-1573497019940-1c28c88b4f3e'),
      U('photo-1553837522-43269d4ea984'),
      U('photo-1516321318423-f06f85e504b3'),
    ],
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: fortalecer el liderazgo de supervisores y la cohesion del equipo
Idea fuerza: liderar es influir positivamente hacia una meta comun
Dinámica de apertura: cada participante comparte su mayor reto como lider (2 min c/u en grupos de 4)
5-10 min · QUE ES LIDERAZGO
Liderazgo = vision + ejemplo + empatia
Diferencia con jefe: el lider inspira y acompana, el jefe solo ordena
Senales de buen lider: metas claras, feedback constante, desarrollo del talento
10-18 min · HERRAMIENTAS CLAVE
Feedback SBI: Situacion - Conducta - Impacto (darlo en menos de 60 segundos)
Reuniones 1:1 semanales de 20 min: agenda del colaborador primero
Delegacion efectiva: tarea + autoridad + responsabilidad + fecha limite
Error comun: microgestionar; solucion: delegar resultado, no proceso
18-24 min · DINAMICA: MAPA DE FORTALEZAS
Grupos de 4: cada quien destaca una fortaleza de un compañero
Cierre del bloque: una oportunidad de mejora por persona, dicha con SBI
24-28 min · PLAN DE ACCION
Cada supervisor define 3 compromisos concretos para la proxima semana
Criterio: compromiso medible, con fecha y responsable
28-30 min · CIERRE
Repaso de compromisos del grupo y evaluacion del dia (escala 1 a 5)
Tarea: aplicar una herramienta SBI antes de la proxima sesion`,
    category: 'Liderazgo',
  },
  {
    title: 'Comunicacion Asertiva en la Organizacion',
    description: 'Guion de 30 min para comunicar con claridad y respeto, reduciendo conflictos internos.',
    image_url: U('photo-1573496359142-b8d87734a5a2'),
    slide_images: slideImages.communication,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: comunicar ideas con claridad y respeto, sin generar friccion
Idea fuerza: lo que se dice importa, pero como se dice importa mas
Dinámica de apertura: completar la frase "Cuando me critican me siento..."
5-10 min · LOS 3 ESTILOS DE COMUNICACION
Pasivo: no expresa lo que piensa ("da igual")
Agresivo: impone lo que piensa ("esto es un desastre")
Asertivo: expresa lo que piensa con respeto ("necesito que...")
10-16 min · TECNICA DEL MENSAJE EN 3 PARTES
1. Hecho observable: "En la junta de ayer..."
2. Emocion o impacto: "me senti ignorado cuando..."
3. Necesidad concreta: "necesito que me avisen antes de cambiar fechas"
16-22 min · PRACTICA GUIADA
Cada participante reformula una frase pasiva real de su trabajo
En parejas: se critican mutuamente la formulacion y la mejoran
22-27 min · ESCUCHA ACTIVA
Preguntas abiertas: "que necesitas de mi?" en vez de "¿entendiste?"
Senales: parafrasear lo escuchado antes de responder
27-30 min · CIERRE
Compromiso: usar el mensaje en 3 partes una vez antes de la proxima sesion
Evaluacion del dia y resolucion de dudas`,
    category: 'Comunicacion',
  },
  {
    title: 'Trabajo en Equipo y Colaboracion',
    description: 'Guion de 30 min para fortalecer la colaboracion inter-area y objetivos comunes.',
    image_url: U('photo-1531482615713-2afd69097998'),
    slide_images: slideImages.collaboration,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: que cada area trabaje como un solo equipo hacia metas comunes
Idea fuerza: un equipo efectivo no es la suma de personas, es un sistema
Dinámica de apertura: "nombra una vez que otro equipo te salvo el dia"
5-10 min · PILARES DEL EQUIPO EFECTIVO
Proposito compartido: todos saben para que existe el equipo
Roles claros: quien decide, quien ejecuta, quien apoya
Confianza: se puede decir "no se" sin consecuencias
10-17 min · PRACTICAS QUE FUNCIONAN
Retrospectivas quincenales: que funciono, que no, que probamos
OKRs compartidos entre areas, no solo dentro de cada una
Celebracion publica de logros cruzados
17-23 min · DINAMICA: "ISLAS"
Cada equipo define UNA forma concreta de apoyar a otra area vecina
Se comprometen por escrito y se revisa en 2 semanas
23-28 min · ACUERDOS DE COLABORACION
Plantilla: "Yo (area X) hare... para que tu (area Y) puedas..."
Cada par de areas deja un acuerdo visible en el area comun
28-30 min · CIERRE
Repaso de acuerdos y evaluacion del dia (1 a 5)`,
    category: 'Colaboracion',
  },
  {
    title: 'Gestion del Cambio Organizacional',
    description: 'Guion de 30 min sobre como liderar transiciones con menor resistencia del equipo.',
    image_url: U('photo-1454165804606-c3d57bc86b40'),
    slide_images: slideImages.change,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: liderar cambios con la menor resistencia posible
Idea fuerza: el cambio no se rechaza, se rechaza la forma de imponerlo
Dinámica de apertura: "un cambio que me costo aceptar y por que"
5-12 min · POR QUE RESISTIMOS EL CAMBIO
Miedo a lo desconocido y a perder el control
Sensacion de imposicion: "me lo hacen, no me lo proponen"
Falta de informacion: las personas llenan vacios con rumores
12-20 min · MODELO ADKAR
Awareness: que el cambio existe y por que
Desire: querer participar en el (beneficio personal claro)
Knowledge: saber como funciona lo nuevo
Ability: poder hacerlo con las herramientas dadas
Reinforcement: refuerzo hasta que sea habito
20-26 min · ESTRATEGIA DEL SUPERVISOR
Comunicacion transparente: explicar el por que antes que el que
Involucrar temprano: pedir opiniones ANTES de decidir
Quick wins: un primer exito visible en 2 semanas
26-30 min · CIERRE
Cada supervisor arma su plan de comunicacion del proximo cambio
Evaluacion del dia y resolucion de dudas`,
    category: 'Gestion del Cambio',
  },
  {
    title: 'Inteligencia Emocional para el Liderazgo',
    description: 'Guion de 30 min para desarrollar autoconciencia, autorregulacion y empatia.',
    image_url: U('photo-1573497019940-1c28c88b4f3e'),
    slide_images: slideImages.emotional,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: liderar las propias emociones y las del equipo
Idea fuerza: no puedes gestionar lo que no reconoces
Dinámica de apertura: "una reaccion mia que luego lamenté"
5-11 min · LOS 4 PILARES
Autoconciencia: reconocer lo que siento y por que
Autorregulacion: no reaccionar en caliente
Motivacion interna: avanzar sin presion externa
Empatia: entender el estado emocional del otro
11-18 min · AUTOCONCIENCIA PRACTICA
Diario de emociones: 3 lineas al final del dia
Detonantes: que situaciones me sacan de mi centro
18-24 min · EMPATIA EN LA PRACTICA
Escuchar para entender, no para responder
Pregunta clave: "como te sientes con esto?" antes de dar soluciones
24-28 min · DINAMICA: PERSPECTIVA DEL OTRO
Cada quien narra la situacion de su equipo desde los ojos de un colaborador
Debate: ¿que cambiaria si lo viera asi siempre?
28-30 min · CIERRE
Compromiso personal: una practica de autoconciencia por dia
Evaluacion del dia`,
    category: 'Liderazgo',
  },
  {
    title: 'Feedback Constructivo y Retroalimentacion',
    description: 'Guion de 30 min para dar y recibir feedback que mejora el desempeno.',
    image_url: U('photo-1450101499163-c8848c66ca85'),
    slide_images: slideImages.feedback,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: que el feedback se vuelva una practica normal del equipo
Idea fuerza: el feedback es un regalo, no una critica
Dinámica de apertura: "el mejor feedback que me han dado y por que"
5-11 min · REGLAS DEL BUEN FEEDBACK
Especifico: sobre un hecho, no sobre la persona
Oportuno: en 24-48 h, no "ya que estamos"
Accionable: el otro sabe exactamente que cambiar
Con cuidado: en privado, nunca en publico
11-17 min · TECNICA SBI
Situation: "En la presentacion de ayer..."
Behavior: "...interrumpiste 3 veces a tu compañero..."
Impact: "...y el cliente perdio el hilo del mensaje"
17-23 min · COMO RECIBIR FEEDBACK
Escuchar sin justificar: el instinto es defenderse
Agradecer: "gracias por decirmelo" (aunque cueste)
Accion: confirmar que se entendio y que se hara
23-28 min · PRACTICA EN PAREJAS
Cada pareja practica un momento real con SBI
Rotan roles: uno da, otro recibe; luego intercambian
28-30 min · CIERRE
Compromiso: dar un feedback SBI antes de la proxima semana
Evaluacion del dia`,
    category: 'Comunicacion',
  },
  {
    title: 'Gestion del Tiempo y Productividad',
    description: 'Guion de 30 min con herramientas practicas para priorizar y proteger el tiempo.',
    image_url: U('photo-1484480974693-6ca0a78fb36b'),
    slide_images: slideImages.productivity,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: recuperar el control del tiempo como supervisor
Idea fuerza: no tienes problema de tiempo, tienes problema de prioridades
Dinámica de apertura: "a que le dedicaste mas horas la semana pasada"
5-11 min · MATRIZ DE EISENHOWER
Urgente + importante: hacer ya
Importante + no urgente: agendar (esto es lo estrategico)
Urgente + no importante: delegar o eliminar
Ni urgente ni importante: eliminar sin culpa
11-17 min · TECNICAS DE CONCENTRACION
Bloques de trabajo profundo: 90 min sin reuniones ni chat
Tecnica Pomodoro para tareas administrativas: 25/5
Apagar notificaciones en bloques de foco
17-23 min · COMO DECIR "NO" PROFESIONAL
Plantilla: "Me encantaría, pero esta semana mi capacidad esta al limite"
Oferta alternativa: "puedo hacerlo el proximo martes"
Regla: nunca prometer en el momento, pedir 24 h para responder
23-28 min · DINAMICA: AUDITORIA DE TIEMPO
Cada quien lista sus 5 mayores consumidores de tiempo de la semana
Identifican UN bloque que pueden recuperar
28-30 min · CIERRE
Compromiso: aplicar la matriz a la lista de tareas del lunes
Evaluacion del dia`,
    category: 'Productividad',
  },
  {
    title: 'Resolucion de Conflictos Laborales',
    description: 'Guion de 30 min para identificar, mediar y resolver conflictos del equipo.',
    image_url: U('photo-1542744173-8e7e53415bb0'),
    slide_images: slideImages.conflict,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: resolver conflictos antes de que escalen o paralicen al equipo
Idea fuerza: el conflicto ignorado no desaparece, se pudre
Dinámica de apertura: "un conflicto laboral que vi y como se resolvio"
5-11 min · TIPOS DE CONFLICTO
De tarea: desacuerdo sobre como hacer el trabajo
De proceso: roles, recursos o formas de decidir
De personas: diferencias de valores o estilo
11-17 min · MODELO THOMAS-KILMANN
Competir: gano yo (usar poco)
Colaborar: ganamos los dos (el ideal)
Comprometerse: cada uno cede algo
Evitar: postergar (solo si es trivial)
Adaptarse: ceder al otro (cuando la relacion pesa mas)
17-24 min · DINAMICA: MEDIACION GUIADA
Caso real anonimo del grupo: se representan las 2 versiones
El grupo propone una solucion con el modelo Thomas-Kilmann
24-28 min · PROTOCOLO DEL SUPERVISOR
Detectar temprano: cambios de actitud, ausencias, quejas repetidas
Escuchar a ambas partes por separado primero
Acuerdo por escrito: que cambia, quien, para cuando
28-30 min · CIERRE
Repaso del protocolo y evaluacion del dia (1 a 5)`,
    category: 'Colaboracion',
  },
  {
    title: 'Onboarding: Bienvenida de Nuevos Colaboradores',
    description: 'Guion de 30 min para estandarizar la integracion y acelerar la productividad.',
    image_url: U('photo-1522202176988-66273c2fd55f'),
    slide_images: slideImages.onboarding,
    content: `0-5 min · APERTURA Y OBJETIVO
Objetivo: que todo nuevo colaborador arranque bien desde el dia uno
Idea fuerza: la primera semana predice los primeros 90 dias
Dinámica de apertura: "mi peor primer dia en un trabajo y por que"
5-11 min · LAS 4 C DEL ONBOARDING
Claridad: saber que se espera de el desde el inicio
Conexion: conocer a su equipo y tener un buddy
Capacitacion: herramientas y procesos sin informacion perdida
Celebracion: sentirse bienvenido, no solo util
11-17 min · CHECKLIST DEL PRIMER DIA Y SEMANA
Dia 1: equipo de trabajo, accesos, presentacion, una tarea real pequena
Semana 1: tour por procesos, reunion con areas vecinas, primera retro
17-23 min · ROL DEL SUPERVISOR
Asignar un buddy: compañero que responde dudas "tontas"
Definir objetivos 30-60-90 dias por escrito
Check-in semanal los primeros 30 dias
23-28 min · DINAMICA: MEJORAR NUESTRO PROCESO
Cada area lista que le falta a su bienvenida actual
Votan las 2 mejoras mas impactantes para implementar
28-30 min · CIERRE
Compromiso: aplicar el checklist al proximo ingreso del area
Evaluacion del dia`,
    category: 'Recursos Humanos',
  },
];

for (const t of topics) {
  const slug = t.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-seed';
  let { error } = await supabase.from('topics').upsert(
    { ...t, slug, status: 'published' },
    { onConflict: 'slug' }
  );
  // Si la columna image_url aun no existe en la DB, reintenta sin ella.
  let sinImagen = false;
  if (error && /image_url/.test(error.message)) {
    const { image_url, ...rest } = t;
    ({ error } = await supabase.from('topics').upsert(
      { ...rest, slug, status: 'published' },
      { onConflict: 'slug' }
    ));
    sinImagen = !error;
  }
  // Si la columna slide_images aun no existe en la DB, reintenta sin ella.
  let sinSlideImages = false;
  if (error && /slide_images/.test(error.message)) {
    const { slide_images, ...rest } = t;
    ({ error } = await supabase.from('topics').upsert(
      { ...rest, slug, status: 'published' },
      { onConflict: 'slug' }
    ));
    sinSlideImages = !error;
  }
  // Si la columna slide_urls aun no existe en la DB, reintenta sin ella.
  let sinSlideUrls = false;
  if (error && /slide_urls/.test(error.message)) {
    const { slide_urls, ...rest } = t;
    ({ error } = await supabase.from('topics').upsert(
      { ...rest, slug, status: 'published' },
      { onConflict: 'slug' }
    ));
    sinSlideUrls = !error;
  }
  if (error) console.error(`topic ${t.title}:`, error.message);
  else console.log(`topic ok${sinImagen ? ' (sin imagen: falta ALTER image_url)' : ''}${sinSlideImages ? ' (sin slide_images: falta ALTER slide_images)' : ''}${sinSlideUrls ? ' (sin slide_urls: falta ALTER slide_urls)' : ''}: ${t.title}`);
}

console.log('\nSeed completado.');
