import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const EXPENSE_CATS = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Hogar', 'Ropa', 'Tecnología', 'Otro'];
const INCOME_CATS = ['Salario', 'Freelance', 'Inversión', 'Regalo', 'Otro'];

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

export default function DayFinance({ selectedDate, expenses, onExpensesChange }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATS[0]);
  const [showForm, setShowForm] = useState(false);

  const dayItems = expenses.filter(e => isSameDay(new Date(e.date), selectedDate));
  const dayIncome = dayItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const dayExpense = dayItems.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = dayIncome - dayExpense;

  const add = () => {
    const n = parseFloat(amount);
    if (!n || !desc.trim()) return;
    onExpensesChange([...expenses, {
      id: Date.now(),
      type,
      amount: n,
      desc: desc.trim(),
      category,
      date: selectedDate.toISOString(),
    }]);
    setAmount('');
    setDesc('');
    setShowForm(false);
  };

  const del = (id) => onExpensesChange(expenses.filter(e => e.id !== id));

  return (
    <div style={{ animation: 'scaleIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            Finanzas del día
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cream-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '10px',
            background: showForm ? 'var(--obsidian-4)' : 'var(--amber)',
            color: showForm ? 'var(--cream)' : 'var(--obsidian)',
            fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
          }}
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Ingresos', value: dayIncome, icon: TrendingUp, color: 'var(--sage)', bg: 'var(--sage-dim)' },
          { label: 'Gastos', value: dayExpense, icon: TrendingDown, color: 'var(--coral)', bg: 'var(--coral-dim)' },
          { label: 'Balance', value: balance, icon: Wallet, color: balance >= 0 ? 'var(--amber)' : 'var(--coral)', bg: balance >= 0 ? 'var(--amber-glow)' : 'var(--coral-dim)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            background: bg,
            border: `1px solid ${color}33`,
            borderRadius: '14px',
            padding: '16px',
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={color} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--cream-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color, letterSpacing: '-0.02em' }}>
              {value < 0 ? '-' : ''}{fmt(Math.abs(value))}
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--obsidian-3)',
          border: '1px solid var(--border-light)',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          animation: 'fadeUp 0.25s ease',
        }}>
          {/* Tipo toggle */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'var(--obsidian-4)', borderRadius: '10px', padding: '4px' }}>
            {[['expense', 'Gasto', 'var(--coral)'], ['income', 'Ingreso', 'var(--sage)']].map(([key, label, color]) => (
              <button
                key={key}
                onClick={() => { setType(key); setCategory(key === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 600,
                  background: type === key ? 'var(--obsidian-2)' : 'transparent',
                  color: type === key ? color : 'var(--cream-muted)',
                  border: type === key ? `1px solid ${color}44` : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >{label}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Monto"
              type="number"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              {(type === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Descripción"
              style={{ ...inputStyle, flex: 1 }}
              onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
            />
            <button onClick={add} style={{
              padding: '10px 20px', borderRadius: '10px',
              background: type === 'income' ? 'var(--sage)' : 'var(--coral)',
              color: 'var(--obsidian)', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
            }}>
              {type === 'income' ? '+ Ingreso' : '- Gasto'}
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {dayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--cream-muted)', fontSize: '13px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', opacity: 0.3, marginBottom: '8px' }}>₱</div>
            Sin movimientos para este día
          </div>
        ) : (
          [...dayItems].reverse().map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                background: 'var(--obsidian-3)',
                border: `1px solid ${item.type === 'income' ? 'var(--sage)33' : 'var(--coral)33'}`,
                animation: `fadeUp 0.2s ease ${i * 0.04}s both`,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = item.type === 'income' ? 'var(--sage)88' : 'var(--coral)88'}
              onMouseLeave={e => e.currentTarget.style.borderColor = item.type === 'income' ? 'var(--sage)33' : 'var(--coral)33'}
            >
              {/* Icon */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: item.type === 'income' ? 'var(--sage-dim)' : 'var(--coral-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.type === 'income'
                  ? <TrendingUp size={16} color="var(--sage)" />
                  : <TrendingDown size={16} color="var(--coral)" />
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 500 }}>{item.desc}</div>
                <div style={{ fontSize: '10px', color: 'var(--cream-muted)', marginTop: '2px', letterSpacing: '0.05em' }}>{item.category}</div>
              </div>

              {/* Amount */}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 700,
                color: item.type === 'income' ? 'var(--sage)' : 'var(--coral)',
                letterSpacing: '-0.01em',
                flexShrink: 0,
              }}>
                {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
              </div>

              {/* Delete */}
              <button
                onClick={() => del(item.id)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--cream-muted)', transition: 'all 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-dim)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--obsidian-4)',
  border: '1px solid var(--border-light)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--cream)',
  outline: 'none',
  transition: 'border-color 0.2s',
};
