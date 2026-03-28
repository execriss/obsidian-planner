import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Pencil, TrendingUp, TrendingDown, Tag } from 'lucide-react';
import s from './DayView.module.css';

const PRIORITY_COLORS = { high: '#E05C5C', medium: '#F0A500', low: '#5FAD8E' };
const PRIORITIES      = { high: 'Alta', medium: 'Media', low: 'Baja' };
const TASK_CATS       = ['Personal', 'Trabajo', 'Salud', 'Finanzas', 'Otro'];
const EXPENSE_CATS    = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Hogar', 'Ropa', 'Tecnología', 'Otro'];
const INCOME_CATS     = ['Salario', 'Freelance', 'Inversión', 'Regalo', 'Otro'];

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

export default function DayView({
  date, tasks, expenses,
  onAddTask, onToggleTask, onDeleteTask, onEditTask,
  onAddExpense, onDeleteExpense, onEditExpense,
  onPrevDay, onNextDay,
  isMobile,
}) {
  const dayTasks    = tasks.filter(t => isSameDay(new Date(t.date), date));
  const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
  const dayIncome   = dayExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const dayExpense  = dayExpenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance     = dayIncome - dayExpense;
  const donePct     = dayTasks.length
    ? Math.round(dayTasks.filter(t => t.done).length / dayTasks.length * 100)
    : 0;

  const [newTask, setNewTask]         = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [finType, setFinType]   = useState('expense');
  const [finAmount, setFinAmount] = useState('');
  const [finDesc, setFinDesc]   = useState('');
  const [finCat, setFinCat]     = useState(EXPENSE_CATS[0]);
  const [showFinForm, setShowFinForm] = useState(false);

  const [deletingIds, setDeletingIds] = useState(new Set());
  const [mobileTab, setMobileTab] = useState('tasks');

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
      setDeletingIds(prev => { const ns = new Set(prev); ns.delete(id); return ns; });
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
    <div className={s.container}>

      {/* Day header */}
      <div className={s.header}>
        <NavArrow onClick={onPrevDay} dir="left" />

        <div className={s.headerCenter}>
          <div className={s.headerDate}>
            {format(date, "d 'de' MMMM", { locale: es })}
          </div>
          <div className={s.headerWeekday}>
            {format(date, 'EEEE · yyyy', { locale: es })}
          </div>

          {/* Summary pills */}
          <div className={s.summaryPills}>
            <div className={s.taskPill}>
              <div className={s.progressTrack}>
                <div
                  className={`${s.progressFill} ${donePct === 100 ? s.progressFillComplete : s.progressFillPartial}`}
                  style={{ width: `${donePct}%` }}
                />
              </div>
              {dayTasks.length} tarea{dayTasks.length !== 1 ? 's' : ''}
            </div>
            {(dayIncome > 0 || dayExpense > 0) && (
              <div className={`${s.balancePill} ${balance >= 0 ? s.balancePillPositive : s.balancePillNegative}`}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </div>
            )}
          </div>
        </div>

        <NavArrow onClick={onNextDay} dir="right" />
      </div>

      {/* Mobile tabs */}
      {isMobile && (
        <div className={s.mobileTabs}>
          {[['tasks', 'Tareas'], ['finance', 'Finanzas']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className={`${s.mobileTab} ${mobileTab === id ? s.mobileTabActive : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={s.content}>
        {/* Tasks column */}
        <div className={`${s.column} ${isMobile && mobileTab !== 'tasks' ? s.columnHidden : ''}`}>
          <div className={s.sectionTitle}>Tareas</div>

          <AddBtn active={showTaskForm} onClick={() => setShowTaskForm(!showTaskForm)} label="Nueva tarea" />

          {showTaskForm && (
            <div className={`form-spring ${s.formCard}`}>
              <input
                autoFocus value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="¿Qué necesitas hacer?"
                className={s.formInput}
              />
              <div className={s.priorityRow}>
                {Object.entries(PRIORITIES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTaskPriority(key)}
                    className={s.priorityBtn}
                    style={taskPriority === key ? {
                      borderColor: PRIORITY_COLORS[key],
                      background: `${PRIORITY_COLORS[key]}22`,
                      color: PRIORITY_COLORS[key],
                    } : undefined}
                  >
                    {label}
                  </button>
                ))}
                <select
                  value={taskCategory}
                  onChange={e => setTaskCategory(e.target.value)}
                  className={`${s.formInput} ${s.formInputSmall}`}
                >
                  {TASK_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={addTask} className={s.submitBtn}>
                Agregar tarea
              </button>
            </div>
          )}

          {dayTasks.length === 0 ? (
            <Empty icon="✦" text="Sin tareas para este día" />
          ) : (
            <div className={s.taskList}>
              {dayTasks.filter(t => !t.done).map((task, i) => (
                <DayTaskRow key={task.id} task={task} i={i}
                  isDeleting={deletingIds.has(task.id)}
                  onToggle={id => onToggleTask(id)}
                  onDelete={id => deleteItem(id, onDeleteTask)}
                  onEdit={onEditTask} />
              ))}
              {dayTasks.some(t => t.done) && dayTasks.some(t => !t.done) && (
                <div className={s.tasksDivider} />
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
        <div className={`${s.column} ${isMobile && mobileTab !== 'finance' ? s.columnHidden : ''}`}>
          <div className={s.sectionTitle}>Finanzas</div>

          <AddBtn active={showFinForm} onClick={() => setShowFinForm(!showFinForm)} label="Agregar movimiento" />

          {/* Balance cards */}
          <div className={s.balanceGrid}>
            <div className={`${s.balanceCard} ${s.balanceCardIncome}`}>
              <div className={`${s.balanceCardLabel} ${s.balanceCardLabelIncome}`}>Ingresos</div>
              <div className={`${s.balanceCardValue} ${s.balanceCardValueIncome}`}>+{fmt(dayIncome)}</div>
            </div>
            <div className={`${s.balanceCard} ${s.balanceCardExpense}`}>
              <div className={`${s.balanceCardLabel} ${s.balanceCardLabelExpense}`}>Gastos</div>
              <div className={`${s.balanceCardValue} ${s.balanceCardValueExpense}`}>-{fmt(dayExpense)}</div>
            </div>
          </div>

          <div className={`${s.balanceTotal} ${balance >= 0 ? s.balanceTotalPositive : s.balanceTotalNegative}`}>
            <span className={s.balanceTotalLabel}>Balance</span>
            <span className={`${s.balanceTotalValue} ${balance >= 0 ? s.balanceTotalValuePositive : s.balanceTotalValueNegative}`}>
              {balance >= 0 ? '+' : ''}{fmt(balance)}
            </span>
          </div>

          {showFinForm && (
            <div className={`form-spring ${s.formCard}`}>
              <div className={s.finTypeToggle}>
                {[['expense', 'Gasto'], ['income', 'Ingreso']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setFinType(key); setFinCat(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }}
                    className={`${s.finTypeBtn} ${finType === key
                      ? (key === 'expense' ? s.finTypeBtnExpenseActive : s.finTypeBtnIncomeActive)
                      : ''}`}
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
                className={`${s.formInput} ${s.formInputSpaced}`}
              />
              <select
                value={finCat}
                onChange={e => setFinCat(e.target.value)}
                className={`${s.formInput} ${s.formInputSpaced} ${s.selectNoAppearance}`}
              >
                {(finType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                value={finDesc}
                onChange={e => setFinDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFinance()}
                placeholder="Descripción"
                className={`${s.formInput} ${s.formInputSpacedLg}`}
              />
              <button
                onClick={addFinance}
                className={`${s.submitBtn} ${s.submitBtnNoMargin} ${finType === 'income' ? s.submitBtnIncome : s.submitBtnExpense}`}
              >
                {finType === 'income' ? '+ Agregar ingreso' : '- Agregar gasto'}
              </button>
            </div>
          )}

          {dayExpenses.length === 0 ? (
            <Empty icon="₱" text="Sin movimientos para este día" />
          ) : (
            <div className={s.taskList}>
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

function AddBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`${s.addBtn} ${active ? s.addBtnActive : ''}`}
    >
      <Plus size={13} /> {label}
    </button>
  );
}

function Empty({ icon, text }) {
  return (
    <div className={s.empty}>
      <div className={s.emptyIcon}>{icon}</div>
      {text}
    </div>
  );
}

function NavArrow({ onClick, dir }) {
  return (
    <button onClick={onClick} className={s.navArrow}>
      {dir === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}

function IconBtn({ icon: Icon, color, hoverBg, onClick }) {
  return (
    <button
      onClick={onClick}
      className={s.iconBtn}
      style={{ '--icon-color': color, '--icon-bg': hoverBg }}
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
      <div className={`form-spring ${s.formCard}`} style={{ animationDelay: `${i * 0.05}s` }}>
        <input
          autoFocus value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          className={`${s.formInput} ${s.formInputSpaced}`}
        />
        <div className={s.priorityRowEdit}>
          {Object.entries(PRIORITIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setEditPriority(key)}
              className={s.priorityBtnEdit}
              style={editPriority === key ? {
                borderColor: PRIORITY_COLORS[key],
                background: `${PRIORITY_COLORS[key]}22`,
                color: PRIORITY_COLORS[key],
              } : undefined}
            >
              {label}
            </button>
          ))}
          <select
            value={editCategory}
            onChange={e => setEditCategory(e.target.value)}
            className={`${s.formInput} ${s.formInputSmallEdit}`}
          >
            {TASK_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={s.editActions}>
          <button onClick={saveEdit} className={s.editSaveBtn}>Guardar</button>
          <button onClick={cancelEdit} className={s.editCancelBtn}>Cancelar</button>
        </div>
      </div>
    );
  }

  const accentVars = {
    '--accent': PRIORITY_COLORS[task.priority],
    '--accent-dim': `${PRIORITY_COLORS[task.priority]}22`,
    '--accent-border': `${PRIORITY_COLORS[task.priority]}33`,
    '--accent-hover': `${PRIORITY_COLORS[task.priority]}66`,
    animationDelay: `${i * 0.05}s`,
  };

  return (
    <div
      className={`${isDeleting ? 'item-out' : ''} ${s.taskRow} ${task.done ? s.taskRowDone : ''}`}
      style={accentVars}
    >
      <button
        onClick={handleToggle}
        className={`${justToggled ? 'check-done' : ''} ${s.checkbox} ${task.done ? s.checkboxDone : ''}`}
      >
        {task.done && <Check size={11} color="var(--obsidian)" strokeWidth={3} />}
      </button>
      <div className={s.taskContent}>
        <div className={`${s.taskText} ${task.done ? s.taskTextDone : ''}`}>
          {task.text}
        </div>
        <div className={s.taskMeta}>
          <span className={s.priorityBadge}>
            {PRIORITIES[task.priority].toUpperCase()}
          </span>
          <span className={s.categoryLabel}>
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

  const isIncome = item.type === 'income';

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
      <div
        className={`form-spring ${s.expenseEditCard} ${editType === 'income' ? s.expenseEditCardIncome : s.expenseEditCardExpense}`}
        style={{ animationDelay: `${i * 0.04}s` }}
      >
        <div className={`${s.finTypeToggle} ${s.finTypeToggleEdit}`}>
          {[['expense', 'Gasto'], ['income', 'Ingreso']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setEditType(key); setEditCat(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }}
              className={`${s.finTypeBtn} ${s.finTypeBtnEdit} ${editType === key
                ? (key === 'expense' ? s.finTypeBtnExpenseActive : s.finTypeBtnIncomeActive)
                : ''}`}
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
          className={`${s.formInput} ${s.formInputSpaced}`}
        />
        <select
          value={editCat}
          onChange={e => setEditCat(e.target.value)}
          className={`${s.formInput} ${s.formInputSpaced} ${s.selectNoAppearance}`}
        >
          {(editType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          placeholder="Descripción"
          className={`${s.formInput} ${s.formInputSpacedLg}`}
        />
        <div className={s.editActions}>
          <button
            onClick={saveEdit}
            className={`${s.editSaveBtn} ${editType === 'income' ? s.editSaveBtnIncome : s.editSaveBtnExpense}`}
          >
            Guardar
          </button>
          <button onClick={cancelEdit} className={s.editCancelBtn}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isDeleting ? 'item-out' : ''} ${s.expenseRow} ${isIncome ? s.expenseRowIncome : s.expenseRowExpense}`}
      style={{ animationDelay: `${i * 0.04}s` }}
    >
      <div className={`${s.expenseIcon} ${isIncome ? s.expenseIconIncome : s.expenseIconExpense}`}>
        {isIncome ? <TrendingUp size={14} color="var(--sage)" /> : <TrendingDown size={14} color="var(--coral)" />}
      </div>
      <div className={s.expenseContent}>
        <div className={s.expenseDesc}>{item.desc}</div>
        <div className={s.expenseCategory}>{item.category}</div>
      </div>
      <div className={`${s.expenseAmount} ${isIncome ? s.expenseAmountIncome : s.expenseAmountExpense}`}>
        {isIncome ? '+' : '-'}{fmt(item.amount)}
      </div>
      <IconBtn icon={Pencil} color="var(--amber)" hoverBg="var(--amber-glow)" onClick={() => setIsEditing(true)} />
      <IconBtn icon={Trash2} color="var(--coral)" hoverBg="var(--coral-dim)" onClick={() => onDelete(item.id)} />
    </div>
  );
}
