import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, isSameMonth, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, subMonths, addMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './MonthlyReport.module.css';

const fmt = (n) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
}).format(n);

const CAT_COLORS = {
  'Alimentación': '#F0A500',
  'Transporte':   '#6B8FD4',
  'Salud':        '#5FAD8E',
  'Entretenimiento': '#E05C5C',
  'Hogar':        '#C48600',
  'Ropa':         '#9B6EC8',
  'Tecnología':   '#4ECDC4',
  'Otro':         '#7A7060',
  'Salario':      '#5FAD8E',
  'Freelance':    '#6B8FD4',
  'Inversión':    '#F0A500',
  'Regalo':       '#E891A5',
};

export default function MonthlyReport({ expenses, isMobile }) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const monthItems    = expenses.filter(e => isSameMonth(new Date(e.date), viewMonth));
  const totalIncome   = monthItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense  = monthItems.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance       = totalIncome - totalExpense;

  const byCategory = useMemo(() => {
    const map = {};
    monthItems.filter(e => e.type === 'expense').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthItems]);

  const incomeByCategory = useMemo(() => {
    const map = {};
    monthItems.filter(e => e.type === 'income').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthItems]);

  const days      = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const dailyData = days.map(day => {
    const dayItems = monthItems.filter(e => isSameDay(new Date(e.date), day));
    const inc = dayItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const exp = dayItems.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { day, inc, exp };
  });
  const maxVal = Math.max(...dailyData.map(d => Math.max(d.inc, d.exp)), 1);

  const summaryCards = [
    { label: 'Ingresos totales', value: totalIncome,  icon: TrendingUp,   color: 'var(--sage)',  bg: 'var(--sage-dim)',  variant: 'Sage'  },
    { label: 'Gastos totales',   value: totalExpense,  icon: TrendingDown, color: 'var(--coral)', bg: 'var(--coral-dim)', variant: 'Coral' },
    { label: 'Balance neto',     value: balance,       icon: Wallet,
      color: balance >= 0 ? 'var(--amber)' : 'var(--coral)',
      bg:    balance >= 0 ? 'var(--amber-glow)' : 'var(--coral-dim)',
      variant: balance >= 0 ? 'Amber' : 'Coral',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={`${styles.header} ${isMobile ? styles.headerMobile : ''}`}>
        <div>
          <div className={`${styles.reportTitle} ${isMobile ? styles.reportTitleMobile : ''}`}>
            Reporte Mensual
          </div>
          <div className={styles.reportSubtitle}>
            Resumen financiero · {monthItems.length} movimientos
          </div>
        </div>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
            <ChevronLeft size={16} />
          </button>
          <span className={styles.monthLabel}>
            {format(viewMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button className={styles.navBtn} onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`${styles.summaryGrid} ${isMobile ? styles.summaryGridMobile : ''}`}>
        {summaryCards.map(({ label, value, icon: Icon, color, bg, variant }) => (
          <div
            key={label}
            className={`${styles.summaryCard} ${styles[`summaryCard${variant}`]}`}
            style={{ '--card-bg': bg }}
          >
            <div className={styles.summaryCardHeader}>
              <div className={styles.summaryCardIcon}>
                <Icon size={15} color={color} />
              </div>
              <span className={styles.summaryCardLabel}>{label}</span>
            </div>
            <div className={styles.summaryCardValue}>
              {`${value < 0 ? '-' : ''}${fmt(Math.abs(value))}`}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div className={styles.chartPanel}>
        <div className={styles.chartTitle}>Flujo diario</div>
        <div className={styles.chartBars}>
          {dailyData.map(({ day, inc, exp }, i) => (
            <div key={i} className={styles.chartDay}>
              <div className={styles.chartDayInner}>
                {inc > 0 && (
                  <div
                    className={styles.barIncome}
                    style={{ height: `${(inc / maxVal) * 70}px` }}
                    title={`Ingreso: ${fmt(inc)}`}
                  />
                )}
                {exp > 0 && (
                  <div
                    className={styles.barExpense}
                    style={{ height: `${(exp / maxVal) * 70}px` }}
                    title={`Gasto: ${fmt(exp)}`}
                  />
                )}
                {inc === 0 && exp === 0 && <div className={styles.barEmpty} />}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.chartRange}>
          <span className={styles.chartRangeLabel}>1</span>
          <span className={styles.chartRangeLabel}>{days.length}</span>
        </div>
        <div className={styles.chartLegend}>
          {[['Ingresos', 'Income'], ['Gastos', 'Expense']].map(([label, variant]) => (
            <div key={label} className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles[`legendDot${variant}`]}`} />
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories breakdown */}
      <div className={`${styles.categoriesGrid} ${isMobile ? styles.categoriesGridMobile : ''}`}>
        {[
          { title: 'Gastos por categoría',  data: byCategory,        total: totalExpense, key: 'expense' },
          { title: 'Ingresos por categoría', data: incomeByCategory, total: totalIncome,  key: 'income'  },
        ].map(({ title, data, total, key }) => (
          <div key={key} className={styles.categoryPanel}>
            <div className={styles.categoryPanelTitle}>{title}</div>
            {data.length === 0 ? (
              <div className={styles.categoryEmpty}>Sin datos</div>
            ) : (
              <div className={styles.categoryList}>
                {data.map(([cat, amount]) => {
                  const pct   = total > 0 ? (amount / total) * 100 : 0;
                  const color = CAT_COLORS[cat] || 'var(--cream-muted)';
                  return (
                    <div key={cat}>
                      <div className={styles.categoryRow}>
                        <span className={styles.categoryName}>
                          <span className={styles.categoryDot} style={{ '--bar-color': color }} />
                          {cat}
                        </span>
                        <span className={styles.categoryAmount}>{fmt(amount)}</span>
                      </div>
                      <div className={styles.categoryBarTrack}>
                        <div
                          className={styles.categoryBarFill}
                          style={{ width: `${pct}%`, '--bar-color': color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
