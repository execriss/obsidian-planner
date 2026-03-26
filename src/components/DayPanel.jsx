import { useState, useRef } from 'react';
import {
  X, Plus, Check, Trash2, TrendingUp, TrendingDown, Tag,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const PRIORITY_COLORS = { high: '#E05C5C', medium: '#F0A500', low: '#5FAD8E' };
const PRIORITIES = { high: 'Alta', medium: 'Media', low: 'Baja' };
const TASK_CATS = ['Personal', 'Trabajo', 'Salud', 'Finanzas', 'Otro'];
const EXPENSE_CATS = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Hogar', 'Ropa', 'Tecnología', 'Otro'];
const INCOME_CATS = ['Salario', 'Freelance', 'Inversión', 'Regalo', 'Otro'];

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);

export default function DayPanel({ date, tasks, expenses, onAddTask, onToggleTask, onDeleteTask, onAddExpense, onDeleteExpense, onClose }) {
  const [activeSection, setActiveSection] = useState('tasks');
  const [tabKey, setTabKey] = useState(0); // triggers re-mount for tab animation

  // Task state
  const [newTask, setNewTask] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Finance state
  const [finType, setFinType] = useState('expense');
  const [finAmount, setFinAmount] = useState('');
  const [finDesc, setFinDesc] = useState('');
  const [finCat, setFinCat] = useState(EXPENSE_CATS[0]);
  const [showFinForm, setShowFinForm] = useState(false);

  // Deleting animation
  const [deletingIds, setDeletingIds] = useState(new Set());

  const dayTasks = tasks.filter(t => isSameDay(new Date(t.date), date));
  const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
  const dayIncome = dayExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const dayExpense = dayExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = dayIncome - dayExpense;
  const donePct = dayTasks.length
    ? Math.round((dayTasks.filter(t => t.done).length / dayTasks.length) * 100)
    : 0;

  const switchTab = (id) => {
    if (id === activeSection) return;
    setActiveSection(id);
    setTabKey(k => k + 1);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await onAddTask({
      text:     newTask.trim(),
      done:     false,
      priority: taskPriority,
      category: taskCategory,
      date:     format(date, 'yyyy-MM-dd'),
    });
    setNewTask('');
    setShowTaskForm(false);
  };

  const toggleTask = (id) => onToggleTask(id);

  const deleteTask = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      onDeleteTask(id);
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const addFinance = async () => {
    const n = parseFloat(finAmount);
    if (!n || !finDesc.trim()) return;
    await onAddExpense({
      type:     finType,
      amount:   n,
      desc:     finDesc.trim(),
      category: finCat,
      date:     format(date, 'yyyy-MM-dd'),
    });
    setFinAmount('');
    setFinDesc('');
    setShowFinForm(false);
  };

  const deleteExpense = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      onDeleteExpense(id);
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  return (
    <div
      className="animate-slideInRight"
      style={{
        width: '340px',
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--obsidian-2)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        animation: 'fadeDown 0.3s var(--ease-out) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px', fontWeight: 700,
              color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.02em',
              animation: 'fadeUp 0.35s var(--ease-spring) 0.05s both',
            }}>
              {format(date, "d 'de' MMMM", { locale: es })}
            </div>
            <div style={{
              fontSize: '10px', color: 'var(--cream-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '5px',
              animation: 'fadeUp 0.3s var(--ease-out) 0.12s both',
            }}>
              {format(date, 'EEEE · yyyy', { locale: es })}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cream-muted)',
              transition: 'all 0.2s var(--ease-spring)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--obsidian-4)';
              e.currentTarget.style.color = 'var(--cream)';
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--cream-muted)';
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Summary pills */}
        <div style={{
          display: 'flex', gap: '6px', flexWrap: 'wrap',
          animation: 'fadeUp 0.3s var(--ease-out) 0.18s both',
        }}>
          <div style={{
            padding: '4px 10px', borderRadius: '8px',
            background: 'var(--obsidian-4)', border: '1px solid var(--border)',
            fontSize: '11px', color: 'var(--cream-dim)',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s ease',
          }}>
            <div style={{
              width: '28px', height: '4px', background: 'var(--border)',
              borderRadius: '2px', overflow: 'hidden',
            }}>
              <div
                className={donePct > 0 && donePct < 100 ? 'progress-shimmer' : ''}
                style={{
                  width: `${donePct}%`, height: '100%',
                  background: donePct === 100 ? 'var(--sage)' : donePct > 0 ? undefined : 'transparent',
                  borderRadius: '2px',
                  transition: 'width 0.5s var(--ease-spring)',
                }}
              />
            </div>
            {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
          </div>
          {(dayIncome > 0 || dayExpense > 0) && (
            <div
              className="chip-pop"
              style={{
                padding: '4px 10px', borderRadius: '8px',
                background: balance >= 0 ? 'var(--sage-dim)' : 'var(--coral-dim)',
                border: `1px solid ${balance >= 0 ? 'var(--sage)' : 'var(--coral)'}33`,
                fontSize: '11px',
                color: balance >= 0 ? 'var(--sage)' : 'var(--coral)',
                fontWeight: 600,
              }}
            >
              {balance >= 0 ? '+' : ''}{fmt(balance)}
            </div>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--obsidian-2)',
      }}>
        {[['tasks', 'Tareas'], ['finance', 'Finanzas']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '12px',
              fontWeight: 600,
              color: activeSection === id ? 'var(--amber)' : 'var(--cream-muted)',
              borderBottom: activeSection === id ? '2px solid var(--amber)' : '2px solid transparent',
              transition: 'color 0.2s ease, border-color 0.25s var(--ease-out)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (activeSection !== id) {
                e.currentTarget.style.color = 'var(--cream-dim)';
                e.currentTarget.style.background = 'var(--obsidian-3)';
              }
            }}
            onMouseLeave={e => {
              if (activeSection !== id) {
                e.currentTarget.style.color = 'var(--cream-muted)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {label}
            {id === 'tasks' && dayTasks.filter(t => !t.done).length > 0 && (
              <span style={{
                marginLeft: '6px',
                fontSize: '9px', fontWeight: 700,
                padding: '1px 5px', borderRadius: '10px',
                background: activeSection === id ? 'var(--amber)' : 'var(--obsidian-4)',
                color: activeSection === id ? 'var(--obsidian)' : 'var(--cream-muted)',
                transition: 'all 0.2s ease',
              }}>
                {dayTasks.filter(t => !t.done).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content — keyed on tabKey for re-animation */}
      <div key={tabKey} className="tab-content" style={{ flex: 1, overflow: 'auto', padding: '16px' }}>

        {/* ─── TASKS ─── */}
        {activeSection === 'tasks' && (
          <div>
            {/* Add task button */}
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px',
                border: `1px dashed ${showTaskForm ? 'var(--amber-dim)' : 'var(--border-light)'}`,
                background: showTaskForm ? 'var(--amber-glow)' : 'transparent',
                color: showTaskForm ? 'var(--amber)' : 'var(--cream-muted)',
                fontSize: '12px', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s var(--ease-spring)',
                marginBottom: '12px',
              }}
              onMouseEnter={e => {
                if (!showTaskForm) {
                  e.currentTarget.style.borderColor = 'var(--amber-dim)';
                  e.currentTarget.style.color = 'var(--amber)';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }
              }}
              onMouseLeave={e => {
                if (!showTaskForm) {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.color = 'var(--cream-muted)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <Plus size={13} style={{ transition: 'transform 0.2s var(--ease-spring)' }} />
              Nueva tarea
            </button>

            {showTaskForm && (
              <div className="form-spring" style={{
                background: 'var(--obsidian-3)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
              }}>
                <input
                  autoFocus
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="¿Qué necesitas hacer?"
                  style={inputSt}
                  onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(PRIORITIES).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTaskPriority(key)}
                      style={{
                        padding: '4px 10px', borderRadius: '7px',
                        fontSize: '10px', fontWeight: 600,
                        border: `1px solid ${taskPriority === key ? PRIORITY_COLORS[key] : 'var(--border)'}`,
                        background: taskPriority === key ? `${PRIORITY_COLORS[key]}22` : 'transparent',
                        color: taskPriority === key ? PRIORITY_COLORS[key] : 'var(--cream-muted)',
                        transition: 'all 0.18s var(--ease-spring)',
                        transform: taskPriority === key ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >{label}</button>
                  ))}
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value)}
                    style={{ ...inputSt, padding: '4px 8px', fontSize: '10px', marginBottom: 0 }}
                  >
                    {TASK_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={addTask}
                  style={{
                    width: '100%', marginTop: '10px', padding: '9px',
                    borderRadius: '9px', background: 'var(--amber)',
                    color: 'var(--obsidian)', fontSize: '12px', fontWeight: 700,
                    transition: 'all 0.2s var(--ease-spring)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(240,165,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1.02)'}
                >
                  Agregar tarea
                </button>
              </div>
            )}

            {dayTasks.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px 0',
                color: 'var(--cream-muted)', fontSize: '12px',
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{
                  fontSize: '32px', opacity: 0.2, marginBottom: '8px',
                  fontFamily: 'var(--font-display)',
                  animation: 'float 3s ease-in-out infinite',
                }}>✦</div>
                Sin tareas para este día
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayTasks.filter(t => !t.done).map((task, i) => (
                  <TaskRow key={task.id} task={task} i={i}
                    isDeleting={deletingIds.has(task.id)}
                    onToggle={toggleTask} onDelete={deleteTask} />
                ))}
                {dayTasks.some(t => t.done) && dayTasks.some(t => !t.done) && (
                  <div style={{
                    height: '1px', background: 'var(--border)', margin: '4px 0',
                    animation: 'fadeIn 0.3s ease',
                  }} />
                )}
                {dayTasks.filter(t => t.done).map((task, i) => (
                  <TaskRow key={task.id} task={task} i={i}
                    isDeleting={deletingIds.has(task.id)}
                    onToggle={toggleTask} onDelete={deleteTask} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── FINANCE ─── */}
        {activeSection === 'finance' && (
          <div>
            {/* Balance mini cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {[
                { label: 'Ingresos', value: dayIncome, color: 'var(--sage)', bg: 'var(--sage-dim)', sign: '+', delay: '0.04s' },
                { label: 'Gastos', value: dayExpense, color: 'var(--coral)', bg: 'var(--coral-dim)', sign: '-', delay: '0.08s' },
              ].map(({ label, value, color, bg, sign, delay }) => (
                <div key={label} style={{
                  background: bg, border: `1px solid ${color}33`,
                  borderRadius: '12px', padding: '12px',
                  animation: `fadeUp 0.3s var(--ease-spring) ${delay} both`,
                  transition: 'transform 0.2s var(--ease-spring)',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color, fontWeight: 600, marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 700, color, letterSpacing: '-0.01em' }}>
                    {sign}{fmt(value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Balance total */}
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: balance >= 0 ? 'var(--amber-glow)' : 'var(--coral-dim)',
              border: `1px solid ${balance >= 0 ? 'var(--amber-dim)' : 'var(--coral)'}44`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '14px',
              animation: 'fadeUp 0.3s var(--ease-spring) 0.12s both',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Balance</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700,
                color: balance >= 0 ? 'var(--amber)' : 'var(--coral)',
                letterSpacing: '-0.01em',
                transition: 'color 0.3s ease',
                animation: 'numFlash 0.4s var(--ease-spring)',
              }}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </span>
            </div>

            {/* Add button */}
            <button
              onClick={() => setShowFinForm(!showFinForm)}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px',
                border: `1px dashed ${showFinForm ? 'var(--amber-dim)' : 'var(--border-light)'}`,
                background: showFinForm ? 'var(--amber-glow)' : 'transparent',
                color: showFinForm ? 'var(--amber)' : 'var(--cream-muted)',
                fontSize: '12px', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s var(--ease-spring)',
                marginBottom: '12px',
              }}
              onMouseEnter={e => {
                if (!showFinForm) {
                  e.currentTarget.style.borderColor = 'var(--amber-dim)';
                  e.currentTarget.style.color = 'var(--amber)';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }
              }}
              onMouseLeave={e => {
                if (!showFinForm) {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.color = 'var(--cream-muted)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <Plus size={13} /> Agregar movimiento
            </button>

            {showFinForm && (
              <div className="form-spring" style={{
                background: 'var(--obsidian-3)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px', padding: '14px',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', background: 'var(--obsidian-4)', borderRadius: '9px', padding: '3px', marginBottom: '12px' }}>
                  {[['expense', 'Gasto', 'var(--coral)'], ['income', 'Ingreso', 'var(--sage)']].map(([key, label, color]) => (
                    <button
                      key={key}
                      onClick={() => { setFinType(key); setFinCat(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }}
                      style={{
                        flex: 1, padding: '7px', borderRadius: '7px',
                        fontSize: '11px', fontWeight: 600,
                        background: finType === key ? 'var(--obsidian-2)' : 'transparent',
                        color: finType === key ? color : 'var(--cream-muted)',
                        border: finType === key ? `1px solid ${color}44` : '1px solid transparent',
                        transition: 'all 0.2s var(--ease-spring)',
                        transform: finType === key ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >{label}</button>
                  ))}
                </div>
                <input value={finAmount} onChange={e => setFinAmount(e.target.value)} placeholder="Monto" type="number" style={{ ...inputSt, marginBottom: '8px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
                <select value={finCat} onChange={e => setFinCat(e.target.value)} style={{ ...inputSt, marginBottom: '8px', appearance: 'none' }}>
                  {(finType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={finDesc} onChange={e => setFinDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFinance()} placeholder="Descripción" style={{ ...inputSt, marginBottom: '10px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
                <button
                  onClick={addFinance}
                  style={{
                    width: '100%', padding: '9px', borderRadius: '9px',
                    background: finType === 'income' ? 'var(--sage)' : 'var(--coral)',
                    color: 'var(--obsidian)', fontSize: '12px', fontWeight: 700,
                    transition: 'all 0.2s var(--ease-spring)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = `0 4px 16px ${finType === 'income' ? 'rgba(95,173,142,0.35)' : 'rgba(224,92,92,0.35)'}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1.02)'}
                >
                  {finType === 'income' ? '+ Agregar ingreso' : '- Agregar gasto'}
                </button>
              </div>
            )}

            {/* Transactions */}
            {dayExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--cream-muted)', fontSize: '12px', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ fontSize: '32px', opacity: 0.2, marginBottom: '8px', fontFamily: 'var(--font-display)', animation: 'float 3s ease-in-out infinite' }}>₱</div>
                Sin movimientos para este día
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[...dayExpenses].reverse().map((item, i) => (
                  <div
                    key={item.id}
                    className={deletingIds.has(item.id) ? 'item-out' : ''}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '10px',
                      background: 'var(--obsidian-3)',
                      border: `1px solid ${item.type === 'income' ? 'var(--sage)' : 'var(--coral)'}22`,
                      animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.04}s both`,
                      transition: 'border-color 0.15s, transform 0.2s var(--ease-spring)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = item.type === 'income' ? 'var(--sage)66' : 'var(--coral)66'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = item.type === 'income' ? 'var(--sage)22' : 'var(--coral)22'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                      background: item.type === 'income' ? 'var(--sage-dim)' : 'var(--coral-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.2s var(--ease-spring)',
                    }}>
                      {item.type === 'income'
                        ? <TrendingUp size={14} color="var(--sage)" />
                        : <TrendingDown size={14} color="var(--coral)" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                      <div style={{ fontSize: '10px', color: 'var(--cream-muted)', marginTop: '1px' }}>{item.category}</div>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700,
                      color: item.type === 'income' ? 'var(--sage)' : 'var(--coral)',
                      flexShrink: 0,
                    }}>
                      {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
                    </div>
                    <button
                      onClick={() => deleteExpense(item.id)}
                      style={{
                        width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'transparent', transition: 'all 0.15s var(--ease-spring)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-dim)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'transparent'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                      ref={el => {
                        if (el) {
                          const row = el.closest('[class]');
                          if (row) {
                            row.addEventListener('mouseenter', () => { el.style.color = 'var(--cream-muted)'; });
                            row.addEventListener('mouseleave', () => { if (!el.matches(':hover')) el.style.color = 'transparent'; });
                          }
                        }
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, i, isDeleting, onToggle, onDelete }) {
  const [justToggled, setJustToggled] = useState(false);

  const handleToggle = () => {
    setJustToggled(true);
    onToggle(task.id);
    setTimeout(() => setJustToggled(false), 400);
  };

  return (
    <div
      className={isDeleting ? 'item-out' : ''}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '8px',
        padding: '10px 12px', borderRadius: '10px',
        background: 'var(--obsidian-3)',
        border: `1px solid ${task.done ? 'var(--border)' : PRIORITY_COLORS[task.priority] + '33'}`,
        opacity: task.done ? 0.65 : 1,
        animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.05}s both`,
        transition: 'opacity 0.2s ease, border-color 0.2s ease, transform 0.2s var(--ease-spring)',
      }}
      onMouseEnter={e => { if (!task.done) { e.currentTarget.style.borderColor = PRIORITY_COLORS[task.priority] + '66'; e.currentTarget.style.transform = 'translateX(2px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = task.done ? 'var(--border)' : PRIORITY_COLORS[task.priority] + '33'; e.currentTarget.style.transform = 'translateX(0)'; }}
    >
      <button
        onClick={handleToggle}
        className={justToggled ? 'check-done' : ''}
        style={{
          width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
          border: `2px solid ${task.done ? 'var(--sage)' : PRIORITY_COLORS[task.priority]}`,
          background: task.done ? 'var(--sage)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.15s var(--ease-spring)',
          marginTop: '1px',
        }}
        onMouseEnter={e => { if (!task.done) e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={e => { if (!justToggled) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {task.done && <Check size={11} color="var(--obsidian)" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          color: task.done ? 'var(--cream-muted)' : 'var(--cream)',
          textDecoration: task.done ? 'line-through' : 'none',
          lineHeight: 1.4,
          transition: 'color 0.2s ease',
        }}>
          {task.text}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
          <span style={{
            fontSize: '9px', fontWeight: 700,
            padding: '1px 6px', borderRadius: '5px',
            background: `${PRIORITY_COLORS[task.priority]}22`,
            color: PRIORITY_COLORS[task.priority],
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease',
          }}>
            {PRIORITIES[task.priority].toUpperCase()}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--cream-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Tag size={9} /> {task.category}
          </span>
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        style={{
          width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'transparent', transition: 'all 0.15s var(--ease-spring)',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-dim)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'transparent'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
        ref={el => {
          if (el) {
            const row = el.closest('[style]');
            if (row) {
              row.addEventListener('mouseenter', () => { el.style.color = 'var(--cream-muted)'; });
              row.addEventListener('mouseleave', () => { if (!el.matches(':hover')) el.style.color = 'transparent'; });
            }
          }
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

const inputSt = {
  width: '100%',
  background: 'var(--obsidian-4)',
  border: '1px solid var(--border-light)',
  borderRadius: '9px',
  padding: '9px 12px',
  fontSize: '12px',
  color: 'var(--cream)',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  marginBottom: 0,
  display: 'block',
};
