import { useState, useEffect, useCallback } from 'react';
import { fetchHabits, createHabit, updateHabit, deleteHabit, toggleHabitLog } from '../lib/db.js';

export function useHabits(userId) {
  const [habits, setHabits]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchHabits(userId)
      .then(setHabits)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const addHabit = useCallback(async (habit) => {
    const created = await createHabit(userId, habit);
    setHabits(prev => [...prev, created]);
  }, [userId]);

  const editHabit = useCallback(async (id, updates) => {
    const updated = await updateHabit(id, updates);
    setHabits(prev => prev.map(h => h.id === id ? { ...updated, logs: h.logs } : h));
  }, []);

  const removeHabit = useCallback(async (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    await deleteHabit(id).catch(console.error);
  }, []);

  const toggleLog = useCallback(async (habitId, date) => {
    // Optimistic update
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const hasLog = h.logs.includes(date);
      return { ...h, logs: hasLog ? h.logs.filter(d => d !== date) : [...h.logs, date] };
    }));
    await toggleHabitLog(userId, habitId, date).catch(err => {
      console.error(err);
      // Revert on error
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        const hasLog = h.logs.includes(date);
        return { ...h, logs: hasLog ? h.logs.filter(d => d !== date) : [...h.logs, date] };
      }));
    });
  }, [userId]);

  return { habits, loading, addHabit, editHabit, removeHabit, toggleLog };
}
