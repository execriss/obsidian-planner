import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
  addMonths, subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';

const styles = {
  wrapper: {
    padding: '24px 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  monthLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--cream)',
    letterSpacing: '0.02em',
  },
  yearLabel: {
    fontSize: '11px',
    color: 'var(--cream-muted)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 500,
    display: 'block',
    marginTop: '1px',
  },
  navBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--cream-muted)',
    transition: 'all 0.2s',
    background: 'transparent',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  },
  dayName: {
    textAlign: 'center',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--cream-muted)',
    paddingBottom: '8px',
  },
};

export default function MiniCalendar({ selectedDate, onSelectDate, tasks = [], expenses = [] }) {
  const [viewMonth, setViewMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const hasTask = (day) => tasks.some(t => isSameDay(new Date(t.date), day));
  const hasExpense = (day) => expenses.some(e => isSameDay(new Date(e.date), day));

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button
          style={styles.navBtn}
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-glow)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ChevronLeft size={14} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <span style={styles.monthLabel}>
            {format(viewMonth, 'MMMM', { locale: es })}
          </span>
          <span style={styles.yearLabel}>{format(viewMonth, 'yyyy')}</span>
        </div>
        <button
          style={styles.navBtn}
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-glow)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div style={styles.grid}>
        {dayNames.map(d => (
          <div key={d} style={styles.dayName}>{d}</div>
        ))}
        {days.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const inMonth = isSameMonth(day, viewMonth);
          const hasT = hasTask(day);
          const hasE = hasExpense(day);

          return (
            <button
              key={i}
              onClick={() => onSelectDate(day)}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: isSelected || today ? 600 : 400,
                color: isSelected
                  ? 'var(--obsidian)'
                  : today
                    ? 'var(--amber)'
                    : inMonth
                      ? 'var(--cream-dim)'
                      : 'var(--cream-muted)',
                background: isSelected
                  ? 'var(--amber)'
                  : today && !isSelected
                    ? 'var(--amber-glow)'
                    : 'transparent',
                border: today && !isSelected ? '1px solid var(--amber-dim)' : '1px solid transparent',
                transition: 'all 0.15s',
                opacity: inMonth ? 1 : 0.35,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '2px',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--obsidian-4)';
                  e.currentTarget.style.color = 'var(--cream)';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = today ? 'var(--amber-glow)' : 'transparent';
                  e.currentTarget.style.color = today ? 'var(--amber)' : inMonth ? 'var(--cream-dim)' : 'var(--cream-muted)';
                }
              }}
            >
              {format(day, 'd')}
              {(hasT || hasE) && (
                <div style={{ display: 'flex', gap: '2px' }}>
                  {hasT && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: isSelected ? 'var(--obsidian)' : 'var(--blue)' }} />}
                  {hasE && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: isSelected ? 'var(--obsidian)' : 'var(--amber)' }} />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
