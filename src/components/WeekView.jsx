import { useMemo } from 'react';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

const PRIORITY_COLORS = { high: '#E05C5C', medium: '#F0A500', low: '#5FAD8E' };
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const fmtCompact = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0, notation: 'compact',
  }).format(n);

export default function WeekView({ weekStart, selectedDate, onSelectDate, tasks, expenses }) {
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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--obsidian-2)', flexShrink: 0,
      }}>
        {days.map((day, i) => {
          const today    = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isWeekend = i >= 5;

          return (
            <div
              key={i}
              onClick={() => onSelectDate(day)}
              style={{
                padding: '12px 14px',
                borderRight: i < 6 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                background: selected ? 'rgba(240,165,0,0.07)' : 'transparent',
                transition: 'background 0.15s ease',
                outline: selected ? '1.5px solid rgba(240,165,0,0.35)' : '1.5px solid transparent',
                outlineOffset: '-1px',
              }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--obsidian-3)'; }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: '6px',
                color: isWeekend ? 'rgba(240,165,0,0.5)' : 'var(--cream-muted)',
              }}>
                {DAY_NAMES[i]}
              </div>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '19px',
                fontWeight: today ? 700 : 500,
                color: today ? 'var(--obsidian)' : selected ? 'var(--amber)' : 'var(--cream)',
                background: today ? 'var(--amber)' : 'transparent',
                transition: 'transform 0.2s var(--ease-spring)',
              }}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week content grid */}
      <div style={{
        flex: 1,
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        overflow: 'auto',
      }}>
        {days.map((day, i) => {
          const key      = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[key]    || [];
          const dayFin   = expensesByDay[key] || null;
          const today    = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={key}
              onClick={() => onSelectDate(day)}
              style={{
                borderRight: i < 6 ? '1px solid var(--border)' : 'none',
                borderBottom: '1px solid var(--border)',
                padding: '10px 8px',
                cursor: 'pointer',
                minHeight: '140px',
                background: selected
                  ? 'rgba(240,165,0,0.04)'
                  : today
                    ? 'rgba(240,165,0,0.02)'
                    : 'transparent',
                transition: 'background 0.15s ease',
                display: 'flex', flexDirection: 'column', gap: '4px',
              }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--obsidian-3)'; }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? 'rgba(240,165,0,0.04)' : today ? 'rgba(240,165,0,0.02)' : 'transparent'; }}
            >
              {/* Finance chips */}
              {dayFin && (dayFin.income > 0 || dayFin.expense > 0) && (
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  {dayFin.income > 0 && (
                    <span style={{
                      fontSize: '9px', fontWeight: 600, color: 'var(--sage)',
                      background: 'var(--sage-dim)', borderRadius: '4px', padding: '2px 5px',
                    }}>
                      +{fmtCompact(dayFin.income)}
                    </span>
                  )}
                  {dayFin.expense > 0 && (
                    <span style={{
                      fontSize: '9px', fontWeight: 600, color: 'var(--coral)',
                      background: 'var(--coral-dim)', borderRadius: '4px', padding: '2px 5px',
                    }}>
                      -{fmtCompact(dayFin.expense)}
                    </span>
                  )}
                </div>
              )}

              {/* Task pills */}
              {dayTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '3px 6px', borderRadius: '5px', flexShrink: 0,
                  background: task.done ? 'rgba(255,255,255,0.03)' : `${PRIORITY_COLORS[task.priority]}18`,
                  borderLeft: `2px solid ${task.done ? 'var(--border-light)' : PRIORITY_COLORS[task.priority]}`,
                }}>
                  {task.done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M1 4l2 2 4-4" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span style={{
                    fontSize: '10px', lineHeight: 1.3,
                    color: task.done ? 'var(--cream-muted)' : 'var(--cream-dim)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
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
