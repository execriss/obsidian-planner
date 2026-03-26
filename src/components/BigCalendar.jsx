import { useMemo, useRef } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
} from 'date-fns';

const PRIORITY_COLORS = {
  high: '#E05C5C',
  medium: '#F0A500',
  low: '#5FAD8E',
};

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);

export default function BigCalendar({ viewMonth, selectedDate, onSelectDate, tasks, expenses }) {
  const prevMonthRef = useRef(viewMonth);
  const direction = viewMonth > prevMonthRef.current ? 'next' : 'prev';
  prevMonthRef.current = viewMonth;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--obsidian-2)',
        flexShrink: 0,
      }}>
        {DAY_NAMES.map((name, i) => (
          <div key={name} style={{
            padding: '10px 14px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: i >= 5 ? 'var(--amber-dim)' : 'var(--cream-muted)',
            borderRight: i < 6 ? '1px solid var(--border)' : 'none',
          }}>
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid — keyed so it re-mounts on month change → triggers stagger */}
      <div
        key={gridKey}
        className={direction === 'next' ? 'month-enter-next' : 'month-enter-prev'}
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${days.length / 7}, 1fr)`,
          overflow: 'hidden',
        }}
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

          // Stagger delay: row-based so each row enters together, offset by row
          const row = Math.floor(i / 7);
          const staggerDelay = `${row * 0.04 + (i % 7) * 0.01}s`;

          return (
            <div
              key={key}
              className="cal-cell"
              onClick={() => onSelectDate(day)}
              style={{
                animationDelay: staggerDelay,
                borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                borderBottom: i < days.length - 7 ? '1px solid var(--border)' : 'none',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                cursor: 'pointer',
                background: selected
                  ? 'rgba(240,165,0,0.07)'
                  : today
                    ? 'rgba(240,165,0,0.03)'
                    : isWeekend && inMonth
                      ? 'rgba(255,255,255,0.005)'
                      : 'transparent',
                opacity: inMonth ? 1 : 0.38,
                transition: 'background 0.18s ease, outline-color 0.18s ease, opacity 0.2s ease',
                outline: selected ? '1.5px solid rgba(240,165,0,0.35)' : '1.5px solid transparent',
                outlineOffset: '-1px',
                overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!selected) e.currentTarget.style.background = 'var(--obsidian-3)';
              }}
              onMouseLeave={e => {
                if (!selected) e.currentTarget.style.background = today ? 'rgba(240,165,0,0.03)' : 'transparent';
              }}
            >
              {/* Day number + progress */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2px',
              }}>
                <span
                  className={today ? 'today-badge' : ''}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: today ? 700 : 500,
                    color: today ? 'var(--obsidian)' : inMonth ? 'var(--cream)' : 'var(--cream-muted)',
                    background: today ? 'var(--amber)' : 'transparent',
                    flexShrink: 0,
                    lineHeight: 1,
                    transition: 'transform 0.2s var(--ease-spring)',
                  }}
                >
                  {format(day, 'd')}
                </span>

                {dayTasks.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '28px', height: '4px',
                      borderRadius: '2px', background: 'var(--border)',
                      overflow: 'hidden',
                    }}>
                      <div
                        className={donePct > 0 ? 'progress-shimmer' : ''}
                        style={{
                          height: '100%',
                          width: `${donePct * 100}%`,
                          background: donePct === 1
                            ? 'var(--sage)'
                            : donePct > 0
                              ? undefined   /* shimmer handles it */
                              : 'var(--border-light)',
                          borderRadius: '2px',
                          transition: 'width 0.5s var(--ease-spring)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--cream-muted)', fontWeight: 600 }}>
                      {dayTasks.filter(t => t.done).length}/{dayTasks.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Finance chips */}
              {dayFin && (dayFin.income > 0 || dayFin.expense > 0) && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {dayFin.income > 0 && (
                    <div
                      className="chip-pop"
                      style={{
                        animationDelay: `${staggerDelay}`,
                        fontSize: '9px', fontWeight: 600,
                        color: 'var(--sage)',
                        background: 'var(--sage-dim)',
                        borderRadius: '4px', padding: '2px 5px',
                        whiteSpace: 'nowrap',
                        transition: 'transform 0.15s var(--ease-spring)',
                      }}
                    >
                      +{fmt(dayFin.income)}
                    </div>
                  )}
                  {dayFin.expense > 0 && (
                    <div
                      className="chip-pop"
                      style={{
                        animationDelay: `${staggerDelay}`,
                        fontSize: '9px', fontWeight: 600,
                        color: 'var(--coral)',
                        background: 'var(--coral-dim)',
                        borderRadius: '4px', padding: '2px 5px',
                        whiteSpace: 'nowrap',
                        transition: 'transform 0.15s var(--ease-spring)',
                      }}
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 7px',
                    borderRadius: '5px',
                    background: task.done
                      ? 'rgba(255,255,255,0.03)'
                      : `${PRIORITY_COLORS[task.priority]}18`,
                    borderLeft: `2px solid ${task.done ? 'var(--border-light)' : PRIORITY_COLORS[task.priority]}`,
                    overflow: 'hidden',
                    flexShrink: 0,
                    transition: 'opacity 0.2s ease, background 0.2s ease',
                    animationDelay: `${parseFloat(staggerDelay) + ti * 0.03}s`,
                  }}
                >
                  {task.done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M1 4l2 2 4-4" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span style={{
                    fontSize: '10px',
                    color: task.done ? 'var(--cream-muted)' : 'var(--cream-dim)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}>
                    {task.text}
                  </span>
                </div>
              ))}

              {overflow > 0 && (
                <div style={{
                  fontSize: '9px', fontWeight: 600,
                  color: 'var(--cream-muted)', paddingLeft: '4px',
                  letterSpacing: '0.04em',
                  animation: `fadeIn 0.2s ease ${parseFloat(staggerDelay) + 0.1}s both`,
                }}>
                  +{overflow} más
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
