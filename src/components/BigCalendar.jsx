import { useMemo, useRef } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import styles from './BigCalendar.module.css';

const PRIORITY_COLORS = {
  high: '#E05C5C',
  medium: '#F0A500',
  low: '#5FAD8E',
};

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);

export default function BigCalendar({ viewMonth, selectedDate, onSelectDate, tasks, expenses, isMobile }) {
  const prevMonthRef = useRef(viewMonth);
  const direction = viewMonth > prevMonthRef.current ? 'next' : 'prev';
  prevMonthRef.current = viewMonth;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const DAY_NAMES = isMobile ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
      else map[key].expense += e.amount;
    });
    return map;
  }, [expenses]);

  const gridKey = format(viewMonth, 'yyyy-MM');

  return (
    <div className={styles.container}>

      {/* Day headers */}
      <div className={styles.dayHeaders}>
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`${styles.dayName} ${i >= 5 ? styles.dayNameWeekend : ''} ${isMobile ? styles.dayNameMobile : ''}`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        key={gridKey}
        className={`${styles.grid} ${direction === 'next' ? 'month-enter-next' : 'month-enter-prev'}`}
        style={{ '--grid-rows': `repeat(${days.length / 7}, 1fr)` }}
      >
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[key] || [];
          const dayFin = expensesByDay[key] || null;
          const inMonth = isSameMonth(day, viewMonth);
          const today = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isWeekend = i % 7 >= 5;
          const donePct = dayTasks.length
            ? dayTasks.filter(t => t.done).length / dayTasks.length
            : 0;
          const VISIBLE_TASKS = 3;
          const overflow = dayTasks.length - VISIBLE_TASKS;

          const row = Math.floor(i / 7);
          const staggerDelay = `${row * 0.04 + (i % 7) * 0.01}s`;
          const isLastRow = i >= days.length - 7;

          const cellClasses = [
            styles.cell,
            isMobile ? styles.cellMobile : '',
            !inMonth ? styles.cellOutside : '',
            selected ? styles.cellSelected : today ? styles.cellToday : (isWeekend && inMonth ? styles.cellWeekend : ''),
            isLastRow ? styles.cellNoBorderBottom : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={key}
              className={cellClasses}
              onClick={() => onSelectDate(day)}
              style={{ '--stagger': staggerDelay }}
            >
              {/* Day number + progress */}
              <div className={`${styles.dayNumberRow} ${isMobile ? styles.dayNumberRowMobile : ''}`}>
                <span
                  className={[
                    styles.dayBadge,
                    isMobile ? styles.dayBadgeMobile : '',
                    today ? `${styles.dayBadgeToday} today-badge` : '',
                    !inMonth && !today ? styles.dayBadgeOutside : '',
                  ].filter(Boolean).join(' ')}
                >
                  {format(day, 'd')}
                </span>

                {!isMobile && dayTasks.length > 0 && (
                  <div className={styles.progressWrap}>
                    <div className={styles.progressTrack}>
                      <div
                        className={[
                          styles.progressBar,
                          donePct === 1 ? styles.progressComplete : donePct > 0 ? 'progress-shimmer' : styles.progressEmpty,
                        ].filter(Boolean).join(' ')}
                        style={{ '--progress': `${donePct * 100}%` }}
                      />
                    </div>
                    <span className={styles.progressCount}>
                      {dayTasks.filter(t => t.done).length}/{dayTasks.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Mobile: colored dots for tasks & finance */}
              {isMobile ? (
                <div className={styles.mobileDots}>
                  {dayTasks.slice(0, 4).map(task => (
                    <div
                      key={task.id}
                      className={styles.dot}
                      style={{
                        '--dot-color': task.done ? 'var(--border-light)' : PRIORITY_COLORS[task.priority],
                        '--dot-opacity': task.done ? 0.5 : 0.8,
                      }}
                    />
                  ))}
                  {dayFin && dayFin.income > 0 && (
                    <div className={styles.dot} style={{ '--dot-color': 'var(--sage)' }} />
                  )}
                  {dayFin && dayFin.expense > 0 && (
                    <div className={styles.dot} style={{ '--dot-color': 'var(--coral)' }} />
                  )}
                </div>
              ) : (
                <>
              {/* Finance chips */}
              {dayFin && (dayFin.income > 0 || dayFin.expense > 0) && (
                <div className={styles.financeRow}>
                  {dayFin.income > 0 && (
                    <div
                      className={`${styles.chipBase} ${styles.chipIncome}`}
                      style={{ '--stagger': staggerDelay }}
                    >
                      +{fmt(dayFin.income)}
                    </div>
                  )}
                  {dayFin.expense > 0 && (
                    <div
                      className={`${styles.chipBase} ${styles.chipExpense}`}
                      style={{ '--stagger': staggerDelay }}
                    >
                      -{fmt(dayFin.expense)}
                    </div>
                  )}
                </div>
              )}

              {/* Task pills */}
              {dayTasks.slice(0, VISIBLE_TASKS).map((task, ti) => (
                <div
                  key={task.id}
                  className={`${styles.taskPill} ${task.done ? styles.taskPillDone : ''}`}
                  style={{
                    '--pill-accent': task.done ? undefined : PRIORITY_COLORS[task.priority],
                    '--pill-bg': task.done ? undefined : `${PRIORITY_COLORS[task.priority]}18`,
                    '--stagger': `${parseFloat(staggerDelay) + ti * 0.03}s`,
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

              {overflow > 0 && (
                <div
                  className={styles.overflow}
                  style={{ '--stagger': `${parseFloat(staggerDelay) + 0.1}s` }}
                >
                  +{overflow} más
                </div>
              )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
