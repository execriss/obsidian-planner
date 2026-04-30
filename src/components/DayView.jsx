import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Pencil, Tag } from 'lucide-react';
import s from './DayView.module.css';

const PRIORITY_COLORS = { high: '#E05C5C', medium: '#F0A500', low: '#5FAD8E' };
const PRIORITIES      = { high: 'Alta', medium: 'Media', low: 'Baja' };
const TASK_CATS       = ['Personal', 'Trabajo', 'Salud', 'Finanzas', 'Otro'];

export default function DayView({
  date, tasks,
  onAddTask, onToggleTask, onDeleteTask, onEditTask,
  onPrevDay, onNextDay,
}) {
  const dayTasks = tasks.filter(t => isSameDay(new Date(t.date), date));
  const donePct  = dayTasks.length
    ? Math.round(dayTasks.filter(t => t.done).length / dayTasks.length * 100)
    : 0;

  const [newTask, setNewTask]           = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [showTaskForm, setShowTaskForm] = useState(false);

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
      setDeletingIds(prev => { const ns = new Set(prev); ns.delete(id); return ns; });
    }, 200);
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

          {/* Summary pill */}
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
          </div>
        </div>

        <NavArrow onClick={onNextDay} dir="right" />
      </div>

      {/* Content */}
      <div className={s.content}>
        {/* Tasks column */}
        <div className={s.column}>
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

