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

export async function updateExpense(expenseId, updates) {
  const { data, error } = await supabase
    .from('expenses')
    .update(expenseToDb(updates))
    .eq('id', expenseId)
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

// ─── GROCERY ITEMS ────────────────────────────────────────

export async function fetchGroceryItems(userId) {
  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(r => ({ id: r.id, text: r.text, qty: r.qty, cat: r.cat, done: r.done }));
}

export async function createGroceryItem(userId, item) {
  const { data, error } = await supabase
    .from('grocery_items')
    .insert({ user_id: userId, text: item.text, qty: item.qty || '1', cat: item.cat || 'otro', done: false })
    .select().single();
  if (error) throw error;
  return { id: data.id, text: data.text, qty: data.qty, cat: data.cat, done: data.done };
}

export async function updateGroceryItem(itemId, updates) {
  const { data, error } = await supabase
    .from('grocery_items')
    .update(updates)
    .eq('id', itemId)
    .select().single();
  if (error) throw error;
  return { id: data.id, text: data.text, qty: data.qty, cat: data.cat, done: data.done };
}

export async function deleteGroceryItem(itemId) {
  const { error } = await supabase.from('grocery_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function deleteGroceryItemsByUser(userId) {
  const { error } = await supabase.from('grocery_items').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function resetGroceryItems(userId) {
  const { error } = await supabase
    .from('grocery_items')
    .update({ done: false })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchGrocerySessions(userId) {
  const { data, error } = await supabase
    .from('grocery_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data.map(r => ({
    id: r.id, total: Number(r.total), discounts: r.discounts,
    final: Number(r.final), createdAt: r.created_at,
  }));
}

export async function createGrocerySession(userId, session) {
  const { data, error } = await supabase
    .from('grocery_sessions')
    .insert({ user_id: userId, total: session.total, discounts: session.discounts, final: session.final })
    .select().single();
  if (error) throw error;
  return { id: data.id, total: Number(data.total), discounts: data.discounts, final: Number(data.final), createdAt: data.created_at };
}

// ─── SERVICES ─────────────────────────────────────────────

export async function fetchServices(userId) {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_payments(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(dbToService);
}

export async function createService(userId, svc) {
  const { data, error } = await supabase
    .from('services')
    .insert({ user_id: userId, name: svc.name, icon: svc.icon, color: svc.color || 'amber',
              account_id: svc.accountId, website: svc.website, cat: svc.cat || 'otro', notes: svc.notes })
    .select('*, service_payments(*)').single();
  if (error) throw error;
  return dbToService(data);
}

export async function updateService(svcId, updates) {
  const upd = {};
  if (updates.name      !== undefined) upd.name       = updates.name;
  if (updates.icon      !== undefined) upd.icon       = updates.icon;
  if (updates.color     !== undefined) upd.color      = updates.color;
  if (updates.accountId !== undefined) upd.account_id = updates.accountId;
  if (updates.website   !== undefined) upd.website    = updates.website;
  if (updates.cat       !== undefined) upd.cat        = updates.cat;
  if (updates.notes     !== undefined) upd.notes      = updates.notes;
  const { data, error } = await supabase
    .from('services')
    .update(upd)
    .eq('id', svcId)
    .select('*, service_payments(*)').single();
  if (error) throw error;
  return dbToService(data);
}

export async function deleteService(svcId) {
  const { error } = await supabase.from('services').delete().eq('id', svcId);
  if (error) throw error;
}

export async function createServicePayment(userId, svcId, payment) {
  const { data, error } = await supabase
    .from('service_payments')
    .insert({ user_id: userId, service_id: svcId, month: payment.month,
              amount: payment.amount, date: payment.date || null })
    .select().single();
  if (error) throw error;
  return { id: data.id, month: data.month, amount: Number(data.amount), date: data.date, paidAt: data.paid_at };
}

function dbToService(row) {
  return {
    id:        row.id,
    name:      row.name,
    icon:      row.icon,
    color:     row.color,
    accountId: row.account_id,
    website:   row.website,
    cat:       row.cat,
    notes:     row.notes,
    payments:  (row.service_payments || []).map(p => ({
      id: p.id, month: p.month, amount: Number(p.amount), date: p.date, paidAt: p.paid_at,
    })),
  };
}

// ─── HABITS ───────────────────────────────────────────────

export async function fetchHabits(userId) {
  const { data, error } = await supabase
    .from('habits')
    .select('*, habit_logs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(dbToHabit);
}

export async function createHabit(userId, habit) {
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, name: habit.name, icon: habit.icon, color: habit.color || 'amber' })
    .select('*, habit_logs(*)').single();
  if (error) throw error;
  return dbToHabit(data);
}

export async function updateHabit(habitId, updates) {
  const { data, error } = await supabase
    .from('habits')
    .update({ name: updates.name, icon: updates.icon, color: updates.color })
    .eq('id', habitId)
    .select('*, habit_logs(*)').single();
  if (error) throw error;
  return dbToHabit(data);
}

export async function deleteHabit(habitId) {
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  if (error) throw error;
}

export async function toggleHabitLog(userId, habitId, date) {
  // Check if log exists
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('date', date)
    .single();
  if (existing) {
    const { error } = await supabase.from('habit_logs').delete().eq('id', existing.id);
    if (error) throw error;
    return false; // removed
  } else {
    const { error } = await supabase.from('habit_logs').insert({ user_id: userId, habit_id: habitId, date });
    if (error) throw error;
    return true; // added
  }
}

function dbToHabit(row) {
  return {
    id:    row.id,
    name:  row.name,
    icon:  row.icon,
    color: row.color,
    logs:  (row.habit_logs || []).map(l => l.date),
  };
}

// ─── NOTES ────────────────────────────────────────────────

export async function fetchNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(dbToNote);
}

export async function createNote(userId, note) {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, title: note.title || null, content: note.content,
              color: note.color || 'amber', pinned: false })
    .select().single();
  if (error) throw error;
  return dbToNote(data);
}

export async function updateNote(noteId, updates) {
  const upd = { updated_at: new Date().toISOString() };
  if (updates.title   !== undefined) upd.title   = updates.title;
  if (updates.content !== undefined) upd.content = updates.content;
  if (updates.color   !== undefined) upd.color   = updates.color;
  if (updates.pinned  !== undefined) upd.pinned  = updates.pinned;
  const { data, error } = await supabase
    .from('notes')
    .update(upd)
    .eq('id', noteId)
    .select().single();
  if (error) throw error;
  return dbToNote(data);
}

export async function deleteNote(noteId) {
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) throw error;
}

function dbToNote(row) {
  return {
    id:        row.id,
    title:     row.title,
    content:   row.content,
    color:     row.color,
    pinned:    row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── DOCUMENTS ────────────────────────────────────────────

export async function fetchDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(dbToDocument);
}

export async function createDocument(userId, doc) {
  const { data, error } = await supabase
    .from('documents')
    .insert({ user_id: userId, name: doc.name, number: doc.number || null,
              cat: doc.cat || 'otro', notes: doc.notes || null,
              expires: doc.expires || null })
    .select().single();
  if (error) throw error;
  return dbToDocument(data);
}

export async function updateDocument(docId, updates) {
  const upd = {};
  if (updates.name    !== undefined) upd.name    = updates.name;
  if (updates.number  !== undefined) upd.number  = updates.number;
  if (updates.cat     !== undefined) upd.cat     = updates.cat;
  if (updates.notes   !== undefined) upd.notes   = updates.notes;
  if (updates.expires !== undefined) upd.expires = updates.expires || null;
  const { data, error } = await supabase
    .from('documents')
    .update(upd)
    .eq('id', docId)
    .select().single();
  if (error) throw error;
  return dbToDocument(data);
}

export async function deleteDocument(docId) {
  const { error } = await supabase.from('documents').delete().eq('id', docId);
  if (error) throw error;
}

function dbToDocument(row) {
  return {
    id:      row.id,
    name:    row.name,
    number:  row.number,
    cat:     row.cat,
    notes:   row.notes,
    expires: row.expires,
  };
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

// ─── BUDGET ───────────────────────────────────────────────

export async function fetchBudgetItems(userId) {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(dbToBudgetItem);
}

export async function createBudgetItem(userId, item) {
  const { data, error } = await supabase
    .from('budget_items')
    .insert({ user_id: userId, category: item.category, name: item.name,
              default_amount: item.defaultAmount || 0, cat_color: item.catColor || 'blue',
              sort_order: item.sortOrder || 0 })
    .select().single();
  if (error) throw error;
  return dbToBudgetItem(data);
}

export async function updateBudgetItem(id, updates) {
  const upd = {};
  if (updates.category      !== undefined) upd.category       = updates.category;
  if (updates.name          !== undefined) upd.name           = updates.name;
  if (updates.defaultAmount !== undefined) upd.default_amount = updates.defaultAmount;
  if (updates.catColor      !== undefined) upd.cat_color      = updates.catColor;
  if (updates.sortOrder     !== undefined) upd.sort_order     = updates.sortOrder;
  const { data, error } = await supabase
    .from('budget_items').update(upd).eq('id', id).select().single();
  if (error) throw error;
  return dbToBudgetItem(data);
}

export async function deleteBudgetItem(id) {
  const { error } = await supabase.from('budget_items').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBudgetEntries(userId, month) {
  const { data, error } = await supabase
    .from('budget_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month);
  if (error) throw error;
  return data.map(dbToBudgetEntry);
}

export async function upsertBudgetEntry(userId, entry) {
  const { data, error } = await supabase
    .from('budget_entries')
    .upsert(
      { user_id: userId, item_id: entry.itemId, month: entry.month,
        amount: entry.amount ?? 0, paid: entry.paid ?? 0, notes: entry.notes ?? '' },
      { onConflict: 'item_id,month' }
    )
    .select().single();
  if (error) throw error;
  return dbToBudgetEntry(data);
}

export async function fetchBudgetIncome(userId, month) {
  const { data, error } = await supabase
    .from('budget_income')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(dbToBudgetIncome);
}

export async function createBudgetIncome(userId, inc) {
  const { data, error } = await supabase
    .from('budget_income')
    .insert({ user_id: userId, month: inc.month, source: inc.source,
              amount: inc.amount || 0, notes: inc.notes || '', sort_order: inc.sortOrder || 0 })
    .select().single();
  if (error) throw error;
  return dbToBudgetIncome(data);
}

export async function updateBudgetIncome(id, updates) {
  const upd = {};
  if (updates.source !== undefined) upd.source = updates.source;
  if (updates.amount !== undefined) upd.amount = updates.amount;
  if (updates.notes  !== undefined) upd.notes  = updates.notes;
  const { data, error } = await supabase
    .from('budget_income').update(upd).eq('id', id).select().single();
  if (error) throw error;
  return dbToBudgetIncome(data);
}

export async function deleteBudgetIncome(id) {
  const { error } = await supabase.from('budget_income').delete().eq('id', id);
  if (error) throw error;
}

function dbToBudgetItem(r) {
  return { id: r.id, category: r.category, name: r.name,
           defaultAmount: Number(r.default_amount), catColor: r.cat_color,
           sortOrder: r.sort_order };
}
function dbToBudgetEntry(r) {
  return { id: r.id, itemId: r.item_id, month: r.month,
           amount: Number(r.amount), paid: Number(r.paid), notes: r.notes || '' };
}
function dbToBudgetIncome(r) {
  return { id: r.id, month: r.month, source: r.source,
           amount: Number(r.amount), notes: r.notes || '', sortOrder: r.sort_order };
}
