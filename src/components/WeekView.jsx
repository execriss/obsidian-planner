import { useMemo } from 'react';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useDragMove } from '../hooks/useDragMove.js';
import styles from './WeekView.module.css';

const PRIORITY_COLORS = { high: '#E05C5C', medium: '#F0A500', low: '#5FAD8E' };
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const fmtCompact = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0, notation: 'compact',
  }).format(n);

export default function WeekView({ weekStart, selectedDate, onSelectDate, tasks, expenses, onMoveTask }) {
  const days = eachDayOfInterval({
    start: startOfWeek(weekStart, { weekStartsOn: 1 }),
    end:   endOfWeek(weekStart,   { weekStartsOn: 1 }),
  });

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const expensesByDay = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (e.type === 'income') map[key].income += e.amount;
      else                     map[key].expense += e.amount;
    });
    return map;
  }, [expenses]);

  const { draggingId, dropKey, didDrag, handlePillPointerDown } = useDragMove(onMoveTask);

  return (
    <div className={styles.container}>

      {/* Day headers */}
      <div className={styles.dayHeaders}>
        {days.map((day, i) => {
          const today     = isToday(day);
          const selected  = selectedDate && isSameDay(day, selectedDate);
          const isWeekend = i >= 5;

          return (
            <div
              key={i}
              onClick={() => onSelectDate(day)}
              className={`${styles.headerCell} ${selected ? styles.headerCellSelected : ''}`}
            >
              <div className={`${styles.dayLabel} ${isWeekend ? styles.dayLabelWeekend : ''}`}>
                {DAY_NAMES[i]}
              </div>
              <div className={[
                styles.dayNumber,
                today             ? styles.dayNumberToday    : '',
                selected && !today ? styles.dayNumberSelected : '',
              ].filter(Boolean).join(' ')}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week content grid */}
      <div className={styles.contentGrid}>
        {days.map((day, i) => {
          const key      = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[key]    || [];
          const dayFin   = expensesByDay[key] || null;
          const today    = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isTarget = dropKey === key;

          return (
            <div
              key={key}
              data-date-key={key}
              onClick={() => { if (!didDrag.current) onSelectDate(day); }}
              className={[
                styles.contentCell,
                selected   ? styles.contentCellSelected    : today ? styles.contentCellToday : '',
                isTarget   ? styles.contentCellDropTarget  : '',
                draggingId ? styles.contentCellDraggingMode : '',
              ].filter(Boolean).join(' ')}
            >
              {/* Finance chips */}
              {dayFin && (dayFin.income > 0 || dayFin.expense > 0) && (
                <div className={styles.financeRow}>
                  {dayFin.income > 0 && (
                    <span className={styles.chipIncome}>+{fmtCompact(dayFin.income)}</span>
                  )}
                  {dayFin.expense > 0 && (
                    <span className={styles.chipExpense}>-{fmtCompact(dayFin.expense)}</span>
                  )}
                </div>
              )}

              {/* Task pills */}
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  onPointerDown={(e) => handlePillPointerDown(e, task, key)}
                  className={[
                    styles.taskPill,
                    task.done              ? styles.taskPillDone     : '',
                    draggingId === task.id ? styles.taskPillDragging : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    '--pill-accent': task.done ? undefined : PRIORITY_COLORS[task.priority],
                    '--pill-bg':     task.done ? undefined : `${PRIORITY_COLORS[task.priority]}18`,
                  }}
                >
                  {task.done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={styles.checkIcon}>
                      <path d="M1 4l2 2 4-4" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span className={`${styles.taskText} ${task.done ? styles.taskTextDone : ''}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
