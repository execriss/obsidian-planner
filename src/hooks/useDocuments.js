import { useState, useEffect, useCallback } from 'react';
import { fetchDocuments, createDocument, updateDocument, deleteDocument } from '../lib/db.js';

export function useDocuments(userId) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchDocuments(userId)
      .then(setDocs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const addDoc = useCallback(async (doc) => {
    const created = await createDocument(userId, doc);
    setDocs(prev => [...prev, created]);
    return created;
  }, [userId]);

  const editDoc = useCallback(async (id, updates) => {
    const updated = await updateDocument(id, updates);
    setDocs(prev => prev.map(d => d.id === id ? updated : d));
  }, []);

  const removeDoc = useCallback(async (id) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    await deleteDocument(id).catch(console.error);
  }, []);

  return { docs, loading, addDoc, editDoc, removeDoc };
}
