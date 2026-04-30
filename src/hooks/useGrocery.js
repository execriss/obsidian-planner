import { useState, useEffect, useCallback } from 'react';
import {
  fetchGroceryItems, createGroceryItem, updateGroceryItem,
  deleteGroceryItem, deleteGroceryItemsByMonth, resetGroceryItems, copyGroceryItems,
  fetchGrocerySessions, createGrocerySession,
} from '../lib/db.js';

export function useGrocery(userId, month, ownerId = null) {
  const dataUserId = ownerId ?? userId;

  const [items, setItems]       = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!dataUserId || !month) return;
    setLoading(true);
    Promise.all([fetchGroceryItems(dataUserId, month), fetchGrocerySessions(dataUserId)])
      .then(([its, sess]) => { setItems(its); setSessions(sess); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dataUserId, month]);

  const addItem = useCallback(async (item) => {
    const created = await createGroceryItem(dataUserId, { ...item, month });
    setItems(prev => [...prev, created]);
  }, [dataUserId, month]);

  const toggleItem = useCallback(async (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
    const item = items.find(i => i.id === id);
    await updateGroceryItem(id, { done: !item.done }).catch(console.error);
  }, [items]);

  const confirmCheck = useCallback(async (id, qty, price) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty, price: price || null, done: true } : i));
    await updateGroceryItem(id, { qty, price: price || null, done: true }).catch(console.error);
  }, []);

  const removeItem = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await deleteGroceryItem(id).catch(console.error);
  }, []);

  const clearDone = useCallback(async () => {
    const done = items.filter(i => i.done);
    setItems(prev => prev.filter(i => !i.done));
    await Promise.all(done.map(i => deleteGroceryItem(i.id))).catch(console.error);
  }, [items]);

  const clearAll = useCallback(async () => {
    setItems([]);
    await deleteGroceryItemsByMonth(dataUserId, month).catch(console.error);
  }, [dataUserId, month]);

  const editItem = useCallback(async (id, changes) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
    await updateGroceryItem(id, changes).catch(console.error);
  }, []);

  const resetList = useCallback(async () => {
    setItems(prev => prev.map(i => ({ ...i, done: false })));
    await resetGroceryItems(dataUserId, month).catch(console.error);
  }, [dataUserId, month]);

  const initMonth = useCallback(async (fromMonth) => {
    const copied = await copyGroceryItems(dataUserId, fromMonth, month);
    setItems(copied);
  }, [dataUserId, month]);

  const saveSession = useCallback(async (session) => {
    const saved = await createGrocerySession(dataUserId, session);
    setSessions(prev => [saved, ...prev].slice(0, 10));
    return saved;
  }, [dataUserId]);

  return { items, sessions, loading, addItem, editItem, toggleItem, confirmCheck, removeItem, clearDone, clearAll, resetList, initMonth, saveSession };
}
