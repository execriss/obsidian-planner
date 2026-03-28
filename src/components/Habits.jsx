import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, Flame, Check } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { useHabits } from '../hooks/useHabits.js';
import styles from './Habits.module.css';

const COLORS = [
  { id: 'sage',   color: '#5FAD8E', dim: 'rgba(95,173,142,0.18)' },
  { id: 'amber',  color: '#F0A500', dim: 'rgba(240,165,0,0.18)' },
  { id: 'coral',  color: '#E05C5C', dim: 'rgba(224,92,92,0.18)' },
  { id: 'blue',   color: '#6B8FD4', dim: 'rgba(107,143,212,0.18)' },
  { id: 'purple', color: '#A47BD4', dim: 'rgba(164,123,212,0.18)' },
  { id: 'teal',   color: '#4ECDC4', dim: 'rgba(78,205,196,0.18)' },
];
const colorById = Object.fromEntries(COLORS.map(c => [c.id, c]));

const EMOJIS = ['🏃', '💪', '📚', '🧘', '💧', '🥗', '🎯', '🛏️', '✍️', '🎨', '🎸', '🌿', '🧹', '🧠', '🌅', '🚴'];

function getToday() { return format(new Date(), 'yyyy-MM-dd'); }

function getStreak(logs) {
  if (!logs.length) return 0;
  const set = new Set(logs);
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = format(cursor, 'yyyy-MM-dd');
    if (set.has(key)) { streak++; cursor = subDays(cursor, 1); }
    else break;
  }
  return streak;
}

function getLast7(logs) {
  const set = new Set(logs);
  return Array.from({ length: 7 }, (_, i) => {
    const d   = subDays(new Date(), 6 - i);
    const key = format(d, 'yyyy-MM-dd');
    return { key, label: format(d, 'EEEEE', { locale: es }), done: set.has(key), isToday: key === getToday() };
  });
}

function getMonthlyRate(logs) {
  const set = new Set(logs);
  const today = new Date();
  const daysInMonth = today.getDate();
  let done = 0;
  for (let i = 0; i < daysInMonth; i++) {
    if (set.has(format(subDays(today, i), 'yyyy-MM-dd'))) done++;
  }
  return Math.round((done / daysInMonth) * 100);
}

export default function Habits({ userId }) {
  const isMobile = useIsMobile();
  const { habits, addHabit: dbAddHabit, removeHabit, toggleLog } = useHabits(userId);
  const [showForm, setShowForm]       = useState(false);
  const [name, setName]               = useState('');
  const [icon, setIcon]               = useState('🏃');
  const [color, setColor]             = useState('sage');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [checkingIds, setCheckingIds] = useState(new Set());

  const today = getToday();

  const addHabit = () => {
    if (!name.trim()) return;
    dbAddHabit({ name: name.trim(), icon, color });
    setName(''); setShowForm(false);
  };

  const toggleToday = (id) => {
    setCheckingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      toggleLog(id, today);
      setCheckingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 220);
  };

  const deleteHabit = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      removeHabit(id);
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const totalDone  = habits.filter(h => h.logs.includes(today)).length;
  const activeC    = colorById[color];
  const progressPct = habits.length ? (totalDone / habits.length * 100) : 0;

  return (
    <div className={`animate-viewIn ${styles.container}`}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Flame size={18} color="white" />
          </div>
          <div>
            <h1 className={styles.title}>Hábitos</h1>
            <p className={styles.subtitle}>
              {habits.length > 0
                ? `${totalDone} de ${habits.length} completados hoy`
                : 'Sin hábitos todavía'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`${styles.addBtn} ${showForm ? styles.addBtnActive : ''}`}
        >
          <Plus size={13} className={`${styles.addBtnIcon} ${showForm ? styles.addBtnIconRotated : ''}`} />
          Nuevo hábito
        </button>
      </div>

      {/* Summary bar */}
      {habits.length > 0 && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryLeft}>
            <div className={styles.summaryDate}>
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </div>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${totalDone === habits.length ? styles.progressFillComplete : styles.progressFillPartial}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className={styles.summaryRight}>
            <div
              className={`${styles.summaryCount} ${totalDone === habits.length ? styles.summaryCountComplete : styles.summaryCountPartial}`}
            >
              {totalDone}/{habits.length}
            </div>
            <div className={styles.summaryCountLabel}>completados</div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div
          className={`form-spring ${styles.form}`}
          style={{ '--accent': activeC.color, '--accent-dim': activeC.dim, '--accent-border': `${activeC.color}44` }}
        >
          <div className={styles.formPreview}>
            <div className={styles.previewIcon}>{icon}</div>
            <input
              autoFocus value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              placeholder="Nombre del hábito (ej: Ejercicio 30min)"
              className={styles.input}
            />
          </div>

          {/* Emoji picker */}
          <div className={styles.emojiPicker}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setIcon(e)}
                className={`${styles.emojiBtn} ${icon === e ? styles.emojiBtnActive : ''}`}
                style={icon === e ? { '--accent': activeC.color, '--accent-dim': activeC.dim } : {}}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className={styles.colorPicker}>
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                className={`${styles.colorDot} ${color === c.id ? styles.colorDotActive : ''}`}
                style={{
                  background: c.color,
                  boxShadow: color === c.id ? `0 0 10px ${c.color}66` : 'none',
                }}
              />
            ))}
          </div>

          <div className={styles.formActions}>
            <button
              onClick={addHabit}
              className={styles.submitBtn}
              style={{
                background:  activeC.color,
                boxShadow:   `0 4px 14px ${activeC.color}44`,
              }}
            >
              Agregar hábito
            </button>
            <button onClick={() => setShowForm(false)} className={styles.cancelBtn}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {habits.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔥</div>
          <div className={styles.emptyTitle}>Sin hábitos todavía</div>
          <p className={styles.emptyDesc}>Creá tus primeros hábitos y empezá a construir tu racha</p>
        </div>
      )}

      {/* Habit cards */}
      <div className={styles.habitList}>
        {habits.map((habit, i) => {
          const c       = colorById[habit.color] || colorById['sage'];
          const done    = habit.logs.includes(today);
          const streak  = getStreak(habit.logs);
          const last7   = getLast7(habit.logs);
          const monthly = getMonthlyRate(habit.logs);

          return (
            <div
              key={habit.id}
              className={`${styles.habitCard} ${done ? styles.habitCardDone : ''} ${deletingIds.has(habit.id) ? 'item-out' : ''}`}
              style={{
                '--accent':            c.color,
                '--accent-dim':        c.dim,
                '--accent-border':     `${c.color}28`,
                '--accent-border-done': `${c.color}55`,
                animationDelay:        `${i * 0.06}s`,
                animationName:         'fadeUp',
                animationDuration:     '0.3s',
                animationTimingFunction: 'var(--ease-spring)',
                animationFillMode:     'both',
              }}
            >
              <div className={styles.habitCardInner}>
                {/* Check button */}
                <button
                  onClick={() => toggleToday(habit.id)}
                  className={`${isMobile ? styles.checkBtnMobile : ''} ${styles.checkBtn} ${done ? styles.checkBtnDone : ''} ${checkingIds.has(habit.id) ? 'check-done' : ''}`}
                  style={{
                    border:     `2px solid ${done ? c.color : `${c.color}66`}`,
                    background: done ? c.color : 'transparent',
                    boxShadow:  done ? `0 4px 16px ${c.color}44` : 'none',
                  }}
                >
                  {done ? <Check size={22} color="white" strokeWidth={3} /> : <span>{habit.icon}</span>}
                </button>

                {/* Info */}
                <div className={styles.habitInfo}>
                  <div className={styles.habitNameRow}>
                    <span className={styles.habitName} style={{ color: done ? c.color : 'var(--cream)' }}>
                      {!done && <span className={styles.habitNameIcon}>{habit.icon}</span>}
                      {habit.name}
                    </span>
                    {streak > 0 && (
                      <span
                        className={styles.streakChip}
                        style={{ color: c.color, background: c.dim, border: `1px solid ${c.color}44` }}
                      >
                        🔥 {streak}
                      </span>
                    )}
                  </div>

                  {/* Last 7 days */}
                  <div className={styles.last7}>
                    {last7.map(day => (
                      <div key={day.key} className={styles.dayColumn} title={day.key}>
                        <div
                          className={`${styles.dayDot} ${day.done ? styles.dayDotDone : styles.dayDotEmpty} ${day.isToday ? styles.dayDotToday : ''}`}
                          style={day.done || day.isToday ? { '--accent': c.color } : {}}
                        >
                          {day.done && <Check size={10} color="white" strokeWidth={3} />}
                        </div>
                        <span
                          className={`${styles.dayLabel} ${day.isToday ? styles.dayLabelToday : ''}`}
                          style={day.isToday ? { color: c.color } : {}}
                        >
                          {day.label}
                        </span>
                      </div>
                    ))}
                    <div className={styles.monthlyStat}>
                      <div className={styles.monthlyPercent} style={{ color: c.color }}>
                        {monthly}%
                      </div>
                      <div className={styles.monthlyLabel}>este mes</div>
                    </div>
                  </div>
                </div>

                <button onClick={() => deleteHabit(habit.id)} className={styles.deleteBtn}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
