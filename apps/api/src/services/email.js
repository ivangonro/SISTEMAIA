import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { supabase } from '../db.js';

let transporter = null;
function getTransporter() {
  if (!config.smtp.host || !config.smtp.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

function levelFor(score) {
  if (score >= 90) return 'Experto';
  if (score >= 75) return 'Avanzado';
  if (score >= 60) return 'Competente';
  if (score >= 40) return 'En desarrollo';
  return 'Inicial';
}

// Calcula % de avance por area y envia correo al supervisor.
export async function sendAreaReport(assignmentId, recipientEmail, recipientName) {
  const t = getTransporter();
  if (!t) {
    // Sin SMTP configurado: solo registramos en jobs; dev mode devuelve ok.
    return { skipped: true, reason: 'SMTP no configurado' };
  }

  const { data: assignment } = await supabase
    .from('assignments').select('*').eq('id', assignmentId).single();
  const { data: responses } = await supabase
    .from('responses').select('score').eq('assignment_id', assignmentId);
  const { data: topic } = assignment?.topic_id
    ? await supabase.from('topics').select('title').eq('id', assignment.topic_id).single()
    : { data: null };

  const scores = (responses || []).map(r => Number(r.score)).filter(n => !Number.isNaN(n));
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const count = scores.length;

  // Reflejar en matriz de habilidades (agregado del area)
  await supabase.from('skill_matrices').upsert({
    assignment_id: assignmentId,
    area: assignment?.area || 'General',
    collaborator: null,
    topic_title: topic?.title || 'Evaluacion',
    score: avg,
    level: levelFor(avg),
  }, { onConflict: 'assignment_id,area,collaborator,topic_title' });

  const html = `
    <h2>Reporte de avance - ${topic?.title || 'Evaluacion'}</h2>
    <p>Estimado/a <b>${recipientName || ''}</b>,</p>
    <p>El area <b>${assignment?.area || ''}</b> registra un avance del
       <b style="font-size:20px;color:${avg >= 60 ? '#16a34a' : '#dc2626'}">${avg.toFixed(1)}%</b>
       (${count} respuesta${count === 1 ? '' : 's'} recibida${count === 1 ? '' : 's'}).</p>
    <p>Nivel estimado: <b>${levelFor(avg)}</b></p>
    <hr><p style="color:#666;font-size:12px">Enviado automaticamente por Sistema IA</p>`;

  await t.sendMail({
    from: config.smtp.from,
    to: recipientEmail,
    subject: `Avance de evaluacion - ${assignment?.area || 'Area'} (${avg.toFixed(0)}%)`,
    html,
  });

  return { sent: true, avg, count };
}

export async function supervisorsByArea(area) {
  const { data } = await supabase
    .from('users').select('email, full_name')
    .eq('role', 'supervisor').eq('area', area);
  return data || [];
}
