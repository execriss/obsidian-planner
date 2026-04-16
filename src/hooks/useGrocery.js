import { useState, useEffect, useCallback } from 'react';
import {
  fetchGroceryItems, createGroceryItem, updateGroceryItem,
  deleteGroceryItem, deleteGroceryItemsByUser, resetGroceryItems,
  fetchGrocerySessions, createGrocerySession,
} from '../lib/db.js';

export function useGrocery(userId, ownerId = null) {
  const dataUserId = ownerId ?? userId;

  const [items, setItems]       = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!dataUserId) return;
    setLoading(true);
    Promise.all([fetchGroceryItems(dataUserId), fetchGrocerySessions(dataUserId)])
      .then(([its, sess]) => { setItems(its); setSessions(sess); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dataUserId]);

  const addItem = useCallback(async (item) => {
    const created = await createGroceryItem(dataUserId, item);
    setItems(prev => [...prev, created]);
  }, [dataUserId]);

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
    await deleteGroceryItemsByUser(dataUserId).catch(console.error);
  }, [dataUserId]);

  const editItem = useCallback(async (id, changes) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
    await updateGroceryItem(id, changes).catch(console.error);
  }, []);

  const resetList = useCallback(async () => {
    setItems(prev => prev.map(i => ({ ...i, done: false })));
    await resetGroceryItems(dataUserId).catch(console.error);
  }, [dataUserId]);

  const saveSession = useCallback(async (session) => {
    const saved = await createGrocerySession(dataUserId, session);
    setSessions(prev => [saved, ...prev].slice(0, 10));
    return saved;
  }, [dataUserId]);

  return { items, sessions, loading, addItem, editItem, toggleItem, removeItem, clearDone, clearAll, resetList, saveSession };
}
