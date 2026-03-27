import { useState, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, Flame, Check } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useIsMobile } from '../hooks/useIsMobile.js';

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

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function getToday() { return format(new Date(), 'yyyy-MM-dd'); }

function getStreak(logs) {
  if (!logs.length) return 0;
  const set = new Set(logs);
  let streak = 0;
  let cursor = new Date();
  // allow today to not be checked yet (streak starts from yesterday if today not done)
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
    const d = subDays(new Date(), 6 - i);
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

const inputSt = {
  width: '100%', background: 'var(--obsidian-4)',
  border: '1px solid var(--border-light)', borderRadius: '10px',
  padding: '10px 14px', fontSize: '13px', color: 'var(--cream)',
  outline: 'none', transition: 'border-color 0.2s ease',
};

export default function Habitos() {
  const isMobile = useIsMobile();
  const [habits, setHabits] = useLocalStorage('habits', []);
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState('');
  const [icon, setIcon]         = useState('🏃');
  const [color, setColor]       = useState('sage');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [checkingIds, setCheckingIds] = useState(new Set());

  const today = getToday();

  const addHabit = () => {
    if (!name.trim()) return;
    setHabits(prev => [...prev, { id: uid(), name: name.trim(), icon, color, logs: [] }]);
    setName(''); setShowForm(false);
  };

  const toggleToday = (id) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const alreadyDone = habit.logs.includes(today);
    setCheckingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setHabits(prev => prev.map(h => h.id === id
        ? { ...h, logs: alreadyDone ? h.logs.filter(d => d !== today) : [...h.logs, today] }
        : h
      ));
      setCheckingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 220);
  };

  const deleteHabit = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setHabits(prev => prev.filter(h => h.id !== id));
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const totalDone = habits.filter(h => h.logs.includes(today)).length;

  return (
    <div className="animate-viewIn" style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', animation: 'fadeDown 0.35s var(--ease-out) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #E05C5C, #B83A3A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(224,92,92,0.3)',
            animation: 'float 3.5s ease-in-out infinite',
          }}>
            <Flame size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Hábitos
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--cream-muted)', marginTop: '3px' }}>
              {habits.length > 0
                ? `${totalDone} de ${habits.length} completados hoy`
                : 'Sin hábitos todavía'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            borderRadius: '10px', fontSize: '12px', fontWeight: 600,
            background: showForm ? 'rgba(224,92,92,0.12)' : 'var(--obsidian-3)',
            border: `1px solid ${showForm ? 'var(--coral)' : 'var(--border)'}`,
            color: showForm ? 'var(--coral)' : 'var(--cream)',
            transition: 'all 0.2s var(--ease-spring)',
          }}
        >
          <Plus size={13} style={{ transform: showForm ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s var(--ease-spring)' }} />
          Nuevo hábito
        </button>
      </div>

      {/* Today summary bar */}
      {habits.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: '14px', marginBottom: '20px',
          background: 'var(--obsidian-3)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '14px',
          animation: 'fadeUp 0.3s var(--ease-spring) 0.05s both',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--cream-muted)', marginBottom: '6px', fontWeight: 500 }}>
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </div>
            <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                width: `${habits.length ? (totalDone / habits.length * 100) : 0}%`,
                background: totalDone === habits.length ? 'var(--sage)' : 'var(--coral)',
                transition: 'width 0.6s var(--ease-spring)',
              }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: totalDone === habits.length ? 'var(--sage)' : 'var(--coral)', lineHeight: 1 }}>
              {totalDone}/{habits.length}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--cream-muted)', marginTop: '2px' }}>completados</div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="form-spring" style={{
          background: 'var(--obsidian-3)', border: '1px solid var(--border-light)',
          borderRadius: '16px', padding: '20px', marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: colorById[color].dim,
              border: `1px solid ${colorById[color].color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px',
            }}>{icon}</div>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              placeholder="Nombre del hábito (ej: Ejercicio 30min)"
              style={{ ...inputSt }}
              onFocus={e => e.target.style.borderColor = colorById[color].color}
              onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
          </div>

          {/* Emoji picker */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setIcon(e)} style={{
                width: '36px', height: '36px', borderRadius: '9px', fontSize: '18px',
                border: `1px solid ${icon === e ? colorById[color].color : 'var(--border)'}`,
                background: icon === e ? colorById[color].dim : 'transparent',
                transform: icon === e ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.18s var(--ease-spring)',
              }}>{e}</button>
            ))}
          </div>

          {/* Color picker */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {COLORS.map(c => (
              <button key={c.id} onClick={() => setColor(c.id)} style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: c.color,
                border: `2px solid ${color === c.id ? 'white' : 'transparent'}`,
                transform: color === c.id ? 'scale(1.2)' : 'scale(1)',
                boxShadow: color === c.id ? `0 0 10px ${c.color}66` : 'none',
                transition: 'all 0.18s var(--ease-spring)',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addHabit} style={{
              flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
              background: colorById[color].color, color: 'white',
              boxShadow: `0 4px 14px ${colorById[color].color}44`,
              transition: 'all 0.2s var(--ease-spring)',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >Agregar hábito</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--cream-muted)', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Empty */}
      {habits.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', animation: 'fadeIn 0.4s ease both' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🔥</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--cream-dim)', marginBottom: '8px' }}>Sin hábitos todavía</div>
          <p style={{ fontSize: '12px', color: 'var(--cream-muted)' }}>Creá tus primeros hábitos y empezá a construir tu racha</p>
        </div>
      )}

      {/* Habit cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {habits.map((habit, i) => {
          const c    = colorById[habit.color] || colorById['sage'];
          const done = habit.logs.includes(today);
          const streak  = getStreak(habit.logs);
          const last7   = getLast7(habit.logs);
          const monthly = getMonthlyRate(habit.logs);

          return (
            <div
              key={habit.id}
              className={deletingIds.has(habit.id) ? 'item-out' : ''}
              style={{
                padding: '16px 18px', borderRadius: '16px',
                background: done ? c.dim : 'var(--obsidian-3)',
                border: `1px solid ${done ? c.color + '55' : c.color + '28'}`,
                animation: `fadeUp 0.3s var(--ease-spring) ${i * 0.06}s both`,
                transition: 'background 0.3s ease, border-color 0.3s ease, transform 0.2s var(--ease-spring)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Check button */}
                <button
                  onClick={() => toggleToday(habit.id)}
                  className={checkingIds.has(habit.id) ? 'check-done' : ''}
                  style={{
                    width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: isMobile ? '11px' : '14px', flexShrink: 0,
                    border: `2px solid ${done ? c.color : c.color + '66'}`,
                    background: done ? c.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '0' : '24px',
                    transition: 'all 0.25s var(--ease-spring)',
                    boxShadow: done ? `0 4px 16px ${c.color}44` : 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {done
                    ? <Check size={22} color="white" strokeWidth={3} />
                    : <span>{habit.icon}</span>
                  }
                </button>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: done ? c.color : 'var(--cream)' }}>
                      {!done && <span style={{ marginRight: '6px' }}>{habit.icon}</span>}
                      {habit.name}
                    </span>
                    {streak > 0 && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: c.color,
                        background: c.dim, border: `1px solid ${c.color}44`,
                        padding: '1px 7px', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', gap: '3px',
                      }}>
                        🔥 {streak}
                      </span>
                    )}
                  </div>

                  {/* Last 7 days */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {last7.map(day => (
                      <div key={day.key} title={day.key} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '6px',
                          background: day.done ? c.color : 'var(--border)',
                          border: day.isToday ? `2px solid ${c.color}` : '2px solid transparent',
                          transition: 'background 0.3s ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {day.done && <Check size={10} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: '8px', color: day.isToday ? c.color : 'var(--cream-muted)', fontWeight: day.isToday ? 700 : 400, textTransform: 'uppercase' }}>
                          {day.label}
                        </span>
                      </div>
                    ))}
                    <div style={{ marginLeft: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: c.color, lineHeight: 1 }}>{monthly}%</div>
                      <div style={{ fontSize: '8px', color: 'var(--cream-muted)', marginTop: '1px' }}>este mes</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteHabit(habit.id)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--cream-muted)', flexShrink: 0,
                    transition: 'all 0.15s var(--ease-spring)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-dim)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
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
