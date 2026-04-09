import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export function useSearch(userId, query) {
  const [results, setResults] = useState({ tasks: [], notes: [], habits: [], documents: [], grocery: [] });
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (!userId || q.length < 2) {
      setResults({ tasks: [], notes: [], habits: [], documents: [], grocery: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const like = `%${q}%`;
      try {
        const [tasks, notes, habits, docs, grocery] = await Promise.all([
          supabase.from('tasks').select('id, title, date, done').eq('user_id', userId).ilike('title', like).limit(6),
          supabase.from('notes').select('id, title, content, color').eq('user_id', userId).or(`title.ilike.${like},content.ilike.${like}`).limit(6),
          supabase.from('habits').select('id, name, icon, color').eq('user_id', userId).ilike('name', like).limit(6),
          supabase.from('documents').select('id, name, number, cat').eq('user_id', userId).or(`name.ilike.${like},number.ilike.${like},notes.ilike.${like}`).limit(6),
          supabase.from('grocery_items').select('id, name, done').eq('user_id', userId).ilike('name', like).limit(6),
        ]);
        setResults({
          tasks:     tasks.data     || [],
          notes:     notes.data     || [],
          habits:    habits.data    || [],
          documents: docs.data      || [],
          grocery:   grocery.data   || [],
        });
      } catch (e) {
        console.error('useSearch error:', e);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timerRef.current);
  }, [userId, query]);

  return { results, loading };
}
