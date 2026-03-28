import { useState, useEffect, useCallback } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote } from '../lib/db.js';

export function useNotes(userId) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchNotes(userId)
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const addNote = useCallback(async (note) => {
    const created = await createNote(userId, note);
    setNotes(prev => [created, ...prev]);
  }, [userId]);

  const editNote = useCallback(async (id, updates) => {
    const updated = await updateNote(id, updates);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
  }, []);

  const removeNote = useCallback(async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await deleteNote(id).catch(console.error);
  }, []);

  const pinNote = useCallback(async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated = await updateNote(id, { pinned: !note.pinned });
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
  }, [notes]);

  return { notes, loading, addNote, editNote, removeNote, pinNote };
}
