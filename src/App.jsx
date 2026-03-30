import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, BarChart3, ChevronLeft, ChevronRight,
  Sparkles, CheckSquare, TrendingUp, TrendingDown, LogOut, User, Settings2,
  ShoppingCart, Receipt, Flame, StickyNote, FileKey2, X, Wallet,
} from 'lucide-react';
import { useIsMobile } from './hooks/useIsMobile.js';
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
import GroceryList from './components/GroceryList.jsx';
import Services from './components/Services.jsx';
import Habits from './components/Habits.jsx';
import QuickNotes from './components/QuickNotes.jsx';
import Documents from './components/Documents.jsx';
import Settings from './components/Settings.jsx';
import Budget from './components/Budget.jsx';
import styles from './App.module.css';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading) return <Loader />;
  if (!user) return <AuthGate />;
  return <Planner user={user} onSignOut={signOut} />;
}

function Planner({ user, onSignOut }) {
  const isMobile = useIsMobile();
  const [viewMonth, setViewMonth]       = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView]                 = useState('calendar');
  const [calView, setCalView]           = useState('month');
  const [viewWeek, setViewWeek]         = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewKey, setViewKey]           = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState('');
  const [sheetClosing, setSheetClosing] = useState(false);

  const {
    tasks, expenses, loading,
    addTask, toggleTask, removeTask, editTask,
    addExpense, removeExpense, editExpense,
    migrateFromLocalStorage,
  } = useData(user.id);

  useEffect(() => {
    if (loading) return;
    const hasLegacy = localStorage.getItem('obsidian_tasks') || localStorage.getItem('obsidian_expenses');
    if (hasLegacy && tasks.length === 0) setMigrationMsg('pending');
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
    if (isMobile) setShowUserMenu(false);
  };

  const handleCalViewChange = (v) => {
    if (isMobile && v === 'week') {
      setCalView('day');
      if (!selectedDate) setSelectedDate(new Date());
      return;
    }
    setCalView(v);
    if (v === 'day' && !selectedDate) setSelectedDate(new Date());
  };

  const closeMobileSheet = useCallback(() => {
    setSheetClosing(true);
    setTimeout(() => {
      setSelectedDate(null);
      setSheetClosing(false);
    }, 240);
  }, []);

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
  const monthIncome  = expenses.filter(e => e.type === 'income'   && isSameMonth(new Date(e.date), viewMonth)).reduce((s, e) => s + e.amount, 0);
  const monthExpense = expenses.filter(e => e.type === 'expense'  && isSameMonth(new Date(e.date), viewMonth)).reduce((s, e) => s + e.amount, 0);

  const fmtCompact = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, notation: 'compact' }).format(n);

  const avatar   = user.user_metadata?.avatar_url;
  const name     = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const NAV_ITEMS = [
    { id: 'calendar',  icon: Calendar,     label: 'Calendario', shortLabel: 'Inicio' },
    { id: 'monthly',   icon: BarChart3,     label: 'Reporte',   shortLabel: 'Reporte' },
    { id: 'budget',    icon: Wallet,        label: 'Presupuesto', shortLabel: 'Ppto.' },
    { id: 'grocery',   icon: ShoppingCart,  label: 'Compras',   shortLabel: 'Compras' },
    { id: 'servicios', icon: Receipt,       label: 'Servicios', shortLabel: 'Serv.' },
    { id: 'habitos',   icon: Flame,         label: 'Hábitos',   shortLabel: 'Hábitos' },
    { id: 'notas',     icon: StickyNote,    label: 'Notas',     shortLabel: 'Notas' },
    { id: 'docs',      icon: FileKey2,      label: 'Documentos',shortLabel: 'Docs' },
    { id: 'settings',  icon: Settings2,     label: 'Ajustes',   shortLabel: 'Ajustes' },
  ];

  const moreIds = ['notas', 'docs', 'settings'];
  const isMoreActive = moreIds.includes(view);

  return (
    <div className={isMobile ? styles.plannerRootMobile : styles.plannerRootDesktop}>
      {/* Ambient glow */}
      <div className={styles.ambientGlow} />

      {/* Migration banners */}
      {migrationMsg === 'pending' && (
        <div className={isMobile ? styles.bannerPendingMobile : styles.bannerPending}>
          <span className={isMobile ? styles.bannerTextMobile : styles.bannerText}>
            Tenés datos guardados localmente.
          </span>
          <button onClick={handleMigrate} className={styles.bannerImportBtn}>
            Importar
          </button>
          <button onClick={() => setMigrationMsg('')} className={styles.bannerCloseBtn}>×</button>
        </div>
      )}
      {migrationMsg === 'loading' && (
        <div className={styles.banner}>
          <span className={styles.bannerLoadingText}>Importando datos...</span>
        </div>
      )}
      {migrationMsg.startsWith('done:') && (
        <div className={styles.bannerDone}>
          <span className={styles.bannerSuccessText}>
            ✓ {migrationMsg.split(':')[1]} registros importados correctamente
          </span>
        </div>
      )}

      {/* ── SIDEBAR (desktop only) ── */}
      {!isMobile && (
        <aside className={styles.sidebar}>
          {/* Logo */}
          <div className={styles.sidebarLogo}>
            <div className={styles.sidebarLogoRow}>
              <div className={styles.sidebarLogoIcon}>
                <Calendar size={15} color="var(--obsidian)" />
              </div>
              <div>
                <div className={styles.sidebarBrandName}>Obsidian</div>
                <div className={styles.sidebarBrandSub}>Planner</div>
              </div>
            </div>
          </div>

          {/* Month navigator */}
          <div className={styles.monthNav}>
            <div className={styles.monthNavRow}>
              <NavBtn onClick={() => changeMonth('prev')}><ChevronLeft size={13} /></NavBtn>
              <div className={styles.monthNavCenter}>
                <div className={styles.monthLabel}>
                  {format(viewMonth, 'MMMM', { locale: es })}
                </div>
                <div className={styles.yearLabel}>{format(viewMonth, 'yyyy')}</div>
              </div>
              <NavBtn onClick={() => changeMonth('next')}><ChevronRight size={13} /></NavBtn>
            </div>
            <button
              onClick={() => { setViewMonth(new Date()); setSelectedDate(new Date()); }}
              className={styles.todayBtn}
            >
              Hoy
            </button>
          </div>

          {/* Nav items */}
          <div className={styles.navSection}>
            <div className={styles.navSectionLabel}>Vista</div>
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => changeView(id)}
                className={view === id ? styles.navItemActive : styles.navItem}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className={styles.statsSection}>
            <div className={styles.statsLabel}>
              {format(viewMonth, 'MMM yyyy', { locale: es })}
            </div>
            <div className={styles.statsGrid}>
              {pendingToday > 0 && <StatRow icon={CheckSquare} label="Pendientes" value={pendingToday} color="var(--amber)" />}
              {monthIncome  > 0 && <StatRow icon={TrendingUp}  label="Ingresos"   value={fmtCompact(monthIncome)}  color="var(--sage)" />}
              {monthExpense > 0 && <StatRow icon={TrendingDown} label="Gastos"     value={fmtCompact(monthExpense)} color="var(--coral)" />}
            </div>
          </div>

          {/* User */}
          <div className={styles.userSection}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={styles.userBtn}
            >
              <UserAvatar avatar={avatar} initials={initials} size={26} />
              <div className={styles.userInfo}>
                <div className={styles.userName}>{name}</div>
                <div className={styles.userPlan}>
                  <Sparkles size={8} color="var(--amber)" /> Free plan
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className={styles.userMenu}>
                <button
                  onClick={() => { setShowUserMenu(false); onSignOut(); }}
                  className={styles.logoutBtn}
                >
                  <LogOut size={13} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── MAIN ── */}
      <div className={isMobile ? styles.mainMobile : styles.main}>
        {view === 'calendar' ? (
          <>
            {/* View switcher bar */}
            <div className={isMobile ? styles.toolbarMobile : styles.toolbarDesktop}>
              <div className={styles.toolbarNav}>
                <NavBtn onClick={handlePrevNav}><ChevronLeft size={13} /></NavBtn>
                <button
                  onClick={handleToday}
                  className={isMobile ? styles.toolbarTodayBtnMobile : styles.toolbarTodayBtnDesktop}
                >
                  Hoy
                </button>
                <NavBtn onClick={handleNextNav}><ChevronRight size={13} /></NavBtn>
              </div>

              {isMobile && (
                <div className={styles.mobileMonthLabel}>
                  {format(viewMonth, 'MMM yyyy', { locale: es })}
                </div>
              )}

              <div className={styles.segmentedControl}>
                {(isMobile
                  ? [['month', 'Mes'], ['day', 'Día']]
                  : [['month', 'Mes'], ['week', 'Semana'], ['day', 'Día']]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => handleCalViewChange(id)}
                    className={`${isMobile ? styles.segmentBtnMobile : styles.segmentBtnDesktop} ${calView === id ? styles.segmentBtnActive : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {!isMobile && <div className={styles.toolbarSpacer} />}
            </div>

            {/* Calendar content */}
            <div className={styles.calendarContent}>
              {calView === 'month' && (
                <>
                  <BigCalendar
                    viewMonth={viewMonth}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    tasks={tasks}
                    expenses={expenses}
                    isMobile={isMobile}
                  />
                  {selectedDate && !isMobile && (
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
                  {selectedDate && isMobile && (
                    <>
                      <div className="bottom-sheet-backdrop" onClick={closeMobileSheet} />
                      <div className={`bottom-sheet ${sheetClosing ? 'bottom-sheet-closing' : ''}`}>
                        <div className="bottom-sheet-handle" />
                        <div className={styles.sheetHeader}>
                          <div className={styles.sheetTitle}>
                            {format(selectedDate, "d 'de' MMMM", { locale: es })}
                          </div>
                          <button onClick={closeMobileSheet} className={styles.sheetCloseBtn}>
                            <X size={15} />
                          </button>
                        </div>
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
                          onClose={closeMobileSheet}
                          isModal
                        />
                      </div>
                    </>
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
                  isMobile={isMobile}
                />
              )}
            </div>
          </>
        ) : (
          <div
            key={viewKey}
            className={`animate-viewIn ${isMobile ? styles.viewContainerMobile : styles.viewContainerDesktop}`}
          >
            {view === 'monthly'   && <MonthlyReport expenses={expenses} isMobile={isMobile} />}
            {view === 'budget'    && <Budget userId={user.id} viewMonth={viewMonth} />}
            {view === 'grocery'   && <GroceryList userId={user.id} />}
            {view === 'servicios' && <Services onAddExpense={addExpense} userId={user.id} />}
            {view === 'habitos'   && <Habits userId={user.id} />}
            {view === 'notas'     && <QuickNotes userId={user.id} />}
            {view === 'docs'      && <Documents userId={user.id} />}
            {view === 'settings'  && <Settings user={user} />}
          </div>
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {NAV_ITEMS.slice(0, 5).map(({ id, icon: Icon, shortLabel }) => (
            <button
              key={id}
              onClick={() => changeView(id)}
              className={view === id ? styles.mobileNavItemActive : styles.mobileNavItemInactive}
            >
              <Icon size={18} />
              <span>{shortLabel}</span>
            </button>
          ))}
          {/* More menu */}
          <div className={styles.mobileMoreWrapper}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={isMoreActive ? styles.mobileMoreBtnActive : styles.mobileMoreBtnInactive}
            >
              <Settings2 size={18} />
              <span>Más</span>
            </button>
            {showUserMenu && (
              <>
                <div className={styles.mobileMenuOverlay} onClick={() => setShowUserMenu(false)} />
                <div className={styles.mobileMenuPopup}>
                  {NAV_ITEMS.filter(n => moreIds.includes(n.id)).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => { changeView(id); setShowUserMenu(false); }}
                      className={view === id ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                  <div className={styles.mobileMenuDivider} />
                  <button
                    onClick={() => { setShowUserMenu(false); onSignOut(); }}
                    className={styles.mobileLogoutBtn}
                  >
                    <LogOut size={13} /> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className={styles.loaderPage}>
      <div className={styles.loaderIcon}>
        <Calendar size={20} color="var(--obsidian)" />
      </div>
    </div>
  );
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────

function NavBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className={styles.navBtn}>
      {children}
    </button>
  );
}

// ─── StatRow ──────────────────────────────────────────────────────────────────

function StatRow({ icon: Icon, label, value, color }) {
  return (
    <div className={styles.statRow} style={{ '--accent-color': color }}>
      <div className={styles.statRowLeft}>
        <Icon size={10} color={color} />
        <span className={styles.statRowLabel}>{label}</span>
      </div>
      <span className={styles.statRowValue}>{value}</span>
    </div>
  );
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────

function UserAvatar({ avatar, initials, size = 26 }) {
  const [imgError, setImgError] = useState(false);
  const showImg = avatar && !imgError;

  return showImg ? (
    <img
      src={avatar}
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
      className={styles.avatarImg}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={styles.avatarFallback}
      style={{ width: size, height: size, fontSize: `${size * 0.38}px` }}
    >
      {initials || <User size={size * 0.5} color="var(--obsidian)" />}
    </div>
  );
}
