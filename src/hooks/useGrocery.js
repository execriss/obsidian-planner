import { useState, useEffect, useCallback } from 'react';
import {
  fetchGroceryItems, createGroceryItem, updateGroceryItem,
  deleteGroceryItem, deleteGroceryItemsByUser, resetGroceryItems,
  fetchGrocerySessions, createGrocerySession,
} from '../lib/db.js';

export function useGrocery(userId) {
  const [items, setItems]       = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([fetchGroceryItems(userId), fetchGrocerySessions(userId)])
      .then(([its, sess]) => { setItems(its); setSessions(sess); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const addItem = useCallback(async (item) => {
    const created = await createGroceryItem(userId, item);
    setItems(prev => [...prev, created]);
  }, [userId]);

  const toggleItem = useCallback(async (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
    const item = items.find(i => i.id === id);
    await updateGroceryItem(id, { done: !item.done }).catch(console.error);
  }, [items]);

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
    await deleteGroceryItemsByUser(userId).catch(console.error);
  }, [userId]);

  const resetList = useCallback(async () => {
    setItems(prev => prev.map(i => ({ ...i, done: false })));
    await resetGroceryItems(userId).catch(console.error);
  }, [userId]);

  const saveSession = useCallback(async (session) => {
    const saved = await createGrocerySession(userId, session);
    setSessions(prev => [saved, ...prev].slice(0, 10));
    return saved;
  }, [userId]);

  return { items, sessions, loading, addItem, toggleItem, removeItem, clearDone, clearAll, resetList, saveSession };
}
