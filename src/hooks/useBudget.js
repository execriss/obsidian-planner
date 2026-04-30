import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem,
  fetchBudgetEntries, upsertBudgetEntry,
  fetchBudgetIncome, createBudgetIncome, updateBudgetIncome, deleteBudgetIncome,
} from '../lib/db.js';

export function useBudget(userId, month, ownerId = null) {
  const dataUserId = ownerId ?? userId;

  const [items,   setItems]   = useState([]);
  const [entries, setEntries] = useState([]);
  const [income,  setIncome]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    if (!dataUserId || !month) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchBudgetItems(dataUserId),
      fetchBudgetEntries(dataUserId, month),
      fetchBudgetIncome(dataUserId, month),
    ]).then(([its, ents, inc]) => {
      setItems(its); setEntries(ents); setIncome(inc);
    }).catch(err => {
      console.error(err);
      setError(err?.message || 'Error al cargar el presupuesto');
    }).finally(() => setLoading(false));
  }, [dataUserId, month]);

  useEffect(() => { load(); }, [load]);

  // Merge template items with their monthly entries
  const merged = useMemo(() => items.map(item => {
    const entry = entries.find(e => e.itemId === item.id);
    return {
      ...item,
      amount:  entry?.amount ?? item.defaultAmount,
      paid:    entry?.paid   ?? 0,
      notes:   entry?.notes  ?? '',
      entryId: entry?.id     ?? null,
    };
  }), [items, entries]);

  // Unique categories preserving insertion order
  const categories = useMemo(() => {
    const map = new Map();
    items.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, item.catColor);
    });
    return Array.from(map, ([name, color]) => ({ name, color }));
  }, [items]);

  // ── Item CRUD ──────────────────────────────────────────
  const addItem = useCallback(async (data) => {
    const created = await createBudgetItem(dataUserId, data);
    setItems(prev => [...prev, created]);
    return created;
  }, [dataUserId]);

  const editItem = useCallback(async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await updateBudgetItem(id, updates).catch(console.error);
  }, []);

  const removeItem = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setEntries(prev => prev.filter(e => e.itemId !== id));
    await deleteBudgetItem(id).catch(console.error);
  }, []);

  // ── Entry (per-month paid/amount) — optimistic ────────
  const updateEntry = useCallback(async (itemId, updates) => {
    const existing = entries.find(e => e.itemId === itemId);
    const item     = items.find(i => i.id === itemId);
    const current  = existing ?? { amount: item?.defaultAmount ?? 0, paid: 0, notes: '' };
    const optimistic = { ...current, ...updates, itemId, month, id: existing?.id ?? 'tmp' };
    setEntries(prev =>
      existing ? prev.map(e => e.itemId === itemId ? optimistic : e) : [...prev, optimistic]
    );
    upsertBudgetEntry(dataUserId, {
      itemId, month,
      amount: updates.amount ?? current.amount,
      paid:   updates.paid   ?? current.paid,
      notes:  updates.notes  ?? current.notes,
    }).then(saved => {
      setEntries(prev => prev.map(e => e.itemId === itemId ? saved : e));
    }).catch(console.error);
  }, [dataUserId, month, entries, items]);

  // ── Category operations ────────────────────────────────
  const editCategory = useCallback(async (oldName, updates) => {
    const affected = items.filter(i => i.category === oldName);
    setItems(prev => prev.map(i => i.category === oldName
      ? { ...i, category: updates.name ?? oldName, catColor: updates.color ?? i.catColor }
      : i));
    await Promise.all(affected.map(i => updateBudgetItem(i.id, {
      category: updates.name  ?? oldName,
      catColor: updates.color ?? i.catColor,
    }))).catch(console.error);
  }, [items]);

  const removeCategory = useCallback(async (catName) => {
    const affected = items.filter(i => i.category === catName);
    setItems(prev => prev.filter(i => i.category !== catName));
    await Promise.all(affected.map(i => deleteBudgetItem(i.id))).catch(console.error);
  }, [items]);

  // ── Init month from template ──────────────────────────
  const initMonth = useCallback(async (prevIncome = []) => {
    const newEntries = await Promise.all(
      items.map(item => upsertBudgetEntry(dataUserId, {
        itemId: item.id, month,
        amount: item.defaultAmount, paid: 0, notes: '',
      }))
    );
    setEntries(newEntries);
    if (prevIncome.length > 0) {
      const newIncome = await Promise.all(
        prevIncome.map(inc => createBudgetIncome(dataUserId, {
          source: inc.source, amount: inc.amount, month, sortOrder: inc.sortOrder ?? 0,
        }))
      );
      setIncome(newIncome);
    }
  }, [dataUserId, month, items]);

  // ── Income ────────────────────────────────────────────
  const addIncome = useCallback(async (data) => {
    const created = await createBudgetIncome(dataUserId, { ...data, month });
    setIncome(prev => [...prev, created]);
  }, [dataUserId, month]);

  const editIncome = useCallback(async (id, updates) => {
    setIncome(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await updateBudgetIncome(id, updates).catch(console.error);
  }, []);

  const removeIncome = useCallback(async (id) => {
    setIncome(prev => prev.filter(i => i.id !== id));
    await deleteBudgetIncome(id).catch(console.error);
  }, []);

  return {
    items, entries, income, loading, error, retry: load,
    merged, categories,
    addItem, editItem, removeItem, updateEntry, initMonth,
    editCategory, removeCategory,
    addIncome, editIncome, removeIncome,
  };
}
