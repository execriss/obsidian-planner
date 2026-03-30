import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus, Trash2, Pencil, ExternalLink, Copy, Check,
  Receipt,
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { useServices } from '../hooks/useServices.js';
import styles from './Services.module.css';
import SectionSkeleton from './SectionSkeleton.jsx';

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

function thisMonth() { return format(new Date(), 'yyyy-MM'); }
function fmtMoney(n) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n); }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Services({ onAddExpense, userId }) {
  const isMobile = useIsMobile();
  const { services, loading, addService, editService, removeService, addPayment } = useServices(userId);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ name: '', icon: '⚡', color: '#F0A500', accountId: '', website: '', cat: 'utilities', notes: '' });
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate]   = useState(format(new Date(), 'yyyy-MM-dd'));
  const [copied, setCopied]     = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const resetForm = () => {
    setForm({ name: '', icon: '⚡', color: '#F0A500', accountId: '', website: '', cat: 'utilities', notes: '' });
    setShowForm(false);
    setEditId(null);
  };

  const saveService = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await editService(editId, form);
      setEditId(null);
    } else {
      await addService({ ...form });
    }
    resetForm();
  };

  const startEdit = (s) => {
    setForm({ name: s.name, icon: s.icon, color: s.color, accountId: s.accountId || '', website: s.website || '', cat: s.cat, notes: s.notes || '' });
    setEditId(s.id);
    setShowForm(true);
  };

  const deleteService = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      removeService(id);
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

    await addPayment(payingId, { month: thisMonth(), amount, date: payDate });

    if (onAddExpense) {
      await onAddExpense({
        type: 'expense',
        amount,
        desc: svc.name,
        category: 'Servicios',
        date: payDate,
      });
    }

    setPayingId(null);
    setPayAmount('');
  };

  const getMonthStatus = (svc) => {
    const month = thisMonth();
    const paid  = svc.payments?.find(p => p.month === month);
    return paid || null;
  };

  const grouped = Object.entries(CAT_LABELS).map(([catId, catMeta]) => ({
    catId, ...catMeta,
    items: services.filter(s => s.cat === catId),
  })).filter(g => g.items.length > 0);

  const pendingCount = services.filter(s => !getMonthStatus(s)).length;
  const totalMonthly = services.reduce((sum, s) => {
    const pay = s.payments?.filter(p => p.month === thisMonth()).reduce((a, b) => a + b.amount, 0) || 0;
    return sum + pay;
  }, 0);

  if (loading) return <SectionSkeleton variant="services" />;

  return (
    <div className={`animate-viewIn ${styles.container}`}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Receipt size={18} color="white" />
          </div>
          <div>
            <h1 className={styles.title}>Servicios</h1>
            <p className={styles.subtitle}>
              {pendingCount > 0
                ? <span className={styles.pendingText}>⚠ {pendingCount} pendiente{pendingCount > 1 ? 's' : ''} este mes</span>
                : services.length > 0
                  ? <span className={styles.allGoodText}>✓ Todo al día este mes</span>
                  : 'Sin servicios'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className={`${styles.addBtn} ${showForm ? styles.addBtnActive : ''}`}
        >
          <Plus size={13} className={`${styles.addBtnIcon} ${showForm ? styles.addBtnIconRotated : ''}`} />
          Agregar
        </button>
      </div>

      {/* Month summary bar */}
      {services.length > 0 && (
        <div className={`${styles.summaryGrid} ${isMobile ? styles.summaryGridMobile : ''}`}>
          {[
            { label: 'Servicios', value: services.length,              color: 'var(--cream)',  sub: 'registrados' },
            { label: 'Pagados',   value: services.length - pendingCount, color: 'var(--sage)',   sub: 'este mes' },
            { label: 'Gastado',   value: fmtMoney(totalMonthly),        color: 'var(--coral)',  sub: 'este mes' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className={styles.summaryCard}>
              <div className={styles.summaryLabel}>{label}</div>
              <div className={styles.summaryValue} style={{ color }}>{value}</div>
              <div className={styles.summarySub}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className={`form-spring ${styles.form}`}>
          {!editId && (
            <div className={styles.presetsWrap}>
              <div className={styles.presetsLabel}>Plantillas rápidas</div>
              <div className={styles.presetsList}>
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setForm(f => ({ ...f, name: p.label, icon: p.icon, color: p.color, cat: p.cat }))}
                    className={`${styles.presetBtn} ${form.name === p.label ? styles.presetBtnActive : ''}`}
                    style={form.name === p.label ? { '--accent': p.color, '--accent-dim': `${p.color}18` } : {}}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`${styles.formRow} ${isMobile ? styles.formRowMobile : ''}`}>
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del servicio"
              className={styles.input}
            />
            <input
              value={form.accountId}
              onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
              placeholder="ID de cliente / N° de cuenta"
              className={styles.input}
            />
          </div>
          <div className={styles.formFieldWrap}>
            <input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="Sitio web (ej: https://edesur.com.ar)"
              className={styles.input}
            />
          </div>

          <div className={`${styles.catGrid} ${isMobile ? styles.catGridMobile : ''}`}>
            {Object.entries(CAT_LABELS).map(([catId, meta]) => (
              <button
                key={catId}
                onClick={() => setForm(f => ({ ...f, cat: catId }))}
                className={`${styles.catBtn} ${form.cat === catId ? styles.catBtnActive : ''}`}
                style={form.cat === catId ? { '--accent': meta.color, '--accent-dim': meta.dim } : {}}
              >
                {meta.label}
              </button>
            ))}
          </div>

          <div className={styles.formActions}>
            <button onClick={saveService} className={styles.submitBtn}>
              {editId ? 'Guardar cambios' : 'Agregar servicio'}
            </button>
            <button onClick={resetForm} className={styles.cancelBtn}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payingId && (
        <div className={styles.modalOverlay} onClick={() => setPayingId(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className={`form-spring ${styles.modalCard} ${isMobile ? styles.modalCardMobile : ''}`}
          >
            <div className={styles.modalTitle}>Registrar pago</div>
            <div className={styles.modalSubtitle}>
              {services.find(s => s.id === payingId)?.name}
            </div>
            <div className={styles.modalGrid}>
              <div>
                <label className={styles.fieldLabel}>Monto</label>
                <input
                  autoFocus
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmPayment()}
                  placeholder="$ 0"
                  className={styles.amountInput}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Fecha</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>
            <p className={styles.modalHint}>
              💡 Esto registrará el pago aquí <strong className={styles.modalHintStrong}>y también</strong> lo agregará como gasto en tu sección de finanzas.
            </p>
            <div className={styles.formActions}>
              <button onClick={confirmPayment} className={styles.confirmBtn}>
                ✓ Confirmar pago
              </button>
              <button onClick={() => setPayingId(null)} className={styles.modalCancelBtn}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {services.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🧾</div>
          <div className={styles.emptyTitle}>Sin servicios registrados</div>
          <p className={styles.emptyDesc}>Agregá tus servicios e impuestos para llevar el control de los pagos mensuales</p>
        </div>
      )}

      {/* Grouped service cards */}
      {grouped.map(group => (
        <div key={group.catId} className={styles.categoryGroup}>
          <div className={styles.categoryHeader}>
            <span className={styles.categoryLabel} style={{ color: group.color }}>{group.label}</span>
            <span className={styles.categoryBadge} style={{ background: group.dim, color: group.color }}>{group.items.length}</span>
          </div>
          <div className={styles.categoryItems}>
            {group.items.map((svc, i) => {
              const paid        = getMonthStatus(svc);
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
  return (
    <div
      className={`${styles.serviceCard} ${paid ? styles.serviceCardPaid : ''} ${isDeleting ? 'item-out' : ''}`}
      style={{
        '--accent-dim':    `${svc.color}18`,
        '--accent-border': `${svc.color}44`,
        animationDelay:    `${i * 0.06}s`,
      }}
    >
      {/* Main row */}
      <div className={`${styles.cardRow} ${isMobile ? styles.cardRowMobile : ''}`}>
        <div className={styles.svcIcon}>{svc.icon}</div>

        <div className={styles.svcInfo}>
          <div className={styles.svcNameRow}>
            <span className={styles.svcName}>{svc.name}</span>
            {paid ? (
              <span className={styles.chipPaid}>
                <Check size={8} strokeWidth={3} /> Pagado {format(new Date(paid.date + 'T12:00:00'), 'd MMM', { locale: es })}
              </span>
            ) : (
              <span className={styles.chipPending}>Pendiente</span>
            )}
          </div>
          {svc.accountId && (
            <div className={styles.svcAccountId}>ID: {svc.accountId}</div>
          )}
        </div>

        {paid && (
          <div className={styles.paidAmount}>{fmtMoney(paid.amount)}</div>
        )}

        <div className={styles.actions}>
          {!paid && (
            <button onClick={() => onPay(svc.id)} className={styles.payBtn}>
              Pagar
            </button>
          )}
          {paid && (
            <button onClick={() => onPay(svc.id)} className={styles.anotherPayBtn}>
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

      {/* Payment history */}
      {lastPayments.length > 1 && (
        <div className={styles.historySection}>
          <div className={styles.historyLabel}>Historial</div>
          <div className={styles.historyList}>
            {lastPayments.slice(0, 4).map(p => (
              <div key={p.id} className={styles.historyItem}>
                <span className={styles.historyMonth}>{p.month} · </span>
                <span className={styles.historyAmount}>{fmtMoney(p.amount)}</span>
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
    <button
      onClick={onClick}
      className={`${styles.iconBtn} ${danger ? styles.iconBtnDanger : ''}`}
    >
      {children}
    </button>
  );
}
