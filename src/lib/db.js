import { supabase } from './supabase.js';

// ─── TASKS ────────────────────────────────────────────────

export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(dbToTask);
}

export async function createTask(userId, task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...taskToDb(task), user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return dbToTask(data);
}

export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(taskToDb(updates))
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return dbToTask(data);
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

// ─── EXPENSES ─────────────────────────────────────────────

export async function fetchExpenses(userId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(dbToExpense);
}

export async function createExpense(userId, expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expenseToDb(expense), user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return dbToExpense(data);
}

export async function deleteExpense(expenseId) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

// ─── API KEY ──────────────────────────────────────────────

export async function getApiKey(userId) {
  const { data } = await supabase
    .from('api_keys')
    .select('api_key, created_at')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function generateApiKey(userId) {
  await supabase.from('api_keys').delete().eq('user_id', userId);
  const { data, error } = await supabase
    .from('api_keys')
    .insert({ user_id: userId })
    .select('api_key, created_at')
    .single();
  if (error) throw error;
  return data;
}

// ─── MAPPERS ──────────────────────────────────────────────
// DB uses snake_case; app uses camelCase + ISO string dates

function dbToTask(row) {
  return {
    id:        row.id,
    text:      row.text,
    done:      row.done,
    priority:  row.priority,
    category:  row.category,
    date:      row.date + 'T12:00:00',   // noon local time — evita shift de timezone
    createdAt: row.created_at,
  };
}

function taskToDb(t) {
  const out = {};
  if (t.text      !== undefined) out.text      = t.text;
  if (t.done      !== undefined) out.done      = t.done;
  if (t.priority  !== undefined) out.priority  = t.priority;
  if (t.category  !== undefined) out.category  = t.category;
  if (t.date      !== undefined) out.date      = t.date.slice(0, 10); // ISO → date
  return out;
}

function dbToExpense(row) {
  return {
    id:       row.id,
    type:     row.type,
    amount:   Number(row.amount),
    desc:     row.description,
    category: row.category,
    date:     row.date + 'T12:00:00',
  };
}

function expenseToDb(e) {
  const out = {};
  if (e.type        !== undefined) out.type        = e.type;
  if (e.amount      !== undefined) out.amount      = e.amount;
  if (e.desc        !== undefined) out.description = e.desc;
  if (e.category    !== undefined) out.category    = e.category;
  if (e.date        !== undefined) out.date        = e.date.slice(0, 10);
  return out;
}
