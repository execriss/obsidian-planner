import { useState } from 'react';
import {
  X, Plus, Check, Trash2, TrendingUp, TrendingDown, Tag, Pencil,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './DayPanel.module.css';

const PRIORITY_COLORS = { high: '#E05C5C', medium: '#F0A500', low: '#5FAD8E' };
const PRIORITIES = { high: 'Alta', medium: 'Media', low: 'Baja' };
const TASK_CATS = ['Personal', 'Trabajo', 'Salud', 'Finanzas', 'Otro'];
const EXPENSE_CATS = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Hogar', 'Ropa', 'Tecnología', 'Otro'];
const INCOME_CATS = ['Salario', 'Freelance', 'Inversión', 'Regalo', 'Otro'];

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);

export default function DayPanel({ date, tasks, expenses, onAddTask, onToggleTask, onDeleteTask, onEditTask, onAddExpense, onDeleteExpense, onEditExpense, onClose, isModal }) {
  const [activeSection, setActiveSection] = useState('tasks');
  const [tabKey, setTabKey] = useState(0);

  const [newTask, setNewTask]           = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [finType, setFinType]       = useState('expense');
  const [finAmount, setFinAmount]   = useState('');
  const [finDesc, setFinDesc]       = useState('');
  const [finCat, setFinCat]         = useState(EXPENSE_CATS[0]);
  const [showFinForm, setShowFinForm] = useState(false);

  const [deletingIds, setDeletingIds] = useState(new Set());

  const dayTasks    = tasks.filter(t => isSameDay(new Date(t.date), date));
  const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
  const dayIncome   = dayExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const dayExpense  = dayExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance     = dayIncome - dayExpense;
  const donePct     = dayTasks.length
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

  const finColor = finType === 'income' ? 'var(--sage)' : 'var(--coral)';

  return (
    <div className={isModal ? styles.panelModal : styles.panelDesktop}>

      {/* Header — desktop only */}
      {!isModal && (
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.dateTitle}>
                {format(date, "d 'de' MMMM", { locale: es })}
              </div>
              <div className={styles.dateSubtitle}>
                {format(date, 'EEEE · yyyy', { locale: es })}
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={15} />
            </button>
          </div>

          {/* Summary pills */}
          <div className={styles.pillsRow}>
            <div className={styles.taskPill}>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill}${donePct > 0 && donePct < 100 ? ' progress-shimmer' : ''}`}
                  style={{
                    width: `${donePct}%`,
                    background: donePct === 100 ? 'var(--sage)' : donePct > 0 ? undefined : 'transparent',
                  }}
                />
              </div>
              {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
            </div>
            {(dayIncome > 0 || dayExpense > 0) && (
              <div className={`chip-pop ${balance >= 0 ? styles.balancePillPositive : styles.balancePillNegative}`}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary pills — modal mode */}
      {isModal && (
        <div className={styles.pillsRowModal}>
          <div className={styles.taskPill}>
            {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
          </div>
          {(dayIncome > 0 || dayExpense > 0) && (
            <div className={balance >= 0 ? styles.balancePillPositive : styles.balancePillNegative}>
              {balance >= 0 ? '+' : ''}{fmt(balance)}
            </div>
          )}
        </div>
      )}

      {/* Section tabs */}
      <div className={styles.tabBar}>
        {/* ['finance', 'Finanzas'] tab oculto — sección Reporte en desuso */}
        {[['tasks', 'Tareas']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={activeSection === id ? styles.tabBtnActive : styles.tabBtn}
          >
            {label}
            {id === 'tasks' && dayTasks.filter(t => !t.done).length > 0 && (
              <span className={activeSection === id ? styles.tabBadgeActive : styles.tabBadge}>
                {dayTasks.filter(t => !t.done).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={tabKey} className={`tab-content ${styles.tabContent}`}>

        {/* ─── TASKS ─── */}
        {activeSection === 'tasks' && (
          <div>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className={showTaskForm ? styles.addBtnActive : styles.addBtn}
            >
              <Plus size={13} />
              Nueva tarea
            </button>

            {showTaskForm && (
              <div className={`form-spring ${styles.formCard}`}>
                <input
                  autoFocus
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="¿Qué necesitas hacer?"
                  className={styles.inputSpaced}
                />
                <div className={styles.priorityRow}>
                  {Object.entries(PRIORITIES).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTaskPriority(key)}
                      className={taskPriority === key ? styles.priorityBtnActive : styles.priorityBtn}
                      style={taskPriority === key ? { '--accent': PRIORITY_COLORS[key], '--accent-dim': `${PRIORITY_COLORS[key]}22` } : {}}
                    >
                      {label}
                    </button>
                  ))}
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value)}
                    className={styles.selectSmall}
                  >
                    {TASK_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={addTask} className={styles.submitBtn}>
                  Agregar tarea
                </button>
              </div>
            )}

            {dayTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✦</div>
                Sin tareas para este día
              </div>
            ) : (
              <div className={styles.taskList}>
                {dayTasks.filter(t => !t.done).map((task, i) => (
                  <TaskRow key={task.id} task={task} i={i}
                    isDeleting={deletingIds.has(task.id)}
                    onToggle={toggleTask} onDelete={deleteTask} onEdit={onEditTask} />
                ))}
                {dayTasks.some(t => t.done) && dayTasks.some(t => !t.done) && (
                  <div className={styles.separator} />
                )}
                {dayTasks.filter(t => t.done).map((task, i) => (
                  <TaskRow key={task.id} task={task} i={i}
                    isDeleting={deletingIds.has(task.id)}
                    onToggle={toggleTask} onDelete={deleteTask} onEdit={onEditTask} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── FINANCE ─── */}
        {activeSection === 'finance' && (
          <div>
            {/* Balance mini cards */}
            <div className={styles.balanceGrid}>
              {[
                { label: 'Ingresos', value: dayIncome,  color: 'var(--sage)',  bg: 'var(--sage-dim)',  border: 'rgba(95,173,142,0.3)',  sign: '+', delay: '0.04s' },
                { label: 'Gastos',   value: dayExpense, color: 'var(--coral)', bg: 'var(--coral-dim)', border: 'rgba(224,92,92,0.3)',   sign: '-', delay: '0.08s' },
              ].map(({ label, value, color, bg, border, sign, delay }) => (
                <div
                  key={label}
                  className={styles.balanceCard}
                  style={{
                    '--accent': color,
                    '--accent-bg': bg,
                    '--accent-border': border,
                    animationDelay: delay,
                    animationName: 'fadeUp',
                    animationDuration: '0.3s',
                    animationTimingFunction: 'var(--ease-spring)',
                    animationFillMode: 'both',
                  }}
                >
                  <div className={styles.balanceCardLabel}>{label}</div>
                  <div className={styles.balanceCardValue}>{sign}{fmt(value)}</div>
                </div>
              ))}
            </div>

            {/* Balance total */}
            <div
              className={styles.balanceTotal}
              style={{
                '--accent':        balance >= 0 ? 'var(--amber)' : 'var(--coral)',
                '--accent-bg':     balance >= 0 ? 'var(--amber-glow)' : 'var(--coral-dim)',
                '--accent-border': balance >= 0 ? 'rgba(240,165,0,0.4)' : 'rgba(224,92,92,0.4)',
              }}
            >
              <span className={styles.balanceTotalLabel}>Balance</span>
              <span className={styles.balanceTotalValue}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </span>
            </div>

            {/* Add button */}
            <button
              onClick={() => setShowFinForm(!showFinForm)}
              className={showFinForm ? styles.addBtnActive : styles.addBtn}
            >
              <Plus size={13} /> Agregar movimiento
            </button>

            {showFinForm && (
              <div className={`form-spring ${styles.formCard}`}>
                <div className={styles.finTypeRow}>
                  {[
                    ['expense', 'Gasto',   'var(--coral)', 'rgba(224,92,92,0.4)'],
                    ['income',  'Ingreso', 'var(--sage)',  'rgba(95,173,142,0.4)'],
                  ].map(([key, label, color, borderColor]) => (
                    <button
                      key={key}
                      onClick={() => { setFinType(key); setFinCat(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }}
                      className={finType === key ? styles.finTypeBtnActive : styles.finTypeBtn}
                      style={finType === key ? { '--accent': color, '--accent-border': borderColor } : {}}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  value={finAmount}
                  onChange={e => setFinAmount(e.target.value)}
                  placeholder="Monto"
                  type="number"
                  className={styles.inputSpaced}
                />
                <select
                  value={finCat}
                  onChange={e => setFinCat(e.target.value)}
                  className={styles.selectSpaced}
                >
                  {(finType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  value={finDesc}
                  onChange={e => setFinDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addFinance()}
                  placeholder="Descripción"
                  className={styles.inputSpacedLg}
                />
                <button
                  onClick={addFinance}
                  className={styles.finSubmitBtn}
                  style={{ '--accent': finColor }}
                >
                  {finType === 'income' ? '+ Agregar ingreso' : '- Agregar gasto'}
                </button>
              </div>
            )}

            {/* Transactions */}
            {dayExpenses.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>₱</div>
                Sin movimientos para este día
              </div>
            ) : (
              <div className={styles.taskList}>
                {[...dayExpenses].reverse().map((item, i) => (
                  <ExpenseRow key={item.id} item={item} i={i}
                    isDeleting={deletingIds.has(item.id)}
                    onDelete={deleteExpense} onEdit={onEditExpense} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task, i, isDeleting, onToggle, onDelete, onEdit }) {
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
    setEditText(task.text);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setIsEditing(false);
  };

  const priorityColor = PRIORITY_COLORS[task.priority];

  if (isEditing) {
    return (
      <div
        className={`form-spring ${styles.editFormCard}`}
        style={{
          '--accent-border': 'rgba(240,165,0,0.4)',
          animationDelay: `${i * 0.05}s`,
          animationName: 'fadeUp',
          animationDuration: '0.25s',
          animationTimingFunction: 'var(--ease-spring)',
          animationFillMode: 'both',
        }}
      >
        <input
          autoFocus
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          className={styles.inputSpaced}
        />
        <div className={styles.editPriorityRow}>
          {Object.entries(PRIORITIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setEditPriority(key)}
              className={editPriority === key ? styles.priorityBtnActive : styles.editPriorityBtn}
              style={editPriority === key ? { '--accent': PRIORITY_COLORS[key], '--accent-dim': `${PRIORITY_COLORS[key]}22` } : {}}
            >
              {label}
            </button>
          ))}
          <select
            value={editCategory}
            onChange={e => setEditCategory(e.target.value)}
            className={styles.editSelectSmall}
          >
            {TASK_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.editActions}>
          <button onClick={saveEdit} className={styles.saveBtn}>Guardar</button>
          <button onClick={cancelEdit} className={styles.cancelBtn}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${task.done ? styles.taskRowDone : styles.taskRow} ${isDeleting ? 'item-out' : ''}`}
      style={{
        '--accent':        priorityColor,
        '--accent-border': task.done ? 'var(--border)' : `${priorityColor}33`,
        '--accent-hover':  task.done ? 'var(--border)' : `${priorityColor}66`,
        animationDelay:    `${i * 0.05}s`,
        animationName:     'fadeUp',
        animationDuration: '0.25s',
        animationTimingFunction: 'var(--ease-spring)',
        animationFillMode: 'both',
      }}
    >
      <button
        onClick={handleToggle}
        className={`${task.done ? styles.checkboxDone : styles.checkbox} ${justToggled ? 'check-done' : ''}`}
        style={{ '--accent': task.done ? 'var(--sage)' : priorityColor }}
      >
        {task.done && <Check size={11} color="var(--obsidian)" strokeWidth={3} />}
      </button>
      <div className={styles.taskContent}>
        <div className={task.done ? styles.taskTextDone : styles.taskText}>
          {task.text}
        </div>
        <div className={styles.taskMeta}>
          <span
            className={styles.priorityBadge}
            style={{ '--accent': priorityColor, '--accent-dim': `${priorityColor}22` }}
          >
            {PRIORITIES[task.priority].toUpperCase()}
          </span>
          <span className={styles.categoryLabel}>
            <Tag size={9} /> {task.category}
          </span>
        </div>
      </div>
      <IconBtn icon={Pencil} color="var(--amber)" hoverBg="var(--amber-glow)" onClick={() => setIsEditing(true)} />
      <IconBtn icon={Trash2} color="var(--coral)" hoverBg="var(--coral-dim)" onClick={() => onDelete(task.id)} />
    </div>
  );
}

// ─── ExpenseRow ───────────────────────────────────────────────────────────────

function ExpenseRow({ item, i, isDeleting, onDelete, onEdit }) {
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
    setEditAmount(String(item.amount));
    setEditDesc(item.desc);
    setEditCat(item.category);
    setEditType(item.type);
    setIsEditing(false);
  };

  if (isEditing) {
    const editColor = editType === 'income' ? 'var(--sage)' : 'var(--coral)';
    return (
      <div
        className={`form-spring ${styles.editFormCard}`}
        style={{
          '--accent-border': item.type === 'income' ? 'rgba(95,173,142,0.4)' : 'rgba(224,92,92,0.4)',
          animationDelay: `${i * 0.04}s`,
          animationName: 'fadeUp',
          animationDuration: '0.25s',
          animationTimingFunction: 'var(--ease-spring)',
          animationFillMode: 'both',
        }}
      >
        <div className={styles.editFinTypeRow}>
          {[
            ['expense', 'Gasto',   'var(--coral)', 'rgba(224,92,92,0.4)'],
            ['income',  'Ingreso', 'var(--sage)',  'rgba(95,173,142,0.4)'],
          ].map(([key, label, c, borderColor]) => (
            <button
              key={key}
              onClick={() => { setEditType(key); setEditCat(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }}
              className={editType === key ? styles.editFinTypeBtnActive : styles.editFinTypeBtn}
              style={editType === key ? { '--accent': c, '--accent-border': borderColor } : {}}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={editAmount}
          onChange={e => setEditAmount(e.target.value)}
          placeholder="Monto"
          type="number"
          className={styles.inputSpaced}
        />
        <select
          value={editCat}
          onChange={e => setEditCat(e.target.value)}
          className={styles.selectSpaced}
        >
          {(editType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          placeholder="Descripción"
          className={styles.inputSpacedLg}
        />
        <div className={styles.editActions}>
          <button onClick={saveEdit} className={styles.saveBtn} style={{ '--accent': editColor }}>Guardar</button>
          <button onClick={cancelEdit} className={styles.cancelBtn}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.expenseRow} ${isDeleting ? 'item-out' : ''}`}
      style={{
        '--accent':        color,
        '--accent-bg':     item.type === 'income' ? 'var(--sage-dim)' : 'var(--coral-dim)',
        '--accent-border': item.type === 'income' ? 'rgba(95,173,142,0.15)' : 'rgba(224,92,92,0.15)',
        '--accent-hover':  item.type === 'income' ? 'rgba(95,173,142,0.5)' : 'rgba(224,92,92,0.5)',
        animationDelay:    `${i * 0.04}s`,
        animationName:     'fadeUp',
        animationDuration: '0.25s',
        animationTimingFunction: 'var(--ease-spring)',
        animationFillMode: 'both',
      }}
    >
      <div className={styles.expenseIcon}>
        {item.type === 'income'
          ? <TrendingUp size={14} color="var(--sage)" />
          : <TrendingDown size={14} color="var(--coral)" />
        }
      </div>
      <div className={styles.expenseContent}>
        <div className={styles.expenseDesc}>{item.desc}</div>
        <div className={styles.expenseCategory}>{item.category}</div>
      </div>
      <div className={styles.expenseAmount}>
        {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
      </div>
      <IconBtn icon={Pencil} color="var(--amber)" hoverBg="var(--amber-glow)" onClick={() => setIsEditing(true)} />
      <IconBtn icon={Trash2} color="var(--coral)" hoverBg="var(--coral-dim)" onClick={() => onDelete(item.id)} />
    </div>
  );
}

// ─── IconBtn ──────────────────────────────────────────────────────────────────

function IconBtn({ icon: Icon, color, hoverBg, onClick }) {
  return (
    <button
      onClick={onClick}
      className={styles.iconBtn}
      style={{ '--accent': color, '--accent-bg': hoverBg }}
    >
      <Icon size={12} />
    </button>
  );
}
