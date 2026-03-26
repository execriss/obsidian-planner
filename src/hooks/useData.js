import { useState, useEffect, useCallback } from 'react';
import {
  fetchTasks, createTask, updateTask, deleteTask,
  fetchExpenses, createExpense, deleteExpense,
} from '../lib/db.js';

export function useData(userId) {
  const [tasks, setTasks]       = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([fetchTasks(userId), fetchExpenses(userId)])
      .then(([t, e]) => { setTasks(t); setExpenses(e); })
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Task actions ──────────────────────────────────────

  const addTask = useCallback(async (taskData) => {
    const created = await createTask(userId, taskData);
    setTasks(prev => [...prev, created]);
    return created;
  }, [userId]);

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    try {
      await updateTask(id, { done: !task.done });
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: task.done } : t));
    }
  }, [tasks]);

  const removeTask = useCallback(async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTask(id);
    } catch {
      setTasks(prev => [...prev]);  // trigger re-fetch if needed
    }
  }, []);

  // ── Expense actions ───────────────────────────────────

  const addExpense = useCallback(async (expenseData) => {
    const created = await createExpense(userId, expenseData);
    setExpenses(prev => [...prev, created]);
    return created;
  }, [userId]);

  const removeExpense = useCallback(async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      await deleteExpense(id);
    } catch {
      setExpenses(prev => [...prev]);
    }
  }, []);

  // ── localStorage migration (one-time) ────────────────

  const migrateFromLocalStorage = useCallback(async () => {
    const rawTasks    = localStorage.getItem('obsidian_tasks');
    const rawExpenses = localStorage.getItem('obsidian_expenses');
    if (!rawTasks && !rawExpenses) return 0;

    const oldTasks    = rawTasks    ? JSON.parse(rawTasks)    : [];
    const oldExpenses = rawExpenses ? JSON.parse(rawExpenses) : [];

    const promises = [
      ...oldTasks.map(t => createTask(userId, t)),
      ...oldExpenses.map(e => createExpense(userId, e)),
    ];

    await Promise.all(promises);
    localStorage.removeItem('obsidian_tasks');
    localStorage.removeItem('obsidian_expenses');

    const [t, e] = await Promise.all([fetchTasks(userId), fetchExpenses(userId)]);
    setTasks(t);
    setExpenses(e);

    return oldTasks.length + oldExpenses.length;
  }, [userId]);

  return {
    tasks, expenses, loading,
    addTask, toggleTask, removeTask,
    addExpense, removeExpense,
    migrateFromLocalStorage,
  };
}
