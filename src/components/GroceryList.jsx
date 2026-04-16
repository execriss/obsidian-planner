import { useState, useCallback } from 'react';
import {
  ShoppingCart, Plus, Trash2, Check, ChevronDown, ChevronUp,
  Sparkles, RotateCcw, Calculator, X, History, Tag, Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { useGrocery } from '../hooks/useGrocery.js';
import styles from './GroceryList.module.css';
import SectionSkeleton from './SectionSkeleton.jsx';
import { useMinLoading } from '../hooks/useMinLoading.js';
import OwnerToggle from './OwnerToggle.jsx';
import GroceryCalculator from './GroceryCalculator.jsx';

const CATS = [
  { id: 'frutas',    label: 'Frutas y Verduras', emoji: '🥦', color: '#5FAD8E', dim: 'rgba(95,173,142,0.15)' },
  { id: 'lacteos',   label: 'Lácteos',           emoji: '🥛', color: '#6B8FD4', dim: 'rgba(107,143,212,0.15)' },
  { id: 'carnes',    label: 'Carnes',             emoji: '🥩', color: '#E05C5C', dim: 'rgba(224,92,92,0.15)' },
  { id: 'almacen',   label: 'Almacén',            emoji: '🍝', color: '#F0A500', dim: 'rgba(240,165,0,0.15)' },
  { id: 'limpieza',  label: 'Limpieza',           emoji: '🧹', color: '#A47BD4', dim: 'rgba(164,123,212,0.15)' },
  { id: 'panaderia', label: 'Panadería',          emoji: '🍞', color: '#E8925A', dim: 'rgba(232,146,90,0.15)' },
  { id: 'bebidas',   label: 'Bebidas',            emoji: '🥤', color: '#4ECDC4', dim: 'rgba(78,205,196,0.15)' },
  { id: 'otro',      label: 'Otro',               emoji: '📦', color: '#7A7060', dim: 'rgba(122,112,96,0.15)' },
];

const catById = Object.fromEntries(CATS.map(c => [c.id, c]));

function fmtARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);
}

export default function GroceryList({ userId, sharedOwners = [] }) {
  const isMobile = useIsMobile();
  const [activeOwnerId, setActiveOwnerId] = useState(null);
  const { items, sessions, loading: dataLoading, addItem: dbAddItem, editItem, toggleItem: dbToggleItem, removeItem, clearDone, clearAll, resetList, saveSession } = useGrocery(userId, activeOwnerId);
  const loading = useMinLoading(dataLoading);

  const [showForm, setShowForm]         = useState(false);
  const [newText, setNewText]           = useState('');
  const [newQty, setNewQty]             = useState('');
  const [newCat, setNewCat]             = useState('frutas');
  const [cartOpen, setCartOpen]         = useState(true);
  const [collapsedCats, setCollapsedCats] = useState(new Set());
  const [checkingIds, setCheckingIds]   = useState(new Set());
  const [deletingIds, setDeletingIds]   = useState(new Set());
  const [showCalc, setShowCalc]         = useState(false);
  const [totalInput, setTotalInput]     = useState('');
  const [discounts, setDiscounts]       = useState([]);
  const [showHistory, setShowHistory]   = useState(false);
  const [savedAnim, setSavedAnim]       = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const pending = items.filter(i => !i.done);
  const inCart  = items.filter(i =>  i.done);

  const groupedPending = CATS
    .map(cat => ({ cat, items: pending.filter(i => i.cat === cat.id) }))
    .filter(g => g.items.length > 0);

  const toggleCat = (catId) =>
    setCollapsedCats(prev => {
      const s = new Set(prev);
      s.has(catId) ? s.delete(catId) : s.add(catId);
      return s;
    });
  const total   = items.length;
  const pct     = total > 0 ? Math.round((inCart.length / total) * 100) : 0;

  const addItem = () => {
    if (!newText.trim()) return;
    dbAddItem({ text: newText.trim(), qty: newQty.trim() || '1', cat: newCat });
    setNewText(''); setNewQty(''); setShowForm(false);
  };

  const toggleItem = useCallback((id) => {
    setCheckingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      dbToggleItem(id);
      setCheckingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 260);
  }, [dbToggleItem]);

  const deleteItem = useCallback((id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      removeItem(id);
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  }, [removeItem]);

  const handleReset = async () => {
    if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 3000); return; }
    await resetList();
    setResetConfirm(false);
  };

  const totalNum = parseFloat(totalInput.replace(/\./g, '').replace(',', '.')) || 0;

  const calcSteps = discounts.reduce((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].sub : totalNum;
    const pct  = parseFloat(d.pct) || 0;
    const off  = prev * (pct / 100);
    return [...acc, { ...d, off, sub: prev - off }];
  }, []);

  const finalAmount = calcSteps.length > 0 ? calcSteps[calcSteps.length - 1].sub : totalNum;

  const addDiscount    = () => setDiscounts(prev => [...prev, { id: Date.now(), label: '', pct: '' }]);
  const updateDiscount = (id, field, value) => setDiscounts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  const removeDiscount = (id) => setDiscounts(prev => prev.filter(d => d.id !== id));

  const handleSaveSession = async () => {
    if (!totalNum) return;
    await saveSession({
      total: totalNum,
      discounts: discounts.map(d => ({ label: d.label, pct: parseFloat(d.pct) || 0 })),
      final: finalAmount,
    });
    setSavedAnim(true);
    setTimeout(() => setSavedAnim(false), 2000);
  };

  const resetCalc = () => { setTotalInput(''); setDiscounts([]); };

  if (loading) return <SectionSkeleton variant="rows" count={6} />;

  return (
    <div className={`animate-viewIn ${styles.container}`}>

      {/* ── Owner toggle (visible when someone shared their list with me) ── */}
      {sharedOwners.length > 0 && (
        <div className={styles.ownerToggleRow}>
          <OwnerToggle
            sharedOwners={sharedOwners}
            activeOwnerId={activeOwnerId}
            onSelect={setActiveOwnerId}
          />
        </div>
      )}

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <ShoppingCart size={18} color="white" />
            </div>
            <div>
              <h1 className={styles.title}>Compras del Super</h1>
              <p className={styles.subtitle}>
                {total === 0 ? 'Lista vacía' : `${inCart.length} de ${total} artículo${total !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`${styles.addBtn} ${showForm ? styles.addBtnActive : ''}`}
          >
            <Plus size={13} className={`${styles.addBtnIcon} ${showForm ? styles.addBtnIconRotated : ''}`} />
            {!isMobile && 'Agregar'}
          </button>
        </div>

        {total > 0 && (
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill}${pct > 0 && pct < 100 ? ' progress-shimmer' : ''}`}
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? 'var(--sage)' : undefined,
                }}
              />
            </div>
            <div className={styles.progressStats}>
              <span className={styles.progressLabel}>
                {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
              </span>
              {pct === 100 && (
                <span className={styles.completeChip}>
                  <Sparkles size={10} /> ¡Lista completa!
                </span>
              )}
              <span className={styles.progressLabel}>{pct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Form agregar ── */}
      {showForm && (
        <div className={`form-spring ${styles.form}`}>
          <div className={styles.formInputRow}>
            <input
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="¿Qué necesitás comprar?"
              className={styles.formInput}
            />
            <input
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Cant."
              className={styles.qtyInput}
            />
          </div>
          <div className={`${styles.catGrid} ${isMobile ? styles.catGridMobile : ''}`}>
            {CATS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setNewCat(cat.id)}
                className={`${styles.catBtn} ${newCat === cat.id ? styles.catBtnActive : ''}`}
                style={newCat === cat.id ? { '--cat-color': cat.color, '--cat-dim': cat.dim } : {}}
              >
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
          <button onClick={addItem} className={styles.submitBtn}>
            Agregar a la lista
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {total === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🛒</div>
          <div className={styles.emptyTitle}>La lista está vacía</div>
          <p className={styles.emptyDesc}>Agregá artículos para empezar tu lista de compras</p>
        </div>
      )}

      {/* ── Ítems pendientes agrupados por categoría ── */}
      {groupedPending.length > 0 && (
        <div className={styles.catGroupList}>
          {groupedPending.map((group, gi) => (
            <CategoryGroup
              key={group.cat.id}
              cat={group.cat}
              items={group.items}
              collapsed={collapsedCats.has(group.cat.id)}
              onToggle={() => toggleCat(group.cat.id)}
              groupIndex={gi}
              checkingIds={checkingIds}
              deletingIds={deletingIds}
              onToggleItem={toggleItem}
              onEdit={editItem}
              onDelete={deleteItem}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* ── Carrito (completados) ── */}
      {inCart.length > 0 && (
        <div className={styles.cartSection}>
          <button onClick={() => setCartOpen(!cartOpen)} className={styles.cartToggle}>
            <div className={styles.cartIcon}>
              <ShoppingCart size={10} color="white" />
            </div>
            <span className={styles.cartLabel}>En el carrito</span>
            <span className={styles.cartCount}>{inCart.length}</span>
            {cartOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {cartOpen && (
            <div className={styles.cartItems}>
              {inCart.map((item, i) => (
                <ItemRow key={item.id} item={item} i={i}
                  isChecking={checkingIds.has(item.id)} isDeleting={deletingIds.has(item.id)}
                  onToggle={toggleItem} onEdit={editItem} onDelete={deleteItem} isMobile={isMobile} />
              ))}
            </div>
          )}

          <div className={styles.cartActions}>
            <button onClick={clearDone} className={styles.cartClearBtn}>
              <Trash2 size={11} />
              Vaciar carrito
            </button>
            <button
              onClick={handleReset}
              className={`${styles.resetBtn} ${resetConfirm ? styles.resetBtnConfirm : ''}`}
            >
              <RotateCcw size={11} />
              {resetConfirm ? '¿Confirmar reseteo?' : 'Resetear lista'}
            </button>
          </div>
        </div>
      )}

      {/* ── CALCULADORA ── */}
      {total > 0 && (
        <div className={styles.calcSection}>
          <button
            onClick={() => setShowCalc(!showCalc)}
            className={`${styles.calcToggle} ${showCalc ? styles.calcToggleActive : ''}`}
          >
            <div className={`${styles.calcToggleIcon} ${showCalc ? styles.calcToggleIconActive : ''}`}>
              <Calculator size={15} color={showCalc ? 'var(--amber)' : 'var(--cream-muted)'} />
            </div>
            <div className={styles.calcToggleInfo}>
              <div className={`${styles.calcToggleTitle} ${showCalc ? styles.calcToggleTitleActive : ''}`}>
                Calculadora de compra
              </div>
              <div className={styles.calcToggleSub}>
                Calculá el total con descuentos en cascada
              </div>
            </div>
            <ChevronDown
              size={14}
              color="var(--cream-muted)"
              className={`${styles.calcChevron} ${showCalc ? styles.calcChevronOpen : ''}`}
            />
          </button>

          {showCalc && (
            <div className={`form-spring ${styles.calcPanel} ${isMobile ? styles.calcPanelMobile : ''}`}>

              {/* Total inicial */}
              <div className={styles.calcTotalWrap}>
                <label className={styles.calcLabel}>
                  Total en caja (antes de descuentos)
                </label>
                <div className={styles.calcInputWrap}>
                  <span className={styles.calcPrefix}>$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalInput}
                    onChange={e => setTotalInput(e.target.value.replace(/[^0-9.,]/g, ''))}
                    placeholder="0"
                    className={styles.calcTotalInput}
                  />
                </div>
              </div>

              {/* Descuentos */}
              {discounts.length > 0 && (
                <div className={styles.discountsWrap}>
                  <div className={styles.discountsHeader}>Descuentos aplicados</div>
                  {discounts.map((d, idx) => {
                    const step    = calcSteps[idx];
                    const prevSub = idx === 0 ? totalNum : calcSteps[idx - 1].sub;
                    return (
                      <div key={d.id} className={styles.discountRow}>
                        <div className={`${styles.discountInputs} ${step?.off > 0 ? styles.discountInputsWithResult : ''}`}>
                          <input
                            value={d.label}
                            onChange={e => updateDiscount(d.id, 'label', e.target.value)}
                            placeholder={`Descuento ${idx + 1}`}
                            className={styles.discountLabelInput}
                          />
                          <div className={styles.discountPctWrap}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={d.pct}
                              onChange={e => updateDiscount(d.id, 'pct', e.target.value.replace(/[^0-9.]/g, ''))}
                              placeholder="0"
                              className={styles.discountPctInput}
                            />
                            <span className={styles.discountPctSymbol}>%</span>
                          </div>
                          <button onClick={() => removeDiscount(d.id)} className={styles.discountRemoveBtn}>
                            <X size={12} />
                          </button>
                        </div>
                        {step?.off > 0 && (
                          <div className={styles.discountResult}>
                            <div className={styles.discountResultLeft}>
                              <span className={styles.discountResultPrev}>{fmtARS(prevSub)}</span>
                              <span className={styles.discountResultOff}>− {fmtARS(step.off)}</span>
                            </div>
                            <div className={styles.discountResultFinal}>= {fmtARS(step.sub)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={addDiscount} className={styles.addDiscountBtn}>
                <Tag size={11} />
                Agregar descuento
              </button>

              {/* Total final */}
              {totalNum > 0 && (
                <div className={styles.finalTotal}>
                  <div className={styles.finalTotalRow}>
                    <div>
                      <div className={styles.finalTotalLabel}>Total final</div>
                      <div className={`${styles.finalTotalValue} ${isMobile ? styles.finalTotalValueMobile : ''}`}>
                        {fmtARS(finalAmount)}
                      </div>
                      {discounts.length > 0 && totalNum !== finalAmount && (
                        <div className={styles.finalTotalSavings}>
                          Ahorrás {fmtARS(totalNum - finalAmount)}{' '}
                          <span className={styles.savingsHighlight}>
                            ({Math.round((1 - finalAmount / totalNum) * 100)}% off)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.finalActions}>
                      <button onClick={resetCalc} className={styles.clearCalcBtn} title="Limpiar calculadora">
                        <X size={13} />
                      </button>
                      <button
                        onClick={handleSaveSession}
                        className={`${styles.saveBtn} ${savedAnim ? styles.saveBtnSaved : ''}`}
                      >
                        {savedAnim ? <><Check size={11} /> Guardado</> : <>💾 Guardar</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Historial */}
              {sessions.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`${styles.historyToggle} ${showHistory ? styles.historyToggleOpen : ''}`}
                  >
                    <History size={11} />
                    Historial de compras ({sessions.length})
                    <ChevronDown
                      size={10}
                      className={`${styles.historyChevron} ${showHistory ? styles.historyChevronOpen : ''}`}
                    />
                  </button>

                  {showHistory && (
                    <div className={styles.historyList}>
                      {sessions.map((s, i) => (
                        <div
                          key={s.id}
                          className={styles.historyItem}
                          style={{
                            animationDelay: `${i * 0.04}s`,
                            animationName: 'fadeUp',
                            animationDuration: '0.2s',
                            animationTimingFunction: 'var(--ease-spring)',
                            animationFillMode: 'both',
                          }}
                        >
                          <div className={styles.historyItemRow}>
                            <div>
                              <span className={styles.historyAmount}>{fmtARS(s.final)}</span>
                              {s.total !== s.final && (
                                <span className={styles.historyOriginal}>{fmtARS(s.total)}</span>
                              )}
                            </div>
                            <span className={styles.historyDate}>
                              {format(new Date(s.createdAt), 'd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                          {s.discounts.length > 0 && (
                            <div className={styles.historyDiscounts}>
                              {s.discounts.map((d, j) => (
                                <span key={j} className={styles.historyDiscountChip}>
                                  {d.label || `Desc. ${j + 1}`} -{d.pct}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      {total > 0 && (
        <div className={styles.footer}>
          <button onClick={clearAll} className={styles.clearAllBtn}>
            Vaciar lista completa
          </button>
        </div>
      )}

      {/* ── Calculadora flotante (solo mobile) ── */}
      {isMobile && <GroceryCalculator />}
    </div>
  );
}

// ─── CategoryGroup ────────────────────────────────────────────────────────────

function CategoryGroup({ cat, items, collapsed, onToggle, groupIndex, checkingIds, deletingIds, onToggleItem, onEdit, onDelete, isMobile }) {
  return (
    <div
      className={styles.catGroup}
      style={{
        '--cat-color': cat.color,
        '--cat-dim':   cat.dim,
        animationDelay: `${groupIndex * 0.06}s`,
        animationName: 'fadeUp',
        animationDuration: '0.3s',
        animationTimingFunction: 'var(--ease-spring)',
        animationFillMode: 'both',
      }}
    >
      <button className={styles.catGroupHeader} onClick={onToggle}>
        <span className={styles.catGroupEmoji}>{cat.emoji}</span>
        <span className={styles.catGroupLabel}>{cat.label}</span>
        <span className={styles.catGroupCount}>{items.length}</span>
        <ChevronDown
          size={14}
          className={`${styles.catGroupChevron} ${collapsed ? styles.catGroupChevronClosed : ''}`}
        />
      </button>
      <div className={`${styles.catGroupItems} ${collapsed ? styles.catGroupItemsClosed : ''}`}>
        <div className={styles.catGroupItemsInner}>
          <div className={styles.catGroupItemsContent}>
          {items.map((item, i) => (
            <ItemRow
              key={item.id} item={item} i={i}
              isChecking={checkingIds.has(item.id)} isDeleting={deletingIds.has(item.id)}
              onToggle={onToggleItem} onEdit={onEdit} onDelete={onDelete}
              isMobile={isMobile} hideCatBadge
            />
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({ item, i, isChecking, isDeleting, onToggle, onEdit, onDelete, isMobile, hideCatBadge }) {
  const [editing, setEditing]   = useState(false);
  const [editText, setEditText] = useState('');
  const [editQty, setEditQty]   = useState('');
  const [editCat, setEditCat]   = useState('');
  const cat = catById[item.cat] || catById['otro'];

  const openEdit = (e) => {
    e.stopPropagation();
    setEditText(item.text);
    setEditQty(item.qty || '1');
    setEditCat(item.cat || 'otro');
    setEditing(true);
  };

  const handleSave = () => {
    const text = editText.trim();
    if (!text) return;
    onEdit(item.id, { text, qty: editQty.trim() || '1', cat: editCat });
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    const editCatObj = catById[editCat] || catById['otro'];
    return (
      <div
        className={styles.itemEditRow}
        style={{ '--cat-color': editCatObj.color, '--cat-dim': editCatObj.dim }}
      >
        <div className={styles.itemEditInputs}>
          <input
            autoFocus
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.itemEditTextInput}
            placeholder="Nombre del producto"
          />
          <input
            value={editQty}
            onChange={e => setEditQty(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.itemEditQtyInput}
            placeholder="Cant."
          />
        </div>
        <div className={styles.itemEditCats}>
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setEditCat(c.id)}
              className={`${styles.itemEditCatBtn} ${editCat === c.id ? styles.itemEditCatBtnActive : ''}`}
              style={editCat === c.id ? { '--cat-color': c.color, '--cat-dim': c.dim } : {}}
              title={c.label}
            >
              {c.emoji}
            </button>
          ))}
        </div>
        <div className={styles.itemEditActions}>
          <button onClick={() => setEditing(false)} className={styles.itemEditCancelBtn}>
            <X size={13} />
          </button>
          <button onClick={handleSave} className={styles.itemEditSaveBtn} disabled={!editText.trim()}>
            <Check size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${item.done ? styles.itemRowDone : ''} ${styles.itemRow} ${isDeleting ? 'item-out' : ''}`}
      style={{
        '--cat-color':  cat.color,
        '--cat-dim':    cat.dim,
        '--cat-border': item.done ? 'var(--border)' : `${cat.color}28`,
        '--cat-hover':  item.done ? 'var(--border)' : `${cat.color}66`,
        animationDelay: `${i * 0.04}s`,
        animationName: 'fadeUp',
        animationDuration: '0.25s',
        animationTimingFunction: 'var(--ease-spring)',
        animationFillMode: 'both',
      }}
    >
      <button
        onClick={() => onToggle(item.id)}
        className={`${item.done ? styles.itemCheckboxDone : styles.itemCheckbox} ${isChecking ? 'check-done' : ''}`}
      >
        {item.done && <Check size={12} color="white" strokeWidth={3} />}
      </button>

      <div className={styles.itemText}>
        <span className={`${styles.itemLabel} ${item.done ? styles.itemLabelDone : ''}`}>
          {item.text}
        </span>
        {item.qty && item.qty !== '1' && (
          <span className={styles.itemQtyInline}>{item.qty}</span>
        )}
      </div>

      {!hideCatBadge && (
        <span className={styles.itemCatBadge}>
          {cat.emoji}{isMobile ? '' : ` ${cat.label}`}
        </span>
      )}

      {!item.done && (
        <button onClick={openEdit} className={styles.itemEditBtn} aria-label="Editar ítem">
          <Pencil size={12} />
        </button>
      )}

      <button onClick={() => onDelete(item.id)} className={styles.itemDeleteBtn}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}
