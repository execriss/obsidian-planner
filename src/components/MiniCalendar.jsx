import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
  addMonths, subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './MiniCalendar.module.css';

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
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button
          className={styles.navBtn}
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
        >
          <ChevronLeft size={14} />
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.monthLabel}>
            {format(viewMonth, 'MMMM', { locale: es })}
          </span>
          <span className={styles.yearLabel}>{format(viewMonth, 'yyyy')}</span>
        </div>
        <button
          className={styles.navBtn}
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={styles.grid}>
        {dayNames.map(d => (
          <div key={d} className={styles.dayName}>{d}</div>
        ))}
        {days.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const inMonth = isSameMonth(day, viewMonth);
          const hasT = hasTask(day);
          const hasE = hasExpense(day);

          const btnClasses = [
            styles.dayBtn,
            !inMonth ? styles.dayBtnOutside : '',
            isSelected ? styles.dayBtnSelected : today ? styles.dayBtnToday : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={i}
              onClick={() => onSelectDate(day)}
              className={btnClasses}
            >
              {format(day, 'd')}
              {(hasT || hasE) && (
                <div className={styles.indicators}>
                  {hasT && (
                    <span
                      className={styles.indicatorDot}
                      style={{ '--dot-color': isSelected ? 'var(--obsidian)' : 'var(--blue)' }}
                    />
                  )}
                  {hasE && (
                    <span
                      className={styles.indicatorDot}
                      style={{ '--dot-color': isSelected ? 'var(--obsidian)' : 'var(--amber)' }}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
