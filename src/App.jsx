import { useState, useEffect } from 'react';
import {
  Calendar, BarChart3, ChevronLeft, ChevronRight,
  Sparkles, CheckSquare, TrendingUp, TrendingDown, LogOut, User, Settings2,
} from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, isToday, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from './contexts/AuthContext.jsx';
import { useData } from './hooks/useData.js';
import AuthGate from './components/AuthGate.jsx';
import BigCalendar from './components/BigCalendar.jsx';
import WeekView from './components/WeekView.jsx';
import DayView from './components/DayView.jsx';
import DayPanel from './components/DayPanel.jsx';
import MonthlyReport from './components/MonthlyReport.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading) return <Loader />;
  if (!user) return <AuthGate />;
  return <Planner user={user} onSignOut={signOut} />;
}

function Planner({ user, onSignOut }) {
  const [viewMonth, setViewMonth]     = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView]               = useState('calendar');
  const [calView, setCalView]         = useState('month'); // 'month' | 'week' | 'day'
  const [viewWeek, setViewWeek]       = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewKey, setViewKey]         = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState('');

  const {
    tasks, expenses, loading,
    addTask, toggleTask, removeTask, editTask,
    addExpense, removeExpense, editExpense,
    migrateFromLocalStorage,
  } = useData(user.id);

  // Detectar datos legacy en localStorage y ofrecer migración
  useEffect(() => {
    if (loading) return;
    const hasLegacy = localStorage.getItem('obsidian_tasks') || localStorage.getItem('obsidian_expenses');
    if (hasLegacy && tasks.length === 0) {
      setMigrationMsg('pending');
    }
  }, [loading]);

  const handleMigrate = async () => {
    setMigrationMsg('loading');
    const count = await migrateFromLocalStorage();
    setMigrationMsg(`done:${count}`);
    setTimeout(() => setMigrationMsg(''), 3000);
  };

  const changeView = (v) => {
    if (v === view) return;
    setView(v);
    setViewKey(k => k + 1);
  };

  const changeMonth = (dir) =>
    setViewMonth(m => dir === 'next' ? addMonths(m, 1) : subMonths(m, 1));

  const handleSelectDate = (day) => {
    setSelectedDate(prev =>
      prev && format(prev, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ? null : day
    );
    if (!isSameMonth(day, viewMonth)) setViewMonth(day);
    setViewWeek(startOfWeek(day, { weekStartsOn: 1 }));
  };

  const handlePrevNav = () => {
    if (calView === 'month') changeMonth('prev');
    else if (calView === 'week') setViewWeek(w => subWeeks(w, 1));
    else setSelectedDate(d => subDays(d || new Date(), 1));
  };

  const handleNextNav = () => {
    if (calView === 'month') changeMonth('next');
    else if (calView === 'week') setViewWeek(w => addWeeks(w, 1));
    else setSelectedDate(d => addDays(d || new Date(), 1));
  };

  const handleToday = () => {
    const today = new Date();
    setViewMonth(today);
    setSelectedDate(today);
    setViewWeek(startOfWeek(today, { weekStartsOn: 1 }));
  };

  const pendingToday = tasks.filter(t => isToday(new Date(t.date)) && !t.done).length;
  const monthIncome  = expenses.filter(e => e.type === 'income' && isSameMonth(new Date(e.date), viewMonth)).reduce((s, e) => s + e.amount, 0);
  const monthExpense = expenses.filter(e => e.type === 'expense' && isSameMonth(new Date(e.date), viewMonth)).reduce((s, e) => s + e.amount, 0);

  const fmtCompact = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, notation: 'compact' }).format(n);

  const avatar = user.user_metadata?.avatar_url;
  const name   = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100vw',
      background: 'var(--obsidian)', overflow: 'hidden',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 50% 40% at 10% 50%, rgba(240,165,0,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 92% 15%, rgba(107,143,212,0.035) 0%, transparent 60%)
        `,
      }} />

      {/* Migration banner */}
      {migrationMsg === 'pending' && (
        <div style={{
          position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--obsidian-3)', border: '1px solid var(--amber-dim)',
          borderRadius: '12px', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          zIndex: 100, animation: 'fadeUp 0.3s var(--ease-spring)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--cream-dim)' }}>
            Tenés datos guardados localmente.
          </span>
          <button
            onClick={handleMigrate}
            style={{
              padding: '5px 14px', borderRadius: '8px',
              background: 'var(--amber)', color: 'var(--obsidian)',
              fontSize: '11px', fontWeight: 700,
              transition: 'all 0.15s var(--ease-spring)',
            }}
          >
            Importar a la nube
          </button>
          <button onClick={() => setMigrationMsg('')} style={{ color: 'var(--cream-muted)', fontSize: '16px' }}>×</button>
        </div>
      )}
      {migrationMsg === 'loading' && (
        <div style={bannerStyle}>
          <span style={{ fontSize: '12px', color: 'var(--cream-dim)' }}>Importando datos...</span>
        </div>
      )}
      {migrationMsg.startsWith('done:') && (
        <div style={{ ...bannerStyle, borderColor: 'var(--sage)44' }}>
          <span style={{ fontSize: '12px', color: 'var(--sage)' }}>
            ✓ {migrationMsg.split(':')[1]} registros importados correctamente
          </span>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '200px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--obsidian-2)',
        display: 'flex', flexDirection: 'column',
        zIndex: 10,
        animation: 'slideInLeft 0.4s var(--ease-out) both',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--amber), var(--amber-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(240,165,0,0.25)', flexShrink: 0,
            }}>
              <Calendar size={15} color="var(--obsidian)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.01em', lineHeight: 1 }}>
                Obsidian
              </div>
              <div style={{ fontSize: '9px', color: 'var(--amber)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>
                Planner
              </div>
            </div>
          </div>
        </div>

        {/* Month navigator */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <NavBtn onClick={() => changeMonth('prev')}><ChevronLeft size={13} /></NavBtn>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--cream)', lineHeight: 1, textTransform: 'capitalize' }}>
                {format(viewMonth, 'MMMM', { locale: es })}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--cream-muted)', marginTop: '2px' }}>{format(viewMonth, 'yyyy')}</div>
            </div>
            <NavBtn onClick={() => changeMonth('next')}><ChevronRight size={13} /></NavBtn>
          </div>
          <button
            onClick={() => { setViewMonth(new Date()); setSelectedDate(new Date()); }}
            style={{
              width: '100%', marginTop: '8px', padding: '6px', borderRadius: '8px',
              fontSize: '11px', fontWeight: 500, color: 'var(--cream-muted)',
              border: '1px solid var(--border)', background: 'transparent',
              transition: 'all 0.2s var(--ease-spring)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber-glow)'; e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.borderColor = 'var(--amber-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Hoy
          </button>
        </div>

        {/* Nav views */}
        <div style={{ padding: '12px 10px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cream-muted)', marginBottom: '8px', fontWeight: 600, paddingLeft: '6px' }}>Vista</div>
          {[
            { id: 'calendar', icon: Calendar,  label: 'Calendario' },
            { id: 'monthly',  icon: BarChart3,  label: 'Reporte' },
            { id: 'settings', icon: Settings2, label: 'Ajustes' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => changeView(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 10px', borderRadius: '9px',
                fontSize: '12px', fontWeight: view === id ? 600 : 400,
                color: view === id ? 'var(--amber)' : 'var(--cream-dim)',
                background: view === id ? 'var(--amber-glow)' : 'transparent',
                border: view === id ? '1px solid rgba(196,134,0,0.25)' : '1px solid transparent',
                transition: 'all 0.22s var(--ease-spring)',
                marginBottom: '2px', textAlign: 'left',
              }}
              onMouseEnter={e => { if (view !== id) { e.currentTarget.style.background = 'var(--obsidian-3)'; e.currentTarget.style.color = 'var(--cream)'; e.currentTarget.style.transform = 'translateX(3px)'; } }}
              onMouseLeave={e => { if (view !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cream-dim)'; e.currentTarget.style.transform = 'translateX(0)'; } }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cream-muted)', marginBottom: '10px', fontWeight: 600 }}>
            {format(viewMonth, 'MMM yyyy', { locale: es })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pendingToday > 0 && <StatRow icon={CheckSquare} label="Pendientes" value={pendingToday} color="var(--amber)" />}
            {monthIncome  > 0 && <StatRow icon={TrendingUp}  label="Ingresos"   value={fmtCompact(monthIncome)}  color="var(--sage)" />}
            {monthExpense > 0 && <StatRow icon={TrendingDown} label="Gastos"     value={fmtCompact(monthExpense)} color="var(--coral)" />}
          </div>
        </div>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 8px', borderRadius: '9px',
              border: '1px solid transparent',
              background: 'transparent',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--obsidian-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <UserAvatar avatar={avatar} initials={initials} size={26} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: '9px', color: 'var(--cream-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Sparkles size={8} color="var(--amber)" /> Free plan
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: '56px', left: '10px', right: '10px',
              background: 'var(--obsidian-3)', border: '1px solid var(--border-light)',
              borderRadius: '12px', padding: '6px',
              animation: 'fadeUp 0.2s var(--ease-spring)',
              zIndex: 20,
            }}>
              <button
                onClick={() => { setShowUserMenu(false); onSignOut(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 10px', borderRadius: '8px',
                  fontSize: '12px', color: 'var(--coral)', fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--coral-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={13} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {view === 'calendar' ? (
          <>
            {/* View switcher bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--obsidian-2)', flexShrink: 0,
            }}>
              {/* Prev / Today / Next */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <NavBtn onClick={handlePrevNav}><ChevronLeft size={13} /></NavBtn>
                <button
                  onClick={handleToday}
                  style={{
                    padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 500,
                    color: 'var(--cream-muted)', border: '1px solid var(--border)',
                    background: 'transparent', transition: 'all 0.2s var(--ease-spring)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber-glow)'; e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.borderColor = 'var(--amber-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  Hoy
                </button>
                <NavBtn onClick={handleNextNav}><ChevronRight size={13} /></NavBtn>
              </div>

              {/* Month/Week/Day segmented control */}
              <div style={{
                display: 'flex', background: 'var(--obsidian-4)',
                borderRadius: '10px', padding: '3px', gap: '2px',
              }}>
                {[['month', 'Mes'], ['week', 'Semana'], ['day', 'Día']].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setCalView(id)}
                    style={{
                      padding: '5px 14px', borderRadius: '8px',
                      fontSize: '11px', fontWeight: calView === id ? 600 : 400,
                      color: calView === id ? 'var(--amber)' : 'var(--cream-muted)',
                      background: calView === id ? 'var(--amber-glow)' : 'transparent',
                      border: calView === id ? '1px solid var(--amber-dim)' : '1px solid transparent',
                      transition: 'all 0.2s var(--ease-spring)',
                    }}
                    onMouseEnter={e => { if (calView !== id) { e.currentTarget.style.color = 'var(--cream)'; e.currentTarget.style.background = 'var(--obsidian-3)'; } }}
                    onMouseLeave={e => { if (calView !== id) { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Spacer para centrar el segmented control */}
              <div style={{ width: '100px' }} />
            </div>

            {/* Calendar content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {calView === 'month' && (
                <>
                  <BigCalendar
                    viewMonth={viewMonth}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    tasks={tasks}
                    expenses={expenses}
                  />
                  {selectedDate && (
                    <DayPanel
                      key={format(selectedDate, 'yyyy-MM-dd')}
                      date={selectedDate}
                      tasks={tasks}
                      expenses={expenses}
                      onAddTask={addTask}
                      onToggleTask={toggleTask}
                      onDeleteTask={removeTask}
                      onEditTask={editTask}
                      onAddExpense={addExpense}
                      onDeleteExpense={removeExpense}
                      onEditExpense={editExpense}
                      onClose={() => setSelectedDate(null)}
                    />
                  )}
                </>
              )}

              {calView === 'week' && (
                <>
                  <WeekView
                    weekStart={viewWeek}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    tasks={tasks}
                    expenses={expenses}
                  />
                  {selectedDate && (
                    <DayPanel
                      key={format(selectedDate, 'yyyy-MM-dd')}
                      date={selectedDate}
                      tasks={tasks}
                      expenses={expenses}
                      onAddTask={addTask}
                      onToggleTask={toggleTask}
                      onDeleteTask={removeTask}
                      onEditTask={editTask}
                      onAddExpense={addExpense}
                      onDeleteExpense={removeExpense}
                      onEditExpense={editExpense}
                      onClose={() => setSelectedDate(null)}
                    />
                  )}
                </>
              )}

              {calView === 'day' && (
                <DayView
                  key={format(selectedDate || new Date(), 'yyyy-MM-dd')}
                  date={selectedDate || new Date()}
                  tasks={tasks}
                  expenses={expenses}
                  onAddTask={addTask}
                  onToggleTask={toggleTask}
                  onDeleteTask={removeTask}
                  onEditTask={editTask}
                  onAddExpense={addExpense}
                  onDeleteExpense={removeExpense}
                  onEditExpense={editExpense}
                  onPrevDay={handlePrevNav}
                  onNextDay={handleNextNav}
                />
              )}
            </div>
          </>
        ) : (
          <div key={viewKey} className="animate-viewIn" style={{ flex: 1, overflow: 'auto', padding: '40px 48px' }}>
            {view === 'monthly'  && <MonthlyReport expenses={expenses} />}
            {view === 'settings' && <Settings user={user} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'var(--obsidian)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: 'linear-gradient(135deg, var(--amber), var(--amber-dim))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'float 1.2s ease-in-out infinite',
        boxShadow: '0 0 30px rgba(240,165,0,0.3)',
      }}>
        <Calendar size={20} color="var(--obsidian)" />
      </div>
    </div>
  );
}

function NavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream-muted)', transition: 'all 0.2s var(--ease-spring)', background: 'transparent' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-glow)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}

function StatRow({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 8px', borderRadius: '8px',
      background: 'var(--obsidian-3)', border: '1px solid var(--border)',
      transition: 'all 0.2s var(--ease-spring)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}44`; e.currentTarget.style.transform = 'scale(1.02)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Icon size={10} color={color} />
        <span style={{ fontSize: '10px', color: 'var(--cream-muted)' }}>{label}</span>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</span>
    </div>
  );
}

function UserAvatar({ avatar, initials, size = 26 }) {
  const [imgError, setImgError] = useState(false);
  const showImg = avatar && !imgError;

  return showImg ? (
    <img
      src={avatar}
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
      style={{ width: size, height: size, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '8px', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--amber-dim), #8B5E00)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38 + 'px', fontWeight: 700,
      color: 'var(--obsidian)',
      fontFamily: 'var(--font-body)',
      letterSpacing: '-0.02em',
      userSelect: 'none',
    }}>
      {initials || <User size={size * 0.5} color="var(--obsidian)" />}
    </div>
  );
}

const bannerStyle = {
  position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
  background: 'var(--obsidian-3)', border: '1px solid var(--border-light)',
  borderRadius: '12px', padding: '12px 20px',
  display: 'flex', alignItems: 'center', gap: '12px',
  zIndex: 100, animation: 'fadeUp 0.3s var(--ease-spring)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};
