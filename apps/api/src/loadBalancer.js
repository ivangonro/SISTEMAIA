import { config } from './config.js';

// ------------------------------------------------------------------
// Balanceador de cargas simple para trabajos pesados (PPTX, video, email)
// Estrategia: menor carga activa entre N workers logicos; si hay empate,
// round-robin. Los workers "expiran" si exceden WORKER_TIMEOUT_MS para
// evitar bloqueos eternos por tareas colgadas.
// ------------------------------------------------------------------

const workers = Array.from({ length: config.loadBalancer.maxWorkers }, (_, i) => ({
  id: `worker-${i + 1}`,
  activeJobs: 0,
  lastAssignedAt: 0,
}));

let rrIndex = 0;
const queue = [];
let processing = false;

function reapStaleWorkers() {
  const now = Date.now();
  for (const w of workers) {
    // Si el worker lleva demasiado "ocupado" lo liberamos
    if (w.activeJobs > 0 && now - w.lastAssignedAt > config.loadBalancer.workerTimeoutMs) {
      w.activeJobs = 0;
    }
  }
}

function pickWorker() {
  reapStaleWorkers();
  const min = Math.min(...workers.map(w => w.activeJobs));
  const candidates = workers.filter(w => w.activeJobs === min);
  const chosen = candidates[rrIndex % candidates.length];
  rrIndex++;
  chosen.activeJobs++;
  chosen.lastAssignedAt = Date.now();
  return chosen;
}

function releaseWorker(workerId) {
  const w = workers.find(x => x.id === workerId);
  if (w && w.activeJobs > 0) w.activeJobs--;
  pump();
}

export function enqueue(job, handler) {
  return new Promise((resolve, reject) => {
    queue.push({ job, handler, resolve, reject });
    pump();
  });
}

async function pump() {
  if (processing) return;
  processing = true;
  while (queue.length) {
    const item = queue.shift();
    const worker = pickWorker();
    try {
      const result = await item.handler(item.job, worker);
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      releaseWorker(worker.id);
    }
  }
  processing = false;
}

export function loadBalancerStatus() {
  reapStaleWorkers();
  return {
    maxWorkers: workers.length,
    queued: queue.length,
    workers: workers.map(w => ({ id: w.id, activeJobs: w.activeJobs })),
  };
}
