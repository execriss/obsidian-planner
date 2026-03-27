import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

const CAT_COLORS = {
  'Alimentación': '#F0A500',
  'Transporte': '#6B8FD4',
  'Salud': '#5FAD8E',
  'Entretenimiento': '#E05C5C',
  'Hogar': '#C48600',
  'Ropa': '#9B6EC8',
  'Tecnología': '#4ECDC4',
  'Otro': '#7A7060',
  'Salario': '#5FAD8E',
  'Freelance': '#6B8FD4',
  'Inversión': '#F0A500',
  'Regalo': '#E891A5',
};

export default function MonthlyReport({ expenses }) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const monthItems = expenses.filter(e => isSameMonth(new Date(e.date), viewMonth));
  const totalIncome = monthItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = monthItems.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;


  // Gastos por categoría
  const byCategory = useMemo(() => {
    const map = {};
    monthItems.filter(e => e.type === 'expense').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthItems]);

  // Ingresos por categoría
  const incomeByCategory = useMemo(() => {
    const map = {};
    monthItems.filter(e => e.type === 'income').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthItems]);

  // Daily balance for mini chart
  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const dailyData = days.map(day => {
    const dayItems = monthItems.filter(e => isSameDay(new Date(e.date), day));
    const inc = dayItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const exp = dayItems.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { day, inc, exp, net: inc - exp };
  });
  const maxVal = Math.max(...dailyData.map(d => Math.max(d.inc, d.exp)), 1);

  return (
    <div style={{ animation: 'scaleIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            Reporte Mensual
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cream-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>
            Resumen financiero · {monthItems.length} movimientos
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            style={navBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--cream)', minWidth: '140px', textAlign: 'center' }}>
            {format(viewMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            style={navBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Ingresos totales', value: totalIncome, icon: TrendingUp, color: 'var(--sage)', bg: 'var(--sage-dim)' },
          { label: 'Gastos totales', value: totalExpense, icon: TrendingDown, color: 'var(--coral)', bg: 'var(--coral-dim)' },
          { label: 'Balance neto', value: balance, icon: Wallet, color: balance >= 0 ? 'var(--amber)' : 'var(--coral)', bg: balance >= 0 ? 'var(--amber-glow)' : 'var(--coral-dim)' },
        ].map(({ label, value, icon: Icon, color, bg, isText }) => (
          <div key={label} style={{
            background: bg, border: `1px solid ${color}33`,
            borderRadius: '14px', padding: '18px',
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--cream-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, lineHeight: 1.3 }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: isText ? '28px' : '20px', fontWeight: 700, color, letterSpacing: '-0.02em' }}>
              {isText ? value : `${value < 0 ? '-' : ''}${fmt(Math.abs(value))}`}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div style={{
        background: 'var(--obsidian-3)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Flujo diario
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
          {dailyData.map(({ day, inc, exp }, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1px', justifyContent: 'flex-end', height: '100%' }}>
                {inc > 0 && (
                  <div style={{
                    width: '100%',
                    height: `${(inc / maxVal) * 70}px`,
                    background: 'var(--sage)',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.8,
                    minHeight: '2px',
                    transition: 'height 0.3s ease',
                  }} title={`Ingreso: ${fmt(inc)}`} />
                )}
                {exp > 0 && (
                  <div style={{
                    width: '100%',
                    height: `${(exp / maxVal) * 70}px`,
                    background: 'var(--coral)',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.7,
                    minHeight: '2px',
                    transition: 'height 0.3s ease',
                  }} title={`Gasto: ${fmt(exp)}`} />
                )}
                {inc === 0 && exp === 0 && (
                  <div style={{ width: '100%', height: '2px', background: 'var(--border)', borderRadius: '1px' }} />
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '9px', color: 'var(--cream-muted)' }}>1</span>
          <span style={{ fontSize: '9px', color: 'var(--cream-muted)' }}>{days.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          {[['Ingresos', 'var(--sage)'], ['Gastos', 'var(--coral)']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, opacity: 0.8 }} />
              <span style={{ fontSize: '11px', color: 'var(--cream-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          { title: 'Gastos por categoría', data: byCategory, total: totalExpense, type: 'expense' },
          { title: 'Ingresos por categoría', data: incomeByCategory, total: totalIncome, type: 'income' },
        ].map(({ title, data, total, type }) => (
          <div key={type} style={{
            background: 'var(--obsidian-3)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
              {title}
            </div>
            {data.length === 0 ? (
              <div style={{ color: 'var(--cream-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                Sin datos
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.map(([cat, amount]) => {
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  const color = CAT_COLORS[cat] || 'var(--cream-muted)';
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--cream-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                          {cat}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--cream-muted)' }}>{fmt(amount)}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: color,
                          borderRadius: '2px',
                          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                          opacity: 0.85,
                        }} />
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

const navBtnStyle = {
  width: '32px', height: '32px', borderRadius: '9px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--cream-muted)', transition: 'all 0.2s', background: 'transparent',
};
