import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Pencil, TrendingUp, TrendingDown, Tag } from 'lucide-react';

const PRIORITY_COLORS = { high: '#E05C5C', medium: '#F0A500', low: '#5FAD8E' };
const PRIORITIES      = { high: 'Alta', medium: 'Media', low: 'Baja' };
const TASK_CATS       = ['Personal', 'Trabajo', 'Salud', 'Finanzas', 'Otro'];
const EXPENSE_CATS    = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Hogar', 'Ropa', 'Tecnología', 'Otro'];
const INCOME_CATS     = ['Salario', 'Freelance', 'Inversión', 'Regalo', 'Otro'];

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

const inputSt = {
  width: '100%',
  background: 'var(--obsidian-4)',
  border: '1px solid var(--border-light)',
  borderRadius: '9px',
  padding: '9px 12px',
  fontSize: '12px',
  color: 'var(--cream)',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  marginBottom: 0,
  display: 'block',
};

export default function DayView({
  date, tasks, expenses,
  onAddTask, onToggleTask, onDeleteTask, onEditTask,
  onAddExpense, onDeleteExpense, onEditExpense,
  onPrevDay, onNextDay,
}) {
  const dayTasks    = tasks.filter(t => isSameDay(new Date(t.date), date));
  const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
  const dayIncome   = dayExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const dayExpense  = dayExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance     = dayIncome - dayExpense;
  const donePct     = dayTasks.length
    ? Math.round(dayTasks.filter(t => t.done).length / dayTasks.length * 100)
    : 0;

  // Task form state
  const [newTask, setNewTask]         = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Finance form state
  const [finType, setFinType]   = useState('expense');
  const [finAmount, setFinAmount] = useState('');
  const [finDesc, setFinDesc]   = useState('');
  const [finCat, setFinCat]     = useState(EXPENSE_CATS[0]);
  const [showFinForm, setShowFinForm] = useState(false);

  // Deleting animation
  const [deletingIds, setDeletingIds] = useState(new Set());

  const addTask = async () => {
    if (!newTask.trim()) return;
    await onAddTask({
      text: newTask.trim(), done: false,
      priority: taskPriority, category: taskCategory,
      date: format(date, 'yyyy-MM-dd'),
    });
    setNewTask(''); setShowTaskForm(false);
  };

  const deleteItem = (id, onDelete) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      onDelete(id);
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const addFinance = async () => {
    const n = parseFloat(finAmount);
    if (!n || !finDesc.trim()) return;
    await onAddExpense({
      type: finType, amount: n, desc: finDesc.trim(),
      category: finCat, date: format(date, 'yyyy-MM-dd'),
    });
    setFinAmount(''); setFinDesc(''); setShowFinForm(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Day header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--obsidian-2)', flexShrink: 0,
        animation: 'fadeDown 0.3s var(--ease-out) both',
      }}>
        <NavArrow onClick={onPrevDay} dir="left" />

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700,
            color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {format(date, "d 'de' MMMM", { locale: es })}
          </div>
          <div style={{
            fontSize: '10px', color: 'var(--cream-muted)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px',
          }}>
            {format(date, 'EEEE · yyyy', { locale: es })}
          </div>

          {/* Summary pills */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
            <div style={{
              padding: '3px 10px', borderRadius: '8px',
              background: 'var(--obsidian-4)', border: '1px solid var(--border)',
              fontSize: '11px', color: 'var(--cream-dim)',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}>
              <div style={{ width: '28px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${donePct}%`, height: '100%', borderRadius: '2px',
                  background: donePct === 100 ? 'var(--sage)' : 'var(--amber)',
                  transition: 'width 0.5s var(--ease-spring)',
                }} />
              </div>
              {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
            </div>
            {(dayIncome > 0 || dayExpense > 0) && (
              <div style={{
                padding: '3px 10px', borderRadius: '8px',
                background: balance >= 0 ? 'var(--sage-dim)' : 'var(--coral-dim)',
                border: `1px solid ${balance >= 0 ? 'var(--sage)' : 'var(--coral)'}33`,
                fontSize: '11px', fontWeight: 600,
                color: balance >= 0 ? 'var(--sage)' : 'var(--coral)',
              }}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </div>
            )}
          </div>
        </div>

        <NavArrow onClick={onNextDay} dir="right" />
      </div>

      {/* Two-column content */}
      <div style={{
        flex: 1, overflow: 'auto',
        display: 'flex', justifyContent: 'center',
        padding: '32px 24px', gap: '24px',
      }}>
        {/* Tasks column */}
        <div style={{ flex: 1, maxWidth: '420px' }}>
          <SectionTitle>Tareas</SectionTitle>

          {/* Add task button */}
          <AddBtn active={showTaskForm} onClick={() => setShowTaskForm(!showTaskForm)} label="Nueva tarea" />

          {showTaskForm && (
            <div className="form-spring" style={{ ...cardSt, marginBottom: '12px' }}>
              <input
                autoFocus value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="¿Qué necesitas hacer?"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {Object.entries(PRIORITIES).map(([key, label]) => (
                  <button key={key} onClick={() => setTaskPriority(key)} style={{
                    padding: '4px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: 600,
                    border: `1px solid ${taskPriority === key ? PRIORITY_COLORS[key] : 'var(--border)'}`,
                    background: taskPriority === key ? `${PRIORITY_COLORS[key]}22` : 'transparent',
                    color: taskPriority === key ? PRIORITY_COLORS[key] : 'var(--cream-muted)',
                    transition: 'all 0.18s var(--ease-spring)',
                  }}>{label}</button>
                ))}
                <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)}
                  style={{ ...inputSt, padding: '4px 8px', fontSize: '10px', marginBottom: 0 }}>
                  {TASK_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={addTask} style={{
                width: '100%', marginTop: '10px', padding: '9px', borderRadius: '9px',
                background: 'var(--amber)', color: 'var(--obsidian)', fontSize: '12px', fontWeight: 700,
                transition: 'all 0.2s var(--ease-spring)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(240,165,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Agregar tarea
              </button>
            </div>
          )}

          {dayTasks.length === 0 ? (
            <Empty icon="✦" text="Sin tareas para este día" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dayTasks.filter(t => !t.done).map((task, i) => (
                <DayTaskRow key={task.id} task={task} i={i}
                  isDeleting={deletingIds.has(task.id)}
                  onToggle={id => onToggleTask(id)}
                  onDelete={id => deleteItem(id, onDeleteTask)}
                  onEdit={onEditTask} />
              ))}
              {dayTasks.some(t => t.done) && dayTasks.some(t => !t.done) && (
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              )}
              {dayTasks.filter(t => t.done).map((task, i) => (
                <DayTaskRow key={task.id} task={task} i={i}
                  isDeleting={deletingIds.has(task.id)}
                  onToggle={id => onToggleTask(id)}
                  onDelete={id => deleteItem(id, onDeleteTask)}
                  onEdit={onEditTask} />
              ))}
            </div>
          )}
        </div>

        {/* Finance column */}
        <div style={{ flex: 1, maxWidth: '420px' }}>
          <SectionTitle>Finanzas</SectionTitle>

          <AddBtn active={showFinForm} onClick={() => setShowFinForm(!showFinForm)} label="Agregar movimiento" />

          {/* Balance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'Ingresos', value: dayIncome, color: 'var(--sage)', bg: 'var(--sage-dim)', sign: '+' },
              { label: 'Gastos',   value: dayExpense, color: 'var(--coral)', bg: 'var(--coral-dim)', sign: '-' },
            ].map(({ label, value, color, bg, sign }) => (
              <div key={label} style={{
                background: bg, border: `1px solid ${color}33`,
                borderRadius: '12px', padding: '12px',
              }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color, fontWeight: 600, marginBottom: '6px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 700, color, letterSpacing: '-0.01em' }}>
                  {sign}{fmt(value)}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            padding: '10px 14px', borderRadius: '10px',
            background: balance >= 0 ? 'var(--amber-glow)' : 'var(--coral-dim)',
            border: `1px solid ${balance >= 0 ? 'var(--amber-dim)' : 'var(--coral)'}44`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '14px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Balance</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: balance >= 0 ? 'var(--amber)' : 'var(--coral)', letterSpacing: '-0.01em' }}>
              {balance >= 0 ? '+' : ''}{fmt(balance)}
            </span>
          </div>

          {showFinForm && (
            <div className="form-spring" style={{ ...cardSt, marginBottom: '12px' }}>
              <div style={{ display: 'flex', background: 'var(--obsidian-4)', borderRadius: '9px', padding: '3px', marginBottom: '12px' }}>
                {[['expense', 'Gasto', 'var(--coral)'], ['income', 'Ingreso', 'var(--sage)']].map(([key, label, color]) => (
                  <button key={key}
                    onClick={() => { setFinType(key); setFinCat(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }}
                    style={{
                      flex: 1, padding: '7px', borderRadius: '7px', fontSize: '11px', fontWeight: 600,
                      background: finType === key ? 'var(--obsidian-2)' : 'transparent',
                      color: finType === key ? color : 'var(--cream-muted)',
                      border: finType === key ? `1px solid ${color}44` : '1px solid transparent',
                      transition: 'all 0.2s var(--ease-spring)',
                    }}
                  >{label}</button>
                ))}
              </div>
              <input value={finAmount} onChange={e => setFinAmount(e.target.value)} placeholder="Monto" type="number"
                style={{ ...inputSt, marginBottom: '8px' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
              <select value={finCat} onChange={e => setFinCat(e.target.value)}
                style={{ ...inputSt, marginBottom: '8px', appearance: 'none' }}>
                {(finType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={finDesc} onChange={e => setFinDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFinance()}
                placeholder="Descripción" style={{ ...inputSt, marginBottom: '10px' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
              <button onClick={addFinance} style={{
                width: '100%', padding: '9px', borderRadius: '9px',
                background: finType === 'income' ? 'var(--sage)' : 'var(--coral)',
                color: 'var(--obsidian)', fontSize: '12px', fontWeight: 700,
                transition: 'all 0.2s var(--ease-spring)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {finType === 'income' ? '+ Agregar ingreso' : '- Agregar gasto'}
              </button>
            </div>
          )}

          {dayExpenses.length === 0 ? (
            <Empty icon="₱" text="Sin movimientos para este día" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[...dayExpenses].reverse().map((item, i) => (
                <DayExpenseRow key={item.id} item={item} i={i}
                  isDeleting={deletingIds.has(item.id)}
                  onDelete={id => deleteItem(id, onDeleteExpense)}
                  onEdit={onEditExpense} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: 'var(--cream-muted)',
      marginBottom: '12px', paddingBottom: '8px',
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  );
}

function AddBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '10px', borderRadius: '10px', marginBottom: '12px',
      border: `1px dashed ${active ? 'var(--amber-dim)' : 'var(--border-light)'}`,
      background: active ? 'var(--amber-glow)' : 'transparent',
      color: active ? 'var(--amber)' : 'var(--cream-muted)',
      fontSize: '12px', fontWeight: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      transition: 'all 0.2s var(--ease-spring)',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--amber-dim)'; e.currentTarget.style.color = 'var(--amber)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--cream-muted)'; } }}
    >
      <Plus size={13} /> {label}
    </button>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--cream-muted)', fontSize: '12px' }}>
      <div style={{ fontSize: '32px', opacity: 0.2, marginBottom: '8px', fontFamily: 'var(--font-display)', animation: 'float 3s ease-in-out infinite' }}>{icon}</div>
      {text}
    </div>
  );
}

function NavArrow({ onClick, dir }) {
  return (
    <button onClick={onClick} style={{
      width: '36px', height: '36px', borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--cream-muted)', transition: 'all 0.2s var(--ease-spring)',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--obsidian-3)'; e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {dir === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}

function IconBtn({ icon: Icon, color, hoverBg, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--cream-muted)', transition: 'all 0.15s var(--ease-spring)',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <Icon size={12} />
    </button>
  );
}

function DayTaskRow({ task, i, isDeleting, onToggle, onDelete, onEdit }) {
  const [justToggled, setJustToggled]     = useState(false);
  const [isEditing, setIsEditing]         = useState(false);
  const [editText, setEditText]           = useState(task.text);
  const [editPriority, setEditPriority]   = useState(task.priority);
  const [editCategory, setEditCategory]   = useState(task.category);

  const handleToggle = () => {
    setJustToggled(true);
    onToggle(task.id);
    setTimeout(() => setJustToggled(false), 400);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    onEdit(task.id, { text: editText.trim(), priority: editPriority, category: editCategory });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditText(task.text); setEditPriority(task.priority); setEditCategory(task.category);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="form-spring" style={{ ...cardSt, animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.05}s both` }}>
        <input autoFocus value={editText} onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          style={{ ...inputSt, marginBottom: '8px' }}
          onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {Object.entries(PRIORITIES).map(([key, label]) => (
            <button key={key} onClick={() => setEditPriority(key)} style={{
              padding: '3px 9px', borderRadius: '7px', fontSize: '10px', fontWeight: 600,
              border: `1px solid ${editPriority === key ? PRIORITY_COLORS[key] : 'var(--border)'}`,
              background: editPriority === key ? `${PRIORITY_COLORS[key]}22` : 'transparent',
              color: editPriority === key ? PRIORITY_COLORS[key] : 'var(--cream-muted)',
              transition: 'all 0.18s var(--ease-spring)',
            }}>{label}</button>
          ))}
          <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
            style={{ ...inputSt, padding: '3px 8px', fontSize: '10px', marginBottom: 0 }}>
            {TASK_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={saveEdit} style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'var(--amber)', color: 'var(--obsidian)', fontSize: '11px', fontWeight: 700 }}>Guardar</button>
          <button onClick={cancelEdit} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--cream-muted)', fontSize: '11px' }}>Cancelar</button>
        </div>
      </div>
    );
  }

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
      <button onClick={handleToggle}
        className={justToggled ? 'check-done' : ''}
        style={{
          width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
          border: `2px solid ${task.done ? 'var(--sage)' : PRIORITY_COLORS[task.priority]}`,
          background: task.done ? 'var(--sage)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.15s var(--ease-spring)',
        }}
        onMouseEnter={e => { if (!task.done) e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={e => { if (!justToggled) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {task.done && <Check size={11} color="var(--obsidian)" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', lineHeight: 1.4, color: task.done ? 'var(--cream-muted)' : 'var(--cream)', textDecoration: task.done ? 'line-through' : 'none', transition: 'color 0.2s ease' }}>
          {task.text}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px', background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority], letterSpacing: '0.05em' }}>
            {PRIORITIES[task.priority].toUpperCase()}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--cream-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Tag size={9} /> {task.category}
          </span>
        </div>
      </div>
      <IconBtn icon={Pencil} color="var(--amber)" hoverBg="var(--amber-glow)" onClick={() => setIsEditing(true)} />
      <IconBtn icon={Trash2} color="var(--coral)" hoverBg="var(--coral-dim)" onClick={() => onDelete(task.id)} />
    </div>
  );
}

function DayExpenseRow({ item, i, isDeleting, onDelete, onEdit }) {
  const [isEditing, setIsEditing]   = useState(false);
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [editDesc, setEditDesc]     = useState(item.desc);
  const [editCat, setEditCat]       = useState(item.category);
  const [editType, setEditType]     = useState(item.type);

  const color = item.type === 'income' ? 'var(--sage)' : 'var(--coral)';

  const saveEdit = () => {
    const n = parseFloat(editAmount);
    if (!n || !editDesc.trim()) return;
    onEdit(item.id, { type: editType, amount: n, desc: editDesc.trim(), category: editCat });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditAmount(String(item.amount)); setEditDesc(item.desc);
    setEditCat(item.category); setEditType(item.type);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="form-spring" style={{ ...cardSt, border: `1px solid ${color}44`, animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.04}s both` }}>
        <div style={{ display: 'flex', background: 'var(--obsidian-4)', borderRadius: '9px', padding: '3px', marginBottom: '10px' }}>
          {[['expense', 'Gasto', 'var(--coral)'], ['income', 'Ingreso', 'var(--sage)']].map(([key, label, c]) => (
            <button key={key} onClick={() => { setEditType(key); setEditCat(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }} style={{
              flex: 1, padding: '6px', borderRadius: '7px', fontSize: '11px', fontWeight: 600,
              background: editType === key ? 'var(--obsidian-2)' : 'transparent',
              color: editType === key ? c : 'var(--cream-muted)',
              border: editType === key ? `1px solid ${c}44` : '1px solid transparent',
              transition: 'all 0.2s var(--ease-spring)',
            }}>{label}</button>
          ))}
        </div>
        <input value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="Monto" type="number"
          style={{ ...inputSt, marginBottom: '8px' }}
          onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
        <select value={editCat} onChange={e => setEditCat(e.target.value)}
          style={{ ...inputSt, marginBottom: '8px', appearance: 'none' }}>
          {(editType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          placeholder="Descripción" style={{ ...inputSt, marginBottom: '10px' }}
          onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={saveEdit} style={{ flex: 1, padding: '7px', borderRadius: '8px', background: editType === 'income' ? 'var(--sage)' : 'var(--coral)', color: 'var(--obsidian)', fontSize: '11px', fontWeight: 700 }}>Guardar</button>
          <button onClick={cancelEdit} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--cream-muted)', fontSize: '11px' }}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={isDeleting ? 'item-out' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', borderRadius: '10px',
        background: 'var(--obsidian-3)',
        border: `1px solid ${color}22`,
        animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.04}s both`,
        transition: 'border-color 0.15s, transform 0.2s var(--ease-spring)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}66`; e.currentTarget.style.transform = 'translateX(2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.transform = 'translateX(0)'; }}
    >
      <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: item.type === 'income' ? 'var(--sage-dim)' : 'var(--coral-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.type === 'income' ? <TrendingUp size={14} color="var(--sage)" /> : <TrendingDown size={14} color="var(--coral)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
        <div style={{ fontSize: '10px', color: 'var(--cream-muted)', marginTop: '1px' }}>{item.category}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color, flexShrink: 0 }}>
        {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
      </div>
      <IconBtn icon={Pencil} color="var(--amber)" hoverBg="var(--amber-glow)" onClick={() => setIsEditing(true)} />
      <IconBtn icon={Trash2} color="var(--coral)" hoverBg="var(--coral-dim)" onClick={() => onDelete(item.id)} />
    </div>
  );
}

const cardSt = {
  background: 'var(--obsidian-3)',
  border: '1px solid var(--border-light)',
  borderRadius: '12px',
  padding: '14px',
};
