import { useState } from 'react';
import { Plus, Check, Trash2, Circle, Flag, Tag } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const PRIORITIES = {
  high: { label: 'Alta', color: '#E05C5C' },
  medium: { label: 'Media', color: '#F0A500' },
  low: { label: 'Baja', color: '#5FAD8E' },
};

const CATEGORIES = ['Personal', 'Trabajo', 'Salud', 'Finanzas', 'Otro'];

export default function TodoList({ selectedDate, tasks, onTasksChange }) {
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('Personal');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const dayTasks = tasks.filter(t => isSameDay(new Date(t.date), selectedDate));
  const filtered = filter === 'all' ? dayTasks : filter === 'done' ? dayTasks.filter(t => t.done) : dayTasks.filter(t => !t.done);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      text: newTask.trim(),
      done: false,
      priority,
      category,
      date: selectedDate.toISOString(),
      createdAt: new Date().toISOString(),
    };
    onTasksChange([...tasks, task]);
    setNewTask('');
    setShowForm(false);
  };

  const toggleTask = (id) => {
    onTasksChange(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    onTasksChange(tasks.filter(t => t.id !== id));
  };

  const donePct = dayTasks.length ? Math.round((dayTasks.filter(t => t.done).length / dayTasks.length) * 100) : 0;

  return (
    <div style={{ animation: 'scaleIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cream-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>
            {format(selectedDate, 'EEEE', { locale: es })} · {dayTasks.length} tareas · {donePct}% completadas
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: showForm ? 'var(--obsidian-4)' : 'var(--amber)',
            color: showForm ? 'var(--cream)' : 'var(--obsidian)',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          <Plus size={14} />
          Nueva tarea
        </button>
      </div>

      {/* Progress bar */}
      {dayTasks.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${donePct}%`,
              background: 'linear-gradient(90deg, var(--amber), var(--sage))',
              borderRadius: '2px',
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>
      )}

      {/* Form nueva tarea */}
      {showForm && (
        <div style={{
          background: 'var(--obsidian-3)',
          border: '1px solid var(--border-light)',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          animation: 'fadeUp 0.25s ease',
        }}>
          <input
            autoFocus
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="¿Qué necesitas hacer?"
            style={{
              width: '100%',
              background: 'var(--obsidian-4)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '14px',
              color: 'var(--cream)',
              outline: 'none',
              marginBottom: '12px',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
          />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Prioridad */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {Object.entries(PRIORITIES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setPriority(key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: `1px solid ${priority === key ? val.color : 'var(--border)'}`,
                    background: priority === key ? `${val.color}22` : 'transparent',
                    color: priority === key ? val.color : 'var(--cream-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {val.label}
                </button>
              ))}
            </div>

            {/* Categoría */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                background: 'var(--obsidian-4)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11px',
                color: 'var(--cream-dim)',
                outline: 'none',
              }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <button
              onClick={addTask}
              style={{
                marginLeft: 'auto',
                padding: '7px 20px',
                borderRadius: '9px',
                background: 'var(--amber)',
                color: 'var(--obsidian)',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['all', 'Todas'], ['pending', 'Pendientes'], ['done', 'Completadas']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '5px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 500,
              background: filter === key ? 'var(--obsidian-4)' : 'transparent',
              color: filter === key ? 'var(--cream)' : 'var(--cream-muted)',
              border: filter === key ? '1px solid var(--border-light)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'var(--cream-muted)',
            fontSize: '13px',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', opacity: 0.3, marginBottom: '8px' }}>✦</div>
            {filter === 'all' ? 'Sin tareas para este día' : `Sin tareas ${filter === 'done' ? 'completadas' : 'pendientes'}`}
          </div>
        ) : (
          filtered.map((task, i) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--obsidian-3)',
                border: `1px solid ${task.done ? 'var(--border)' : 'var(--border-light)'}`,
                opacity: task.done ? 0.6 : 1,
                animation: `fadeUp 0.2s ease ${i * 0.04}s both`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = task.done ? 'var(--border-light)' : PRIORITIES[task.priority].color + '66'}
              onMouseLeave={e => e.currentTarget.style.borderColor = task.done ? 'var(--border)' : 'var(--border-light)'}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '7px',
                  border: `2px solid ${task.done ? 'var(--sage)' : PRIORITIES[task.priority].color}`,
                  background: task.done ? 'var(--sage)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  animation: task.done ? 'none' : undefined,
                }}
              >
                {task.done && <Check size={12} color="var(--obsidian)" strokeWidth={3} />}
              </button>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  color: task.done ? 'var(--cream-muted)' : 'var(--cream)',
                  textDecoration: task.done ? 'line-through' : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {task.text}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: `${PRIORITIES[task.priority].color}22`,
                    color: PRIORITIES[task.priority].color,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}>
                    {PRIORITIES[task.priority].label}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--cream-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}>
                    <Tag size={9} /> {task.category}
                  </span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cream-muted)',
                  opacity: 0,
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-dim)'; e.currentTarget.style.opacity = 1; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = 0; }}
                ref={el => {
                  if (el) {
                    el.closest('div').addEventListener('mouseenter', () => el.style.opacity = '1');
                    el.closest('div').addEventListener('mouseleave', () => el.style.opacity = '0');
                  }
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
