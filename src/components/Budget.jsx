import { useState, useRef, useEffect, useMemo } from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Wallet, Plus, Trash2, Check, ChevronDown, ChevronLeft, ChevronRight,
  FileText, X, CircleDollarSign, Link2, Sparkles,
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile.js';
import OwnerToggle from './OwnerToggle.jsx';
import SectionSkeleton from './SectionSkeleton.jsx';
import styles from './Budget.module.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const CAT_COLORS = [
  { id: 'coral',  hex: '#E05C5C', dim: 'rgba(224,92,92,0.10)'   },
  { id: 'amber',  hex: '#F0A500', dim: 'rgba(240,165,0,0.10)'   },
  { id: 'sage',   hex: '#5FAD8E', dim: 'rgba(95,173,142,0.10)'  },
  { id: 'blue',   hex: '#6B8FD4', dim: 'rgba(107,143,212,0.10)' },
  { id: 'purple', hex: '#A47BD4', dim: 'rgba(164,123,212,0.10)' },
  { id: 'teal',   hex: '#4ECDC4', dim: 'rgba(78,205,196,0.10)'  },
  { id: 'orange', hex: '#E8925A', dim: 'rgba(232,146,90,0.10)'  },
  { id: 'muted',  hex: '#7A7060', dim: 'rgba(122,112,96,0.10)'  },
];

const colorById = Object.fromEntries(CAT_COLORS.map(c => [c.id, c]));

function fmtMoney(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);
}

function fmtMoneyShort(n) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}$${val}M`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(0);
    return `${sign}$${val}K`;
  }
  return fmtMoney(n);
}

function parseAmount(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.,\-]/g, '').replace(/\./g, '').replace(',', '.');
  return Math.round(Number(cleaned) || 0);
}

// ─── InlineInput ─────────────────────────────────────────────────────────────

function InlineInput({ value, onSave, className, inputClassName, type = 'text', placeholder = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = type === 'text' ? draft.trim() : draft;
    if (trimmed !== value && trimmed !== '') {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={inputClassName || styles.inlineInput}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      className={className}
      onClick={() => setEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') setEditing(true); }}
    >
      {value || placeholder}
    </span>
  );
}

// ─── IncomeSection ───────────────────────────────────────────────────────────

function IncomeSection({ income, onAdd, onEdit, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const sourceRef = useRef(null);

  useEffect(() => {
    if (adding && sourceRef.current) sourceRef.current.focus();
  }, [adding]);

  const handleAddSave = () => {
    const source = newSource.trim();
    const amount = parseAmount(newAmount);
    if (!source) return;
    onAdd({ source, amount });
    setNewSource('');
    setNewAmount('');
    setAdding(false);
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') handleAddSave();
    if (e.key === 'Escape') { setAdding(false); setNewSource(''); setNewAmount(''); }
  };

  const totalIncome = income.reduce((s, i) => s + i.amount, 0);

  return (
    <section className={styles.incomeSection}>
      <div className={styles.incomeSectionLabel}>
        Ingresos del mes {totalIncome > 0 && <span> — {fmtMoney(totalIncome)}</span>}
      </div>
      <div className={styles.incomeRow}>
        {income.map(inc => (
          <div key={inc.id} className={styles.incomeCard}>
            <InlineInput
              value={inc.source}
              onSave={source => onEdit(inc.id, { source })}
              className={styles.incomeCardSource}
              inputClassName={styles.inlineInput}
            />
            <InlineInput
              value={fmtMoney(inc.amount)}
              onSave={raw => onEdit(inc.id, { amount: parseAmount(raw) })}
              className={styles.incomeCardAmount}
              inputClassName={styles.inlineInput}
            />
            <button
              className={styles.incomeDeleteBtn}
              onClick={() => onRemove(inc.id)}
              aria-label="Eliminar ingreso"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {adding ? (
          <div className={styles.incomeCard}>
            <input
              ref={sourceRef}
              className={styles.inlineInput}
              value={newSource}
              onChange={e => setNewSource(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Fuente"
              style={{ fontSize: '11px', width: '100%' }}
            />
            <input
              className={styles.inlineInput}
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              onKeyDown={handleAddKeyDown}
              onBlur={handleAddSave}
              placeholder="$0"
              style={{ fontSize: '14px', width: '100%', marginTop: '4px' }}
            />
          </div>
        ) : (
          <button className={styles.addIncomeBtn} onClick={() => setAdding(true)} aria-label="Agregar ingreso">
            <Plus size={18} />
          </button>
        )}
      </div>
    </section>
  );
}

// ─── SummaryBar ──────────────────────────────────────────────────────────────

function SummaryBar({ merged, income, isMobile }) {
  const totalBudgeted = merged.reduce((s, i) => s + i.amount, 0);
  const totalPaid     = merged.reduce((s, i) => s + i.paid, 0);
  const totalPending  = totalBudgeted - totalPaid;
  const totalIncome   = income.reduce((s, i) => s + i.amount, 0);
  const balance       = totalIncome - totalPaid;
  const fmt = isMobile ? fmtMoneyShort : fmtMoney;

  return (
    <div className={styles.summaryBar}>
      <div className={styles.summaryCell}>
        <div className={styles.summaryCellLabel}>Ingresos</div>
        <div className={styles.summaryCellValue}>{fmt(totalIncome)}</div>
      </div>
      <div className={styles.summaryCell}>
        <div className={styles.summaryCellLabel}>Presupuestado</div>
        <div className={styles.summaryCellValue}>{fmt(totalBudgeted)}</div>
      </div>
      <div className={styles.summaryCell}>
        <div className={styles.summaryCellLabel}>Pagado</div>
        <div className={styles.summaryCellValue}>{fmt(totalPaid)}</div>
      </div>
      <div className={`${styles.summaryCell} ${totalPending >= 0 ? '' : styles.summaryNegative}`}>
        <div className={styles.summaryCellLabel}>Pendiente</div>
        <div className={styles.summaryCellValue}>{fmt(totalPending)}</div>
      </div>
      <div className={`${styles.summaryCell} ${balance >= 0 ? styles.summaryPositive : styles.summaryNegative}`}>
        <div className={styles.summaryCellLabel}>Balance</div>
        <div className={styles.summaryCellValue}>{fmt(balance)}</div>
      </div>
    </div>
  );
}

// ─── ItemRow ─────────────────────────────────────────────────────────────────

function ItemRow({ item, onUpdateEntry, onEditItem, onRemove, isMobile, linkedService }) {
  const [showNotes, setShowNotes] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const amountRef = useRef(null);
  const paidRef   = useRef(null);

  const isPaidFull    = item.paid > 0 && item.paid >= item.amount;
  const isPaidPartial = item.paid > 0 && item.paid < item.amount;

  const fmt = isMobile ? fmtMoneyShort : fmtMoney;

  useEffect(() => {
    if (amountRef.current && document.activeElement !== amountRef.current) {
      amountRef.current.value = item.amount > 0 ? fmt(item.amount) : '';
    }
  }, [item.amount, isMobile]);

  useEffect(() => {
    if (paidRef.current && document.activeElement !== paidRef.current) {
      paidRef.current.value = item.paid > 0 ? fmt(item.paid) : '';
    }
  }, [item.paid, isMobile]);

  const handlePay = () => {
    if (isPaidFull) {
      onUpdateEntry(item.id, { paid: 0 });
    } else {
      onUpdateEntry(item.id, { paid: item.amount });
    }
  };

  const handleAmountBlur = (raw) => {
    const val = parseAmount(raw);
    if (val !== item.amount) {
      onUpdateEntry(item.id, { amount: val });
    } else {
      amountRef.current.value = item.amount > 0 ? fmtMoney(item.amount) : '';
    }
  };

  const handlePaidBlur = (raw) => {
    const val = parseAmount(raw);
    if (val !== item.paid) {
      onUpdateEntry(item.id, { paid: val });
    } else {
      paidRef.current.value = item.paid > 0 ? fmtMoney(item.paid) : '';
    }
  };

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => onRemove(item.id), 220);
  };

  const paidInputClass = isPaidFull
    ? `${styles.paidInput} ${styles.paidInputFull}`
    : isPaidPartial
    ? `${styles.paidInput} ${styles.paidInputPartial}`
    : styles.paidInput;

  const payBtnClass = isPaidFull
    ? styles.payBtnPaid
    : isPaidPartial
    ? styles.payBtnPartial
    : styles.payBtn;

  return (
    <>
      <div className={`${styles.itemRow} ${deleting ? 'item-out' : ''}`}>
        <div className={styles.itemNameCell}>
          <InlineInput
            value={item.name}
            onSave={name => onEditItem(item.id, { name })}
            className={styles.itemName}
            inputClassName={styles.itemNameInput}
            placeholder="Nombre del gasto"
          />
          {linkedService && (
            <span
              className={styles.serviceLinkDot}
              title={`Vinculado con "${linkedService.name}" ${linkedService.icon}`}
            >
              <Link2 size={9} />
            </span>
          )}
        </div>

        <input
          ref={amountRef}
          type="text"
          className={styles.amountInput}
          defaultValue={item.amount > 0 ? fmt(item.amount) : ''}
          onFocus={e => { e.target.value = item.amount > 0 ? String(item.amount) : ''; }}
          onBlur={e => handleAmountBlur(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
          placeholder="$0"
          aria-label="Monto presupuestado"
        />

        <input
          ref={paidRef}
          type="text"
          className={paidInputClass}
          defaultValue={item.paid > 0 ? fmt(item.paid) : ''}
          onFocus={e => { e.target.value = item.paid > 0 ? String(item.paid) : ''; }}
          onBlur={e => handlePaidBlur(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
          placeholder="—"
          aria-label="Monto pagado"
        />

        <button
          className={payBtnClass}
          onClick={handlePay}
          aria-label={isPaidFull ? 'Desmarcar pago' : 'Marcar como pagado'}
          title={isPaidFull ? 'Desmarcar pago' : isPaidPartial ? 'Marcar como pagado completo' : 'Marcar como pagado'}
        >
          <Check size={14} />
        </button>

        <button
          className={`${styles.notesBtn} ${showNotes ? styles.notesBtnActive : ''}`}
          onClick={() => setShowNotes(!showNotes)}
          aria-label="Notas"
          title="Notas"
        >
          <FileText size={13} />
        </button>

        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          aria-label="Eliminar ítem"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {showNotes && (
        <div className={styles.notesRow}>
          <textarea
            className={styles.notesTextarea}
            defaultValue={item.notes}
            onBlur={e => {
              if (e.target.value !== item.notes) {
                onUpdateEntry(item.id, { notes: e.target.value });
              }
            }}
            placeholder="Notas sobre este gasto..."
          />
        </div>
      )}
    </>
  );
}

// ─── CategorySection ─────────────────────────────────────────────────────────

function CategorySection({
  catName, catColor, items, onUpdateEntry, onEditItem, onRemoveItem,
  onEditCategory, onRemoveCategory, onAddItem, isMobile, linkedServicesMap,
}) {
  const [open, setOpen]             = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal]       = useState(catName);
  const [showColors, setShowColors] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { setNameVal(catName); }, [catName]);
  useEffect(() => {
    if (editingName && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [editingName]);

  const color = colorById[catColor] || colorById.blue;
  const catTotal  = items.reduce((s, i) => s + i.amount, 0);
  const catPaid   = items.reduce((s, i) => s + i.paid, 0);

  const commitName = () => {
    setEditingName(false);
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== catName) {
      onEditCategory(catName, { name: trimmed });
    } else {
      setNameVal(catName);
    }
  };

  const handleColorPick = (colorId) => {
    onEditCategory(catName, { color: colorId });
    setShowColors(false);
  };

  const handleDeleteCategory = (e) => {
    e.stopPropagation();
    if (items.length > 0 && !confirm(`Se eliminarán ${items.length} ítems de "${catName}". ¿Continuar?`)) return;
    onRemoveCategory(catName);
  };

  const handleAddItem = () => {
    onAddItem({
      category: catName,
      name: 'Nuevo gasto',
      defaultAmount: 0,
      catColor,
      sortOrder: items.length,
    });
  };

  return (
    <section className={styles.categorySection} style={{ '--cat-color': color.hex }}>
      <div
        className={styles.categoryHeader}
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
        aria-expanded={open}
      >
        <span
          className={styles.categoryDot}
          onClick={e => { e.stopPropagation(); setShowColors(!showColors); }}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setShowColors(!showColors); } }}
          aria-label="Cambiar color"
        />

        {editingName ? (
          <input
            ref={nameRef}
            className={styles.categoryNameInput}
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') { setNameVal(catName); setEditingName(false); }
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className={styles.categoryName}
            onDoubleClick={e => { e.stopPropagation(); setEditingName(true); }}
          >
            {catName}
          </span>
        )}

        {!isMobile && (
          <div className={styles.categoryTotals}>
            <span>
              <span className={styles.categoryTotalLabel}>Ppto. </span>
              <span className={styles.categoryTotalValue}>{fmtMoney(catTotal)}</span>
            </span>
            <span>
              <span className={styles.categoryTotalLabel}>Pag. </span>
              <span className={styles.categoryTotalValue}>{fmtMoney(catPaid)}</span>
            </span>
          </div>
        )}

        <span className={`${styles.categoryChevron} ${open ? styles.categoryChevronOpen : styles.categoryChevronClosed}`}>
          <ChevronDown size={14} />
        </span>

        <button
          className={styles.categoryDeleteBtn}
          onClick={handleDeleteCategory}
          aria-label="Eliminar categoría"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {showColors && (
        <div className={styles.colorPicker}>
          {CAT_COLORS.map(c => (
            <span
              key={c.id}
              className={`${styles.colorDot} ${catColor === c.id ? styles.colorDotActive : ''}`}
              style={{ background: c.hex }}
              onClick={() => handleColorPick(c.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') handleColorPick(c.id); }}
              aria-label={c.id}
            />
          ))}
        </div>
      )}

      {open && (
        <>
          <div className={styles.itemList}>
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onUpdateEntry={onUpdateEntry}
                onEditItem={onEditItem}
                onRemove={onRemoveItem}
                isMobile={isMobile}
                linkedService={linkedServicesMap?.get(item.id) ?? null}
              />
            ))}
          </div>
          <button className={styles.addItemBtn} onClick={handleAddItem}>
            <Plus size={13} /> Agregar ítem
          </button>
        </>
      )}
    </section>
  );
}

// ─── MonthPicker ─────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TODAY_MONTH  = format(new Date(), 'yyyy-MM');

function MonthPicker({ budgetMonth, budgetDate, onSelect }) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => parseInt(budgetMonth.slice(0, 4)));
  const wrapRef = useRef(null);

  useEffect(() => {
    if (open) setPickerYear(parseInt(budgetMonth.slice(0, 4)));
  }, [open, budgetMonth]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={styles.monthPickerWrap} ref={wrapRef}>
      <button
        className={styles.monthPickerTrigger}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Seleccionar mes"
      >
        <span>{format(budgetDate, 'MMMM yyyy', { locale: es })}</span>
        <ChevronDown size={10} className={open ? styles.triggerChevronOpen : ''} />
      </button>

      {open && (
        <div className={styles.monthPickerDropdown}>
          <div className={styles.pickerYearRow}>
            <button className={styles.pickerYearBtn} onClick={() => setPickerYear(y => y - 1)}>
              <ChevronLeft size={13} />
            </button>
            <span className={styles.pickerYear}>{pickerYear}</span>
            <button className={styles.pickerYearBtn} onClick={() => setPickerYear(y => y + 1)}>
              <ChevronRight size={13} />
            </button>
          </div>
          <div className={styles.pickerGrid}>
            {MONTH_LABELS.map((label, i) => {
              const monthStr = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
              const isSelected = monthStr === budgetMonth;
              const isToday    = monthStr === TODAY_MONTH;
              return (
                <button
                  key={label}
                  className={`${styles.pickerMonth} ${isSelected ? styles.pickerMonthSelected : ''} ${isToday && !isSelected ? styles.pickerMonthToday : ''}`}
                  onClick={() => { onSelect(monthStr); setOpen(false); }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Budget (main) ───────────────────────────────────────────────────────────

export default function Budget({
  budgetData, budgetMonth, sharedOwners = [],
  activeOwnerId, onActiveOwnerChange,
  onUpdateEntry, linkedServicesMap,
  onPrevMonth, onNextMonth, onSelectMonth, onInitMonth,
}) {
  const isMobile = useIsMobile();
  const {
    entries, merged, categories, income, loading, error, retry,
    addItem, editItem, removeItem,
    editCategory, removeCategory,
    addIncome, editIncome, removeIncome,
  } = budgetData;
  const updateEntry = onUpdateEntry;

  const budgetDate = useMemo(() => parse(budgetMonth, 'yyyy-MM', new Date()), [budgetMonth]);
  const isUninitialized = !loading && merged.length > 0 && entries.length === 0 && income.length === 0;
  const [initializing, setInitializing] = useState(false);

  const handleInit = async () => {
    setInitializing(true);
    try { await onInitMonth(); } finally { setInitializing(false); }
  };

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [newCatColor, setNewCatColor] = useState('blue');
  const newCatRef = useRef(null);

  useEffect(() => {
    if (showNewCategory && newCatRef.current) newCatRef.current.focus();
  }, [showNewCategory]);

  // Group merged items by category, preserving order from categories list
  const groupedByCategory = useMemo(() => {
    const map = new Map();
    categories.forEach(({ name }) => map.set(name, []));
    merged.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    });
    return map;
  }, [merged, categories]);

  const handleCreateCategory = async () => {
    const name = newCatName.trim().toUpperCase();
    if (!name) return;
    await addItem({
      category: name,
      name: 'Nuevo gasto',
      defaultAmount: 0,
      catColor: newCatColor,
      sortOrder: 0,
    });
    setNewCatName('');
    setNewCatColor('blue');
    setShowNewCategory(false);
  };

  const handleNewCatKeyDown = (e) => {
    if (e.key === 'Enter') handleCreateCategory();
    if (e.key === 'Escape') { setShowNewCategory(false); setNewCatName(''); }
  };

  if (loading) {
    return <SectionSkeleton variant="budget" />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <div className={styles.errorMsg}>{error}</div>
          <button className={styles.retryBtn} onClick={retry}>Reintentar</button>
        </div>
      </div>
    );
  }

  const hasData = categories.length > 0 || income.length > 0;

  return (
    <div className={styles.container}>

      {/* ── Owner toggle (visible when someone shared their budget with me) ── */}
      {sharedOwners.length > 0 && (
        <div className={styles.ownerToggleRow}>
          <OwnerToggle
            sharedOwners={sharedOwners}
            activeOwnerId={activeOwnerId}
            onSelect={onActiveOwnerChange}
          />
        </div>
      )}

      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerIcon}>
          <Wallet size={18} color="var(--obsidian)" />
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Presupuesto</h1>
          <div className={styles.monthNav}>
            <button className={styles.monthNavBtn} onClick={onPrevMonth} aria-label="Mes anterior">
              <ChevronLeft size={13} />
            </button>
            <MonthPicker budgetMonth={budgetMonth} budgetDate={budgetDate} onSelect={onSelectMonth} />
            <button className={styles.monthNavBtn} onClick={onNextMonth} aria-label="Mes siguiente">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {!hasData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <CircleDollarSign size={24} />
          </div>
          <div className={styles.emptyTitle}>Sin presupuesto</div>
          <div className={styles.emptySubtitle}>
            Creá tu primera categoría para empezar a organizar los gastos del mes.
          </div>
          <button
            className={styles.addCategoryBtn}
            onClick={() => setShowNewCategory(true)}
            style={{ maxWidth: '260px' }}
          >
            <Plus size={15} /> Nueva categoría
          </button>
        </div>
      ) : (
        <>
          {/* Init banner */}
          {isUninitialized && onInitMonth && (
            <div className={styles.initBanner}>
              <Sparkles size={14} className={styles.initBannerIcon} />
              <span className={styles.initBannerText}>
                {format(budgetDate, 'MMMM', { locale: es })} no tiene presupuesto guardado — los montos son de la plantilla.
              </span>
              <button
                className={styles.initBannerBtn}
                onClick={handleInit}
                disabled={initializing}
              >
                {initializing ? 'Iniciando...' : 'Inicializar mes'}
              </button>
            </div>
          )}

          {/* Income */}
          <IncomeSection
            income={income}
            onAdd={addIncome}
            onEdit={editIncome}
            onRemove={removeIncome}
          />

          {/* Summary */}
          <SummaryBar merged={merged} income={income} isMobile={isMobile} />

          {/* Categories */}
          {Array.from(groupedByCategory).map(([catName, catItems]) => {
            const cat = categories.find(c => c.name === catName);
            return (
              <CategorySection
                key={catName}
                catName={catName}
                catColor={cat?.color || 'blue'}
                items={catItems}
                onUpdateEntry={updateEntry}
                onEditItem={editItem}
                onRemoveItem={removeItem}
                onEditCategory={editCategory}
                onRemoveCategory={removeCategory}
                onAddItem={addItem}
                isMobile={isMobile}
                linkedServicesMap={linkedServicesMap}
              />
            );
          })}
        </>
      )}

      {/* New category form */}
      {showNewCategory ? (
        <div className={styles.newCategoryForm}>
          <div className={styles.newCategoryFormRow}>
            <input
              ref={newCatRef}
              className={styles.newCategoryInput}
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={handleNewCatKeyDown}
              placeholder="Nombre de la categoría"
            />
          </div>
          <div className={styles.colorPicker}>
            {CAT_COLORS.map(c => (
              <span
                key={c.id}
                className={`${styles.colorDot} ${newCatColor === c.id ? styles.colorDotActive : ''}`}
                style={{ background: c.hex }}
                onClick={() => setNewCatColor(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') setNewCatColor(c.id); }}
                aria-label={c.id}
              />
            ))}
          </div>
          <div className={styles.newCategoryActions}>
            <button className={styles.newCategoryCancelBtn} onClick={() => { setShowNewCategory(false); setNewCatName(''); }}>
              Cancelar
            </button>
            <button
              className={styles.newCategorySaveBtn}
              onClick={handleCreateCategory}
              disabled={!newCatName.trim()}
            >
              Crear categoría
            </button>
          </div>
        </div>
      ) : hasData ? (
        <button className={styles.addCategoryBtn} onClick={() => setShowNewCategory(true)}>
          <Plus size={15} /> Nueva categoría
        </button>
      ) : null}
    </div>
  );
}
