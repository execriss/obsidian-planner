/**
 * Obsidian Planner — REST API
 * Base URL: https://api.exegestion.com
 * Auth:     Authorization: Bearer <api-key>
 */

import { createClient } from '@supabase/supabase-js';

// ─── Utils ────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const ok  = (data)    => json({ data });
const err = (msg, s)  => json({ error: msg }, s);

// ─── Auth ─────────────────────────────────────────────────────────────────────

const cache = new Map();

async function auth(request, supabase) {
  const header = request.headers.get('Authorization') ?? '';
  const key    = header.replace(/^Bearer\s+/i, '').trim();
  if (!key) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < 5 * 60_000) return hit.userId;

  const { data } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('api_key', key)
    .single();

  if (!data) return null;
  cache.set(key, { userId: data.user_id, ts: Date.now() });
  return data.user_id;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // Docs en GET /
    if (method === 'GET' && path === '/') return docs();

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Rutas públicas (solo docs)
    const userId = await auth(request, supabase);
    if (!userId) return err('Unauthorized: incluí tu API key en el header Authorization: Bearer <key>', 401);

    // ── Tasks ──────────────────────────────────────────────────────────────────

    if (path === '/tasks') {
      if (method === 'GET')  return getTasks(url, userId, supabase);
      if (method === 'POST') return createTask(request, userId, supabase);
    }

    const taskMatch = path.match(/^\/tasks\/([^/]+)$/);
    if (taskMatch) {
      const id = taskMatch[1];
      if (method === 'PATCH')  return updateTask(id, request, userId, supabase);
      if (method === 'DELETE') return deleteTask(id, userId, supabase);
    }

    // ── Expenses ───────────────────────────────────────────────────────────────

    if (path === '/expenses') {
      if (method === 'GET')  return getExpenses(url, userId, supabase);
      if (method === 'POST') return createExpense(request, userId, supabase);
    }

    const expenseMatch = path.match(/^\/expenses\/([^/]+)$/);
    if (expenseMatch) {
      const id = expenseMatch[1];
      if (method === 'DELETE') return deleteExpense(id, userId, supabase);
    }

    // ── Summaries ──────────────────────────────────────────────────────────────

    if (method === 'GET' && path === '/summary/today')   return summaryToday(userId, supabase);
    if (method === 'GET' && path === '/summary/monthly') return summaryMonthly(url, userId, supabase);

    return err('Ruta no encontrada', 404);
  },
};

// ─── Handlers: Tasks ──────────────────────────────────────────────────────────

async function getTasks(url, userId, supabase) {
  const p = url.searchParams;
  let q = supabase.from('tasks').select('*').eq('user_id', userId).order('date').order('created_at');

  if (p.get('date'))      q = q.eq('date', p.get('date'));
  if (p.get('date_from')) q = q.gte('date', p.get('date_from'));
  if (p.get('date_to'))   q = q.lte('date', p.get('date_to'));
  if (p.get('done')  != null && p.get('done')  !== '') q = q.eq('done', p.get('done') === 'true');
  if (p.get('priority'))  q = q.eq('priority', p.get('priority'));
  if (p.get('category'))  q = q.eq('category', p.get('category'));
  if (p.get('limit'))     q = q.limit(Number(p.get('limit')));

  const { data, error } = await q;
  if (error) return err(error.message, 500);
  return ok(data.map(toTask));
}

async function createTask(request, userId, supabase) {
  let body;
  try { body = await request.json(); } catch { return err('JSON inválido', 400); }

  const { text, date, priority = 'medium', category = 'Personal' } = body;
  if (!text) return err('El campo "text" es requerido', 400);
  if (!date) return err('El campo "date" es requerido (YYYY-MM-DD)', 400);

  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, text, date, priority, category, done: false })
    .select().single();

  if (error) return err(error.message, 500);
  return ok(toTask(data));
}

async function updateTask(id, request, userId, supabase) {
  let body;
  try { body = await request.json(); } catch { return err('JSON inválido', 400); }

  const allowed = ['text', 'done', 'priority', 'category', 'date'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  if (Object.keys(updates).length === 0) return err('No hay campos válidos para actualizar', 400);

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select().single();

  if (error || !data) return err('Tarea no encontrada', 404);
  return ok(toTask(data));
}

async function deleteTask(id, userId, supabase) {
  const { error, count } = await supabase
    .from('tasks')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return err(error.message, 500);
  if (count === 0) return err('Tarea no encontrada', 404);
  return ok({ deleted: id });
}

// ─── Handlers: Expenses ───────────────────────────────────────────────────────

async function getExpenses(url, userId, supabase) {
  const p = url.searchParams;
  let q = supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }).order('created_at', { ascending: false });

  if (p.get('date'))      q = q.eq('date', p.get('date'));
  if (p.get('date_from')) q = q.gte('date', p.get('date_from'));
  if (p.get('date_to'))   q = q.lte('date', p.get('date_to'));
  if (p.get('type'))      q = q.eq('type', p.get('type'));
  if (p.get('category'))  q = q.eq('category', p.get('category'));
  if (p.get('limit'))     q = q.limit(Number(p.get('limit')));

  const { data, error } = await q;
  if (error) return err(error.message, 500);
  return ok(data.map(toExpense));
}

async function createExpense(request, userId, supabase) {
  let body;
  try { body = await request.json(); } catch { return err('JSON inválido', 400); }

  const { type, amount, description, category, date } = body;
  if (!type)        return err('"type" es requerido: "income" o "expense"', 400);
  if (!amount)      return err('"amount" es requerido', 400);
  if (!description) return err('"description" es requerido', 400);
  if (!date)        return err('"date" es requerido (YYYY-MM-DD)', 400);

  const { data, error } = await supabase
    .from('expenses')
    .insert({ user_id: userId, type, amount: Number(amount), description, category: category ?? 'Otro', date })
    .select().single();

  if (error) return err(error.message, 500);
  return ok(toExpense(data));
}

async function deleteExpense(id, userId, supabase) {
  const { error, count } = await supabase
    .from('expenses')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return err(error.message, 500);
  if (count === 0) return err('Movimiento no encontrado', 404);
  return ok({ deleted: id });
}

// ─── Handlers: Summaries ──────────────────────────────────────────────────────

async function summaryToday(userId, supabase) {
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: tasks }, { data: expenses }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId).eq('date', today),
    supabase.from('expenses').select('*').eq('user_id', userId).eq('date', today),
  ]);

  const income  = expenses.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const expense = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);

  return ok({
    date: today,
    tasks: {
      total:   tasks.length,
      pending: tasks.filter(t => !t.done).length,
      done:    tasks.filter(t => t.done).length,
      items:   tasks.map(toTask),
    },
    finances: {
      income,
      expense,
      balance: income - expense,
      items:   expenses.map(toExpense),
    },
  });
}

async function summaryMonthly(url, userId, supabase) {
  const year  = Number(url.searchParams.get('year')  ?? new Date().getFullYear());
  const month = Number(url.searchParams.get('month') ?? new Date().getMonth() + 1);

  if (!year || month < 1 || month > 12) return err('Parámetros year y month requeridos (month: 1-12)', 400);

  const from  = `${year}-${String(month).padStart(2, '0')}-01`;
  const to    = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

  const [{ data: expenses }, { data: tasks }] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', userId).gte('date', from).lte('date', to),
    supabase.from('tasks').select('*').eq('user_id', userId).gte('date', from).lte('date', to),
  ]);

  const income  = expenses.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const expense = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);

  // Breakdown por categoría
  const byCategory = (type) => {
    const map = {};
    expenses.filter(e => e.type === type).forEach(e => {
      map[e.category] = (map[e.category] ?? 0) + Number(e.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount }));
  };

  return ok({
    year,
    month,
    finances: {
      income,
      expense,
      balance: income - expense,
      saving_rate: income > 0 ? Number(((income - expense) / income * 100).toFixed(1)) : 0,
      by_category: {
        income:  byCategory('income'),
        expense: byCategory('expense'),
      },
    },
    tasks: {
      total:   tasks.length,
      done:    tasks.filter(t => t.done).length,
      pending: tasks.filter(t => !t.done).length,
    },
  });
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toTask(r) {
  return {
    id:         r.id,
    text:       r.text,
    done:       r.done,
    priority:   r.priority,
    category:   r.category,
    date:       r.date,
    created_at: r.created_at,
  };
}

function toExpense(r) {
  return {
    id:          r.id,
    type:        r.type,
    amount:      Number(r.amount),
    description: r.description,
    category:    r.category,
    date:        r.date,
    created_at:  r.created_at,
  };
}

// ─── Docs ─────────────────────────────────────────────────────────────────────

function docs() {
  const html = /* html */`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Obsidian Planner — API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f0f11; --bg2: #17171a; --bg3: #1e1e22;
      --border: #2a2a30; --amber: #f0a500; --amber-dim: rgba(240,165,0,0.15);
      --cream: #e8e0d0; --muted: #7a7a8a; --sage: #7faa8b; --coral: #e07060;
      --code: #c4a882;
    }
    body { background: var(--bg); color: var(--cream); font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6; padding: 48px 24px; }
    .wrap { max-width: 780px; margin: 0 auto; }
    h1 { font-size: 28px; font-weight: 700; color: var(--amber); margin-bottom: 6px; letter-spacing: -0.02em; }
    .subtitle { color: var(--muted); margin-bottom: 40px; }
    h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 40px 0 14px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    h3 { font-size: 15px; font-weight: 600; color: var(--cream); margin: 24px 0 8px; display: flex; align-items: center; gap: 10px; }
    .badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 5px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
    .GET    { background: rgba(127,170,139,0.15); color: var(--sage); }
    .POST   { background: rgba(240,165,0,0.15); color: var(--amber); }
    .PATCH  { background: rgba(107,143,212,0.15); color: #6b8fd4; }
    .DELETE { background: rgba(224,112,96,0.15); color: var(--coral); }
    p { color: var(--muted); margin-bottom: 10px; }
    code { background: var(--bg3); border: 1px solid var(--border); border-radius: 5px; padding: 1px 7px; font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: 12px; color: var(--code); }
    pre { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; overflow-x: auto; margin: 10px 0 16px; }
    pre code { background: none; border: none; padding: 0; font-size: 13px; color: var(--cream); }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    td { padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: top; }
    td:first-child { font-family: monospace; color: var(--code); white-space: nowrap; }
    .note { background: var(--amber-dim); border: 1px solid rgba(240,165,0,0.3); border-radius: 8px; padding: 10px 14px; margin: 12px 0; font-size: 12px; color: var(--cream); }
    .url { color: var(--amber); font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
<div class="wrap">
  <h1>Obsidian Planner API</h1>
  <p class="subtitle">REST API para integrar el planner con herramientas externas</p>

  <h2>Autenticación</h2>
  <p>Todas las rutas (excepto esta) requieren un API key en el header:</p>
  <pre><code>Authorization: Bearer &lt;tu-api-key&gt;</code></pre>
  <p>Generá tu key desde la sección <strong>Ajustes</strong> en <span class="url">calendario.exegestion.com</span>.</p>

  <h2>Base URL</h2>
  <pre><code>https://api.exegestion.com</code></pre>

  <h2>Respuestas</h2>
  <p>Todas las respuestas son JSON. Éxito: <code>{ "data": ... }</code> — Error: <code>{ "error": "mensaje" }</code></p>

  <!-- TASKS -->
  <h2>Tareas</h2>

  <h3><span class="badge GET">GET</span> /tasks</h3>
  <p>Lista de tareas. Todos los filtros son opcionales.</p>
  <table>
    <tr><th>Query param</th><th>Tipo</th><th>Descripción</th></tr>
    <tr><td>date</td><td>string</td><td>Fecha exacta <code>YYYY-MM-DD</code></td></tr>
    <tr><td>date_from</td><td>string</td><td>Desde fecha</td></tr>
    <tr><td>date_to</td><td>string</td><td>Hasta fecha</td></tr>
    <tr><td>done</td><td>boolean</td><td><code>true</code> completadas / <code>false</code> pendientes</td></tr>
    <tr><td>priority</td><td>string</td><td><code>high</code> · <code>medium</code> · <code>low</code></td></tr>
    <tr><td>category</td><td>string</td><td>Nombre de categoría</td></tr>
    <tr><td>limit</td><td>number</td><td>Máximo de resultados</td></tr>
  </table>
  <pre><code>GET /tasks?date=2026-03-26&amp;done=false</code></pre>

  <h3><span class="badge POST">POST</span> /tasks</h3>
  <p>Crea una tarea.</p>
  <pre><code>{
  "text":     "Ir al gym",          // requerido
  "date":     "2026-03-26",         // requerido (YYYY-MM-DD)
  "priority": "high",               // opcional: high | medium | low  (default: medium)
  "category": "Salud"               // opcional: Personal | Trabajo | Salud | Finanzas | Otro
}</code></pre>

  <h3><span class="badge PATCH">PATCH</span> /tasks/:id</h3>
  <p>Actualiza campos de una tarea. Enviá solo los que querés cambiar.</p>
  <pre><code>{
  "done":     true,
  "text":     "Nuevo texto",
  "priority": "low",
  "category": "Trabajo",
  "date":     "2026-03-27"
}</code></pre>

  <h3><span class="badge DELETE">DELETE</span> /tasks/:id</h3>
  <p>Elimina una tarea. Devuelve <code>{ "data": { "deleted": "&lt;id&gt;" } }</code>.</p>

  <!-- EXPENSES -->
  <h2>Gastos e Ingresos</h2>

  <h3><span class="badge GET">GET</span> /expenses</h3>
  <p>Lista de movimientos financieros.</p>
  <table>
    <tr><th>Query param</th><th>Tipo</th><th>Descripción</th></tr>
    <tr><td>date</td><td>string</td><td>Fecha exacta <code>YYYY-MM-DD</code></td></tr>
    <tr><td>date_from</td><td>string</td><td>Desde fecha</td></tr>
    <tr><td>date_to</td><td>string</td><td>Hasta fecha</td></tr>
    <tr><td>type</td><td>string</td><td><code>income</code> o <code>expense</code></td></tr>
    <tr><td>category</td><td>string</td><td>Nombre de categoría</td></tr>
    <tr><td>limit</td><td>number</td><td>Máximo de resultados</td></tr>
  </table>

  <h3><span class="badge POST">POST</span> /expenses</h3>
  <p>Registra un gasto o ingreso.</p>
  <pre><code>{
  "type":        "expense",         // requerido: "income" o "expense"
  "amount":      1500,              // requerido (número positivo)
  "description": "Almuerzo",        // requerido
  "date":        "2026-03-26",      // requerido (YYYY-MM-DD)
  "category":    "Alimentación"     // opcional (default: "Otro")
}</code></pre>

  <h3><span class="badge DELETE">DELETE</span> /expenses/:id</h3>
  <p>Elimina un movimiento financiero.</p>

  <!-- SUMMARIES -->
  <h2>Resúmenes</h2>

  <h3><span class="badge GET">GET</span> /summary/today</h3>
  <p>Resumen del día de hoy: tareas y finanzas.</p>
  <pre><code>{
  "data": {
    "date": "2026-03-26",
    "tasks":    { "total": 3, "pending": 1, "done": 2, "items": [...] },
    "finances": { "income": 50000, "expense": 1500, "balance": 48500, "items": [...] }
  }
}</code></pre>

  <h3><span class="badge GET">GET</span> /summary/monthly?year=2026&amp;month=3</h3>
  <p>Reporte financiero mensual con totales y breakdown por categoría.</p>

  <h2>Ejemplo rápido</h2>
  <pre><code>curl https://api.exegestion.com/tasks?done=false \\
  -H "Authorization: Bearer tu-api-key"</code></pre>

  <pre><code>curl -X POST https://api.exegestion.com/tasks \\
  -H "Authorization: Bearer tu-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Estudiar inglés","date":"2026-03-26","priority":"high"}'</code></pre>

</div>
</body>
</html>`;

  return new Response(html, {
    headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}
