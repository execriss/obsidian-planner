import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

function pick(settled) {
  return settled.status === 'fulfilled' ? (settled.value.data || []) : [];
}

// Merge two arrays deduplicating by id
function merge(a, b) {
  const seen = new Set(a.map(x => x.id));
  return [...a, ...b.filter(x => !seen.has(x.id))];
}

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

      // Each query is independent — a failure in one doesn't block the rest
      const [tasks, notesByContent, notesByTitle, habits, docsByName, docsByNumber, grocery] =
        await Promise.allSettled([
          supabase.from('tasks').select('id, text, date, done')
            .eq('user_id', userId).ilike('text', like).limit(8),

          supabase.from('notes').select('id, title, content, color')
            .eq('user_id', userId).ilike('content', like).limit(6),

          supabase.from('notes').select('id, title, content, color')
            .eq('user_id', userId).ilike('title', like).limit(6),

          supabase.from('habits').select('id, name, icon, color')
            .eq('user_id', userId).ilike('name', like).limit(6),

          supabase.from('documents').select('id, name, number, cat')
            .eq('user_id', userId).ilike('name', like).limit(6),

          supabase.from('documents').select('id, name, number, cat')
            .eq('user_id', userId).ilike('number', like).limit(6),

          supabase.from('grocery_items').select('id, name, done')
            .eq('user_id', userId).ilike('name', like).limit(6),
        ]);

      setResults({
        tasks:     pick(tasks),
        notes:     merge(pick(notesByContent), pick(notesByTitle)).slice(0, 6),
        habits:    pick(habits),
        documents: merge(pick(docsByName), pick(docsByNumber)).slice(0, 6),
        grocery:   pick(grocery),
      });
      setLoading(false);
    }, 220);

    return () => clearTimeout(timerRef.current);
  }, [userId, query]);

  return { results, loading };
}
