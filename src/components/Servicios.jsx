import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus, Trash2, Pencil, ExternalLink, Copy, Check,
  Zap, Flame, Droplets, Wifi, Phone, Shield, Tv, Building2, Receipt,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useIsMobile } from '../hooks/useIsMobile.js';

// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS = [
  { icon: '⚡', label: 'Electricidad', color: '#F0A500', cat: 'utilities' },
  { icon: '🔥', label: 'Gas',          color: '#E05C5C', cat: 'utilities' },
  { icon: '💧', label: 'Agua',         color: '#6B8FD4', cat: 'utilities' },
  { icon: '📶', label: 'Internet',     color: '#5FAD8E', cat: 'utilities' },
  { icon: '📱', label: 'Celular',      color: '#4ECDC4', cat: 'utilities' },
  { icon: '🏛️', label: 'ABL / Municipal', color: '#A47BD4', cat: 'taxes' },
  { icon: '📋', label: 'ARBA / Provincial', color: '#A47BD4', cat: 'taxes' },
  { icon: '🛡️', label: 'Seguro',       color: '#E8925A', cat: 'insurance' },
  { icon: '📺', label: 'Streaming',    color: '#E05C5C', cat: 'subscription' },
  { icon: '🏋️', label: 'Gimnasio',     color: '#5FAD8E', cat: 'subscription' },
];

const CAT_LABELS = {
  utilities:    { label: 'Servicios',    color: '#6B8FD4', dim: 'rgba(107,143,212,0.12)' },
  taxes:        { label: 'Impuestos',    color: '#A47BD4', dim: 'rgba(164,123,212,0.12)' },
  insurance:    { label: 'Seguros',      color: '#E8925A', dim: 'rgba(232,146,90,0.12)' },
  subscription: { label: 'Suscripciones', color: '#5FAD8E', dim: 'rgba(95,173,142,0.12)' },
};

const inputSt = {
  width: '100%', background: 'var(--obsidian-4)',
  border: '1px solid var(--border-light)', borderRadius: '10px',
  padding: '10px 14px', fontSize: '13px', color: 'var(--cream)',
  outline: 'none', transition: 'border-color 0.2s ease',
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function thisMonth() { return format(new Date(), 'yyyy-MM'); }
function fmtMoney(n) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n); }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Servicios({ onAddExpense }) {
  const isMobile = useIsMobile();
  const [services, setServices] = useLocalStorage('services', []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ name: '', icon: '⚡', color: '#F0A500', accountId: '', website: '', cat: 'utilities', notes: '' });
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate]   = useState(format(new Date(), 'yyyy-MM-dd'));
  const [copied, setCopied]     = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const resetForm = () => { setForm({ name: '', icon: '⚡', color: '#F0A500', accountId: '', website: '', cat: 'utilities', notes: '' }); setShowForm(false); setEditId(null); };

  const saveService = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setServices(prev => prev.map(s => s.id === editId ? { ...s, ...form } : s));
      setEditId(null);
    } else {
      setServices(prev => [...prev, { id: uid(), ...form, payments: [] }]);
    }
    resetForm();
  };

  const startEdit = (s) => {
    setForm({ name: s.name, icon: s.icon, color: s.color, accountId: s.accountId || '', website: s.website || '', cat: s.cat, notes: s.notes || '' });
    setEditId(s.id); setShowForm(true);
  };

  const deleteService = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setServices(prev => prev.filter(s => s.id !== id));
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const copyId = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const openPayment = (id) => {
    const svc = services.find(s => s.id === id);
    const last = svc?.payments?.slice().sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
    setPayAmount(last?.amount ? String(last.amount) : '');
    setPayDate(format(new Date(), 'yyyy-MM-dd'));
    setPayingId(id);
  };

  const confirmPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || !payingId) return;
    const svc = services.find(s => s.id === payingId);
    if (!svc) return;

    const payment = { id: uid(), month: thisMonth(), amount, date: payDate, paidAt: new Date().toISOString() };

    setServices(prev => prev.map(s => s.id === payingId
      ? { ...s, payments: [...(s.payments || []), payment] }
      : s
    ));

    // Register expense in finance system
    if (onAddExpense) {
      await onAddExpense({
        type: 'expense',
        amount,
        desc: svc.name,
        category: 'Servicios',
        date: payDate,
      });
    }

    setPayingId(null); setPayAmount('');
  };

  const getMonthStatus = (svc) => {
    const month = thisMonth();
    const paid  = svc.payments?.find(p => p.month === month);
    return paid || null;
  };

  // Group by category
  const grouped = Object.entries(CAT_LABELS).map(([catId, catMeta]) => ({
    catId, ...catMeta,
    items: services.filter(s => s.cat === catId),
  })).filter(g => g.items.length > 0);

  const pendingCount  = services.filter(s => !getMonthStatus(s)).length;
  const totalMonthly  = services.reduce((sum, s) => {
    const pay = s.payments?.filter(p => p.month === thisMonth()).reduce((a, b) => a + b.amount, 0) || 0;
    return sum + pay;
  }, 0);

  return (
    <div className="animate-viewIn" style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', animation: 'fadeDown 0.35s var(--ease-out) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #A47BD4, #7A4DBF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(164,123,212,0.3)',
            animation: 'float 3.5s ease-in-out infinite',
          }}>
            <Receipt size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Servicios
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--cream-muted)', marginTop: '3px' }}>
              {pendingCount > 0
                ? <span style={{ color: '#F0A500' }}>⚠ {pendingCount} pendiente{pendingCount > 1 ? 's' : ''} este mes</span>
                : services.length > 0 ? <span style={{ color: 'var(--sage)' }}>✓ Todo al día este mes</span> : 'Sin servicios'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            borderRadius: '10px', fontSize: '12px', fontWeight: 600,
            background: showForm ? 'rgba(164,123,212,0.12)' : 'var(--obsidian-3)',
            border: `1px solid ${showForm ? '#A47BD4' : 'var(--border)'}`,
            color: showForm ? '#A47BD4' : 'var(--cream)',
            transition: 'all 0.2s var(--ease-spring)',
          }}
        >
          <Plus size={13} style={{ transform: showForm ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s var(--ease-spring)' }} />
          Agregar
        </button>
      </div>

      {/* Month summary bar */}
      {services.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px',
          marginBottom: '24px', animation: 'fadeUp 0.3s var(--ease-spring) 0.05s both',
        }}>
          {[
            { label: 'Servicios', value: services.length, color: 'var(--cream)', sub: 'registrados' },
            { label: 'Pagados', value: services.length - pendingCount, color: 'var(--sage)', sub: 'este mes' },
            { label: 'Gastado', value: fmtMoney(totalMonthly), color: 'var(--coral)', sub: 'este mes' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--obsidian-3)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cream-muted)', fontWeight: 600, marginBottom: '6px' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color, letterSpacing: '-0.01em' }}>{value}</div>
              <div style={{ fontSize: '9px', color: 'var(--cream-muted)', marginTop: '2px' }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="form-spring" style={{
          background: 'var(--obsidian-3)', border: '1px solid var(--border-light)',
          borderRadius: '16px', padding: '20px', marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {/* Presets */}
          {!editId && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--cream-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Plantillas rápidas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => setForm(f => ({ ...f, name: p.label, icon: p.icon, color: p.color, cat: p.cat }))}
                    style={{
                      padding: '5px 10px', borderRadius: '8px', fontSize: '11px',
                      border: `1px solid ${form.name === p.label ? p.color : 'var(--border)'}`,
                      background: form.name === p.label ? `${p.color}18` : 'transparent',
                      color: form.name === p.label ? p.color : 'var(--cream-muted)',
                      transition: 'all 0.15s ease',
                    }}>
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del servicio" style={inputSt}
              onFocus={e => e.target.style.borderColor = '#A47BD4'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
            <input value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              placeholder="ID de cliente / N° de cuenta" style={inputSt}
              onFocus={e => e.target.style.borderColor = '#A47BD4'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="Sitio web (ej: https://edesur.com.ar)" style={inputSt}
              onFocus={e => e.target.style.borderColor = '#A47BD4'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
          </div>

          {/* Category */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {Object.entries(CAT_LABELS).map(([catId, meta]) => (
              <button key={catId} onClick={() => setForm(f => ({ ...f, cat: catId }))} style={{
                flex: 1, padding: '7px 4px', borderRadius: '9px', fontSize: '10px', fontWeight: 600,
                border: `1px solid ${form.cat === catId ? meta.color : 'var(--border)'}`,
                background: form.cat === catId ? meta.dim : 'transparent',
                color: form.cat === catId ? meta.color : 'var(--cream-muted)',
                transition: 'all 0.18s var(--ease-spring)',
              }}>{meta.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveService} style={{
              flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
              background: '#A47BD4', color: 'white',
              boxShadow: '0 4px 14px rgba(164,123,212,0.35)',
              transition: 'all 0.2s var(--ease-spring)',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >{editId ? 'Guardar cambios' : 'Agregar servicio'}</button>
            <button onClick={resetForm} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--cream-muted)', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payingId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          animation: 'fadeIn 0.2s ease both',
        }} onClick={() => setPayingId(null)}>
          <div onClick={e => e.stopPropagation()} className="form-spring" style={{
            background: 'var(--obsidian-2)', border: '1px solid var(--border-light)',
            borderRadius: isMobile ? '16px' : '20px', padding: isMobile ? '20px' : '28px', width: isMobile ? 'calc(100vw - 32px)' : '340px', maxWidth: '340px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
              Registrar pago
            </div>
            <div style={{ fontSize: '12px', color: 'var(--cream-muted)', marginBottom: '20px' }}>
              {services.find(s => s.id === payingId)?.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--cream-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monto</label>
                <input autoFocus type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmPayment()}
                  placeholder="$ 0"
                  style={{ ...inputSt, fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--sage)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--sage)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--cream-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fecha</label>
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                  style={inputSt}
                  onFocus={e => e.target.style.borderColor = 'var(--sage)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--cream-muted)', marginBottom: '18px', lineHeight: 1.5, padding: '10px 14px', background: 'var(--obsidian-4)', borderRadius: '9px', border: '1px solid var(--border)' }}>
              💡 Esto registrará el pago aquí <strong style={{ color: 'var(--cream)' }}>y también</strong> lo agregará como gasto en tu sección de finanzas.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={confirmPayment} style={{
                flex: 1, padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                background: 'var(--sage)', color: 'white',
                boxShadow: '0 4px 14px rgba(95,173,142,0.35)',
                transition: 'all 0.2s var(--ease-spring)',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >✓ Confirmar pago</button>
              <button onClick={() => setPayingId(null)} style={{ padding: '11px 16px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--cream-muted)', fontSize: '12px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {services.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', animation: 'fadeIn 0.4s ease both' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🧾</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--cream-dim)', marginBottom: '8px' }}>Sin servicios registrados</div>
          <p style={{ fontSize: '12px', color: 'var(--cream-muted)' }}>Agregá tus servicios e impuestos para llevar el control de los pagos mensuales</p>
        </div>
      )}

      {/* Grouped service cards */}
      {grouped.map(group => (
        <div key={group.catId} style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: group.color,
            }}>{group.label}</span>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '6px',
              background: group.dim, color: group.color,
            }}>{group.items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {group.items.map((svc, i) => {
              const paid   = getMonthStatus(svc);
              const lastPayments = (svc.payments || []).slice().sort((a, b) => b.paidAt.localeCompare(a.paidAt));
              return (
                <ServiceCard
                  key={svc.id}
                  svc={svc} i={i} paid={paid} lastPayments={lastPayments}
                  isDeleting={deletingIds.has(svc.id)}
                  copied={copied}
                  onPay={openPayment}
                  onEdit={startEdit}
                  onDelete={deleteService}
                  onCopy={copyId}
                  isMobile={isMobile}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({ svc, i, paid, lastPayments, isDeleting, copied, onPay, onEdit, onDelete, onCopy, isMobile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={isDeleting ? 'item-out' : ''}
      style={{
        borderRadius: '14px', overflow: 'hidden',
        background: 'var(--obsidian-3)',
        border: `1px solid ${paid ? 'rgba(95,173,142,0.3)' : 'var(--border)'}`,
        animation: `fadeUp 0.3s var(--ease-spring) ${i * 0.06}s both`,
        transition: 'border-color 0.2s ease, transform 0.2s var(--ease-spring)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '10px' : '12px', padding: isMobile ? '12px' : '14px 16px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        {/* Icon */}
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
          background: `${svc.color}18`, border: `1px solid ${svc.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>
          {svc.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{svc.name}</span>
            {/* Status chip */}
            {paid ? (
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                background: 'rgba(95,173,142,0.15)', color: 'var(--sage)', border: '1px solid rgba(95,173,142,0.3)',
                display: 'flex', alignItems: 'center', gap: '3px',
              }}>
                <Check size={8} strokeWidth={3} /> Pagado {format(new Date(paid.date + 'T12:00:00'), "d MMM", { locale: es })}
              </span>
            ) : (
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                background: 'rgba(240,165,0,0.12)', color: '#F0A500', border: '1px solid rgba(240,165,0,0.3)',
              }}>
                Pendiente
              </span>
            )}
          </div>
          {svc.accountId && (
            <div style={{ fontSize: '11px', color: 'var(--cream-muted)', fontFamily: 'monospace' }}>
              ID: {svc.accountId}
            </div>
          )}
        </div>

        {/* Amount if paid */}
        {paid && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--sage)', flexShrink: 0 }}>
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(paid.amount)}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {!paid && (
            <button onClick={() => onPay(svc.id)} style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
              background: 'var(--sage)', color: 'white',
              transition: 'all 0.2s var(--ease-spring)',
              boxShadow: '0 2px 10px rgba(95,173,142,0.3)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(95,173,142,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(95,173,142,0.3)'; }}
            >
              Pagar
            </button>
          )}
          {paid && (
            <button onClick={() => onPay(svc.id)} style={{
              padding: '5px 10px', borderRadius: '8px', fontSize: '10px',
              border: '1px solid var(--border)', color: 'var(--cream-muted)',
              transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--cream)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--cream-muted)'; }}
            >
              + Otro pago
            </button>
          )}
          {svc.accountId && (
            <IconBtn onClick={() => onCopy(svc.id, svc.accountId)}>
              {copied === svc.id ? <Check size={12} color="var(--sage)" /> : <Copy size={12} />}
            </IconBtn>
          )}
          {svc.website && (
            <IconBtn onClick={() => window.open(svc.website, '_blank')}>
              <ExternalLink size={12} />
            </IconBtn>
          )}
          <IconBtn onClick={() => onEdit(svc)}><Pencil size={12} /></IconBtn>
          <IconBtn onClick={() => onDelete(svc.id)} danger><Trash2 size={12} /></IconBtn>
        </div>
      </div>

      {/* Payment history (last 3) */}
      {lastPayments.length > 1 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', background: 'var(--obsidian-4)' }}>
          <div style={{ fontSize: '9px', color: 'var(--cream-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>
            Historial
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {lastPayments.slice(0, 4).map(p => (
              <div key={p.id} style={{ fontSize: '10px', color: 'var(--cream-dim)' }}>
                <span style={{ color: 'var(--cream-muted)' }}>{p.month} · </span>
                <span style={{ fontWeight: 600, color: 'var(--sage)' }}>
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      width: '28px', height: '28px', borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--cream-muted)', flexShrink: 0,
      transition: 'all 0.15s var(--ease-spring)',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = danger ? 'var(--coral)' : 'var(--cream)'; e.currentTarget.style.background = danger ? 'var(--coral-dim)' : 'var(--obsidian-4)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}
