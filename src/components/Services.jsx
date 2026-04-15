import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus, Trash2, Pencil, ExternalLink, Copy, Check,
  Receipt, AlertTriangle, Clock, Link2,
} from 'lucide-react';
import styles from './Services.module.css';
import SectionSkeleton from './SectionSkeleton.jsx';
import { useMinLoading } from '../hooks/useMinLoading.js';

// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS = [
  { icon: '⚡', label: 'Electricidad', color: '#F0A500', cat: 'utilities' },
  { icon: '🔥', label: 'Gas',          color: '#E05C5C', cat: 'utilities' },
  { icon: '💧', label: 'Agua',         color: '#6B8FD4', cat: 'utilities' },
  { icon: '📶', label: 'Internet',     color: '#5FAD8E', cat: 'utilities' },
  { icon: '📱', label: 'Celular',      color: '#4ECDC4', cat: 'utilities' },
  { icon: '🏛️', label: 'Municipal',     color: '#A47BD4', cat: 'taxes' },
  { icon: '📋', label: 'Provincial',    color: '#A47BD4', cat: 'taxes' },
  { icon: '🏠', label: 'Alquiler',      color: '#E8925A', cat: 'utilities' },
  { icon: '🛡️', label: 'Seguro',        color: '#E8925A', cat: 'insurance' },
  { icon: '📺', label: 'Streaming',    color: '#E05C5C', cat: 'subscription' },
  { icon: '🏋️', label: 'Gimnasio',     color: '#5FAD8E', cat: 'subscription' },
  { icon: '🚗', label: 'VTV',          color: '#4ECDC4', cat: 'auto' },
  { icon: '⛽', label: 'Patente',      color: '#4ECDC4', cat: 'auto' },
  { icon: '🔧', label: 'Service auto', color: '#4ECDC4', cat: 'auto' },
];

const CAT_LABELS = {
  utilities:    { label: 'Servicios',     color: '#6B8FD4', dim: 'rgba(107,143,212,0.12)' },
  taxes:        { label: 'Impuestos',     color: '#A47BD4', dim: 'rgba(164,123,212,0.12)' },
  insurance:    { label: 'Seguros',       color: '#E8925A', dim: 'rgba(232,146,90,0.12)' },
  subscription: { label: 'Suscripciones', color: '#5FAD8E', dim: 'rgba(95,173,142,0.12)' },
  auto:         { label: 'Auto',          color: '#4ECDC4', dim: 'rgba(78,205,196,0.12)'  },
  other:        { label: 'Otros',         color: '#8A8A9A', dim: 'rgba(138,138,154,0.12)' },
};

function thisMonth() { return format(new Date(), 'yyyy-MM'); }
function fmtMoney(n) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n); }

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function getDueInfo(svc, paid) {
  if (!svc.dueDay) return null;
  const todayDay = new Date().getDate();
  const daysLeft = svc.dueDay - todayDay;
  if (paid)          return { status: 'paid',     daysLeft };
  if (daysLeft < 0)  return { status: 'overdue',  daysLeft };
  if (daysLeft === 0) return { status: 'today',   daysLeft: 0 };
  if (daysLeft <= 3) return { status: 'urgent',   daysLeft };
  return               { status: 'upcoming',  daysLeft };
}

function urgencyOrder(svc, paid, dueInfo) {
  if (!dueInfo) return paid ? 99 : 50;
  if (dueInfo.status === 'overdue')  return 0;
  if (dueInfo.status === 'today')    return 1;
  if (dueInfo.status === 'urgent')   return 2 + dueInfo.daysLeft;
  if (dueInfo.status === 'upcoming') return 10 + dueInfo.daysLeft;
  return 99; // paid
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', icon: '⚡', color: '#F0A500', accountId: '', website: '', cat: 'utilities', notes: '', dueDay: '', typicalAmount: '', budgetItemId: '' };

export default function Services({ servicesData, budgetItems = [], onPay }) {
  const { services, loading: dataLoading, addService, editService, removeService } = servicesData;
  const loading = useMinLoading(dataLoading);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [payingId, setPayingId]   = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate]     = useState(format(new Date(), 'yyyy-MM-dd'));
  const [copied, setCopied]       = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const resetForm = () => { setForm(EMPTY_FORM); setShowForm(false); setEditId(null); };

  const saveService = async () => {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      dueDay:        form.dueDay        ? parseInt(form.dueDay, 10)     : null,
      typicalAmount: form.typicalAmount ? parseFloat(form.typicalAmount) : null,
      budgetItemId:  form.budgetItemId  || null,
    };
    if (editId) { await editService(editId, payload); setEditId(null); }
    else        { await addService(payload); }
    resetForm();
  };

  const startEdit = (s) => {
    setForm({
      name: s.name, icon: s.icon, color: s.color, accountId: s.accountId || '',
      website: s.website || '', cat: s.cat, notes: s.notes || '',
      dueDay: s.dueDay ? String(s.dueDay) : '',
      typicalAmount: s.typicalAmount ? String(s.typicalAmount) : '',
      budgetItemId: s.budgetItemId || '',
    });
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
    const svc  = services.find(s => s.id === id);
    const last = svc?.payments?.slice().sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
    setPayAmount(last?.amount ? String(last.amount) : '');
    setPayDate(format(new Date(), 'yyyy-MM-dd'));
    setPayingId(id);
  };

  const confirmPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || !payingId) return;
    await onPay(payingId, { month: thisMonth(), amount, date: payDate });
    setPayingId(null);
    setPayAmount('');
  };

  const getMonthStatus = (svc) => {
    const month = thisMonth();
    return svc.payments?.find(p => p.month === month) || null;
  };

  // Budget items grouped by category for the selector
  const groupedBudgetItems = useMemo(() => {
    const map = new Map();
    budgetItems.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    });
    return Array.from(map, ([cat, items]) => ({ cat, items }));
  }, [budgetItems]);

  // Sort by urgency: overdue → today → urgent → upcoming → no due date → paid
  const sortedServices = [...services].sort((a, b) => {
    const paidA = getMonthStatus(a);
    const paidB = getMonthStatus(b);
    return urgencyOrder(a, paidA, getDueInfo(a, paidA)) - urgencyOrder(b, paidB, getDueInfo(b, paidB));
  });

  const pendingCount  = services.filter(s => !getMonthStatus(s)).length;
  const totalMonthly  = services.reduce((sum, s) => {
    const pay = s.payments?.filter(p => p.month === thisMonth()).reduce((a, b) => a + b.amount, 0) || 0;
    return sum + pay;
  }, 0);

  // Amount comparison for payment modal
  const payingSvc    = services.find(s => s.id === payingId);
  const typicalAmt   = payingSvc?.typicalAmount;
  const amountDiffPct = typicalAmt && payAmount
    ? Math.round((parseFloat(payAmount) - typicalAmt) / typicalAmt * 100)
    : null;

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
        <div className={styles.summaryGrid}>
          {[
            { label: 'Servicios', value: services.length,               color: 'var(--cream)',  sub: 'registrados' },
            { label: 'Pagados',   value: services.length - pendingCount, color: 'var(--sage)',   sub: 'este mes' },
            { label: 'Gastado',   value: fmtMoney(totalMonthly),         color: 'var(--coral)',  sub: 'este mes' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className={styles.summaryCard}>
              <div className={styles.summaryLabel}>{label}</div>
              <div className={styles.summaryValue} style={{ color }}>{value}</div>
              <div className={styles.summarySub}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
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

          <div className={styles.formRow}>
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
          <div className={styles.formRow}>
            <input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="Sitio web (ej: https://edesur.com.ar)"
              className={styles.input}
            />
            <div className={styles.formRowInner}>
              <input
                type="number"
                min="1"
                max="31"
                value={form.dueDay}
                onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
                placeholder="Día de vencimiento (1-31)"
                className={styles.input}
              />
              <input
                type="number"
                min="0"
                value={form.typicalAmount}
                onChange={e => setForm(f => ({ ...f, typicalAmount: e.target.value }))}
                placeholder="Monto típico ($)"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.catGrid}>
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

          {groupedBudgetItems.length > 0 && (
            <div className={styles.formFieldWrap}>
              <label className={styles.budgetLinkLabel}>
                <Link2 size={11} /> Vincular con ítem de presupuesto
              </label>
              <select
                value={form.budgetItemId || ''}
                onChange={e => setForm(f => ({ ...f, budgetItemId: e.target.value || null }))}
                className={styles.select}
              >
                <option value="">Sin vincular</option>
                {groupedBudgetItems.map(({ cat, items }) => (
                  <optgroup key={cat} label={cat}>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

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
          <div onClick={e => e.stopPropagation()} className={`form-spring ${styles.modalCard}`}>
            <div className={styles.modalTitle}>Registrar pago</div>
            <div className={styles.modalSubtitle}>{payingSvc?.name}</div>
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

            {typicalAmt && (
              <div className={styles.typicalHint}>
                <span className={styles.typicalLabel}>Monto típico:</span>
                <span className={styles.typicalValue}>{fmtMoney(typicalAmt)}</span>
                {amountDiffPct !== null && amountDiffPct !== 0 && (
                  <span className={`${styles.typicalDiff} ${amountDiffPct > 0 ? styles.typicalDiffUp : styles.typicalDiffDown}`}>
                    {amountDiffPct > 0 ? '↑' : '↓'} {Math.abs(amountDiffPct)}%
                  </span>
                )}
                {amountDiffPct === 0 && (
                  <span className={styles.typicalDiffEqual}>= igual al habitual</span>
                )}
              </div>
            )}

            <div className={styles.formActions}>
              <button onClick={confirmPayment} className={styles.confirmBtn}>✓ Confirmar pago</button>
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

      {/* Flat list sorted by urgency */}
      <div className={styles.serviceList}>
        {sortedServices.map((svc, i) => {
          const paid         = getMonthStatus(svc);
          const dueInfo      = getDueInfo(svc, paid);
          const lastPayments = (svc.payments || []).slice().sort((a, b) => b.paidAt.localeCompare(a.paidAt));
          const linkedBudgetItem = svc.budgetItemId
              ? budgetItems.find(i => i.id === svc.budgetItemId) ?? null
              : null;
          return (
            <ServiceCard
              key={svc.id}
              svc={svc} i={i} paid={paid} dueInfo={dueInfo} lastPayments={lastPayments}
              isDeleting={deletingIds.has(svc.id)}
              copied={copied}
              linkedBudgetItem={linkedBudgetItem}
              onPay={openPayment}
              onEdit={startEdit}
              onDelete={deleteService}
              onCopy={copyId}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({ svc, i, paid, dueInfo, lastPayments, isDeleting, copied, linkedBudgetItem, onPay, onEdit, onDelete, onCopy }) {
  return (
    <div
      className={`${styles.serviceCard} ${paid ? styles.serviceCardPaid : ''} ${dueInfo?.status === 'overdue' ? styles.serviceCardOverdue : ''} ${isDeleting ? 'item-out' : ''}`}
      style={{
        '--accent-dim':    `${svc.color}18`,
        '--accent-border': `${svc.color}44`,
        animationDelay:    `${i * 0.05}s`,
      }}
    >
      {/* Main row */}
      <div className={styles.cardRow}>
        <div className={styles.svcIcon}>{svc.icon}</div>

        <div className={styles.svcInfo}>
          <div className={styles.svcNameRow}>
            <span className={styles.svcName}>{svc.name}</span>
            <DueChip paid={paid} dueInfo={dueInfo} />
          </div>
          {svc.accountId && (
            <div className={styles.svcAccountId}>ID: {svc.accountId}</div>
          )}
          {svc.notes && (
            <div className={styles.svcNotes}>{svc.notes}</div>
          )}
          {linkedBudgetItem && (
            <div className={styles.budgetLinkBadge}>
              <Link2 size={9} />
              {linkedBudgetItem.category} · {linkedBudgetItem.name}
            </div>
          )}
        </div>

        <div className={styles.svcActions}>
          <div className={styles.primaryAction}>
            {paid
              ? <div className={styles.paidAmount}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(paid.amount)}</div>
              : <button onClick={() => onPay(svc.id)} className={styles.payBtn}>Pagar</button>
            }
          </div>
          <div className={styles.secondaryActions}>
            {paid && (
              <button onClick={() => onPay(svc.id)} className={styles.anotherPayBtn}>+ Otro</button>
            )}
            {svc.accountId && (
              <IconBtn onClick={() => onCopy(svc.id, svc.accountId)}>
                {copied === svc.id ? <Check size={12} color="var(--sage)" /> : <Copy size={12} />}
              </IconBtn>
            )}
            {svc.website && (
              <IconBtn onClick={() => window.open(svc.website, '_blank')}><ExternalLink size={12} /></IconBtn>
            )}
            <IconBtn onClick={() => onEdit(svc)}><Pencil size={12} /></IconBtn>
            <IconBtn onClick={() => onDelete(svc.id)} danger><Trash2 size={12} /></IconBtn>
          </div>
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
                <span className={styles.historyAmount}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DueChip ─────────────────────────────────────────────────────────────────

function DueChip({ paid, dueInfo }) {
  if (!dueInfo) {
    if (paid) {
      return (
        <span className={styles.chipPaid}>
          <Check size={8} strokeWidth={3} />
          Pagado {format(new Date(paid.date + 'T12:00:00'), 'd MMM', { locale: es })}
        </span>
      );
    }
    return <span className={styles.chipPending}>Pendiente</span>;
  }

  if (paid) {
    return (
      <span className={styles.chipPaid}>
        <Check size={8} strokeWidth={3} />
        Pagado {format(new Date(paid.date + 'T12:00:00'), 'd MMM', { locale: es })}
      </span>
    );
  }

  if (dueInfo.status === 'overdue') {
    return (
      <span className={styles.chipOverdue}>
        <AlertTriangle size={8} strokeWidth={3} />
        Vencido (día {dueInfo.daysLeft * -1 + new Date().getDate()})
      </span>
    );
  }
  if (dueInfo.status === 'today') {
    return <span className={styles.chipToday}><Clock size={8} strokeWidth={3} /> Vence hoy</span>;
  }
  if (dueInfo.status === 'urgent') {
    return <span className={styles.chipUrgent}><Clock size={8} strokeWidth={3} /> Vence en {dueInfo.daysLeft} día{dueInfo.daysLeft > 1 ? 's' : ''}</span>;
  }
  return <span className={styles.chipUpcoming}>Día {new Date().getDate() + dueInfo.daysLeft}</span>;
}

function IconBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick} className={`${styles.iconBtn} ${danger ? styles.iconBtnDanger : ''}`}>
      {children}
    </button>
  );
}
