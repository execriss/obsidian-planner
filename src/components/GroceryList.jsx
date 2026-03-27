import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Plus, Trash2, Check, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';

// ─── Categories ───────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadItems() {
  try { return JSON.parse(localStorage.getItem('grocery_items') || '[]'); }
  catch { return []; }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GroceryList() {
  const [items, setItems]             = useState(loadItems);
  const [showForm, setShowForm]       = useState(false);
  const [newText, setNewText]         = useState('');
  const [newQty, setNewQty]           = useState('');
  const [newCat, setNewCat]           = useState('frutas');
  const [cartOpen, setCartOpen]       = useState(true);
  const [checkingIds, setCheckingIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('grocery_items', JSON.stringify(items));
  }, [items]);

  const pending = items.filter(i => !i.done);
  const inCart  = items.filter(i =>  i.done);
  const total   = items.length;
  const pct     = total > 0 ? Math.round((inCart.length / total) * 100) : 0;

  const addItem = () => {
    if (!newText.trim()) return;
    const item = {
      id:   uid(),
      text: newText.trim(),
      qty:  newQty.trim() || null,
      cat:  newCat,
      done: false,
    };
    setItems(prev => [item, ...prev]);
    setNewText('');
    setNewQty('');
    setShowForm(false);
  };

  const toggleItem = useCallback((id) => {
    setCheckingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
      setCheckingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 260);
  }, []);

  const deleteItem = useCallback((id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  }, []);

  const clearCart  = () => setItems(prev => prev.filter(i => !i.done));
  const clearAll   = () => setItems([]);

  return (
    <div
      className="animate-viewIn"
      style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', animation: 'fadeDown 0.35s var(--ease-out) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--sage), #3D8B6A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(95,173,142,0.25)',
            animation: 'float 3.5s ease-in-out infinite',
          }}>
            <ShoppingCart size={18} color="white" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700,
              color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              Compras del Super
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--cream-muted)', marginTop: '3px', letterSpacing: '0.04em' }}>
              {total === 0
                ? 'Lista vacía'
                : `${inCart.length} de ${total} artículo${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{
            marginTop: '14px',
            animation: 'fadeUp 0.4s var(--ease-spring) 0.1s both',
          }}>
            <div style={{
              height: '5px', background: 'var(--border)',
              borderRadius: '3px', overflow: 'hidden',
            }}>
              <div
                className={pct > 0 && pct < 100 ? 'progress-shimmer' : ''}
                style={{
                  height: '100%', borderRadius: '3px',
                  width: `${pct}%`,
                  background: pct === 100 ? 'var(--sage)' : undefined,
                  transition: 'width 0.6s var(--ease-spring)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span style={{ fontSize: '10px', color: 'var(--cream-muted)' }}>
                {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
              </span>
              {pct === 100 && (
                <span style={{
                  fontSize: '10px', fontWeight: 600, color: 'var(--sage)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  animation: 'chipPop 0.4s var(--ease-spring) both',
                }}>
                  <Sparkles size={10} /> ¡Lista completa!
                </span>
              )}
              <span style={{ fontSize: '10px', color: 'var(--cream-muted)' }}>{pct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Add button ── */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: '100%', padding: '12px', borderRadius: '12px', marginBottom: '12px',
          border: `1px dashed ${showForm ? 'var(--sage)' : 'var(--border-light)'}`,
          background: showForm ? 'rgba(95,173,142,0.08)' : 'transparent',
          color: showForm ? 'var(--sage)' : 'var(--cream-muted)',
          fontSize: '13px', fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s var(--ease-spring)',
        }}
        onMouseEnter={e => { if (!showForm) { e.currentTarget.style.borderColor = 'var(--sage)'; e.currentTarget.style.color = 'var(--sage)'; e.currentTarget.style.transform = 'scale(1.005)'; } }}
        onMouseLeave={e => { if (!showForm) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.transform = 'scale(1)'; } }}
      >
        <Plus size={14} style={{ transition: 'transform 0.2s var(--ease-spring)', transform: showForm ? 'rotate(45deg)' : 'rotate(0deg)' }} />
        Agregar artículo
      </button>

      {/* ── Add form ── */}
      {showForm && (
        <div className="form-spring" style={{
          background: 'var(--obsidian-3)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px', padding: '18px',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {/* Name + quantity row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="¿Qué necesitás comprar?"
              style={{
                flex: 1,
                background: 'var(--obsidian-4)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px', padding: '10px 14px',
                fontSize: '13px', color: 'var(--cream)',
                outline: 'none', transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--sage)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
            />
            <input
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Cant."
              style={{
                width: '72px',
                background: 'var(--obsidian-4)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px', padding: '10px 10px',
                fontSize: '13px', color: 'var(--cream)',
                outline: 'none', textAlign: 'center',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--sage)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
            />
          </div>

          {/* Category grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px', marginBottom: '14px',
          }}>
            {CATS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setNewCat(cat.id)}
                style={{
                  padding: '7px 6px', borderRadius: '9px', fontSize: '10px', fontWeight: 600,
                  border: `1px solid ${newCat === cat.id ? cat.color : 'var(--border)'}`,
                  background: newCat === cat.id ? cat.dim : 'transparent',
                  color: newCat === cat.id ? cat.color : 'var(--cream-muted)',
                  transition: 'all 0.18s var(--ease-spring)',
                  transform: newCat === cat.id ? 'scale(1.04)' : 'scale(1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontSize: '14px' }}>{cat.emoji}</span>
                <span style={{ textAlign: 'center', fontSize: '9px' }}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={addItem}
            style={{
              width: '100%', padding: '11px', borderRadius: '10px',
              background: 'var(--sage)', color: 'white',
              fontSize: '13px', fontWeight: 700,
              transition: 'all 0.2s var(--ease-spring)',
              boxShadow: '0 4px 16px rgba(95,173,142,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(95,173,142,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(95,173,142,0.25)'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1.02)'}
          >
            Agregar a la lista
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {total === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 0',
          animation: 'fadeIn 0.4s ease both',
        }}>
          <div style={{
            fontSize: '52px', marginBottom: '16px',
            animation: 'float 3s ease-in-out infinite',
            filter: 'grayscale(0.3)',
          }}>
            🛒
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600,
            color: 'var(--cream-dim)', marginBottom: '8px',
          }}>
            La lista está vacía
          </div>
          <p style={{ fontSize: '12px', color: 'var(--cream-muted)' }}>
            Agregá artículos para empezar tu lista de compras
          </p>
        </div>
      )}

      {/* ── Pending items ── */}
      {pending.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
          {pending.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              i={i}
              isChecking={checkingIds.has(item.id)}
              isDeleting={deletingIds.has(item.id)}
              onToggle={toggleItem}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}

      {/* ── Cart section ── */}
      {inCart.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {/* Divider header */}
          <button
            onClick={() => setCartOpen(!cartOpen)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 4px', marginBottom: '8px',
              borderBottom: '1px solid var(--border)',
              color: 'var(--cream-muted)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--cream)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--cream-muted)'}
          >
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '5px',
                background: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShoppingCart size={10} color="white" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                En el carrito
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                padding: '1px 7px', borderRadius: '10px',
                background: 'var(--sage)', color: 'white',
              }}>
                {inCart.length}
              </span>
            </div>
            {cartOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {cartOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {inCart.map((item, i) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  i={i}
                  isChecking={checkingIds.has(item.id)}
                  isDeleting={deletingIds.has(item.id)}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}

          {/* Clear cart button */}
          <button
            onClick={clearCart}
            style={{
              marginTop: '12px', padding: '8px 16px', borderRadius: '9px',
              border: '1px solid var(--border)',
              color: 'var(--cream-muted)', fontSize: '11px', fontWeight: 500,
              transition: 'all 0.2s var(--ease-spring)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--coral)'; e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Vaciar carrito
          </button>
        </div>
      )}

      {/* ── Clear all ── */}
      {total > 0 && (
        <div style={{
          marginTop: '32px', paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={clearAll}
            style={{
              padding: '7px 14px', borderRadius: '9px',
              border: '1px solid var(--border)',
              color: 'var(--cream-muted)', fontSize: '11px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--coral)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--cream-muted)'; }}
          >
            Vaciar lista completa
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({ item, i, isChecking, isDeleting, onToggle, onDelete }) {
  const cat = catById[item.cat] || catById['otro'];

  return (
    <div
      className={isDeleting ? 'item-out' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '11px 14px', borderRadius: '12px',
        background: item.done ? 'transparent' : 'var(--obsidian-3)',
        border: `1px solid ${item.done ? 'var(--border)' : cat.color + '28'}`,
        opacity: item.done ? 0.55 : 1,
        animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.04}s both`,
        transition: 'opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease, transform 0.2s var(--ease-spring)',
      }}
      onMouseEnter={e => { if (!item.done) { e.currentTarget.style.borderColor = cat.color + '66'; e.currentTarget.style.transform = 'translateX(3px)'; } }}
      onMouseLeave={e => { if (!item.done) { e.currentTarget.style.borderColor = cat.color + '28'; e.currentTarget.style.transform = 'translateX(0)'; } }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={isChecking ? 'check-done' : ''}
        style={{
          width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
          border: `2px solid ${item.done ? 'var(--sage)' : cat.color}`,
          background: item.done ? 'var(--sage)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.25s ease, border-color 0.25s ease, transform 0.15s var(--ease-spring)',
        }}
        onMouseEnter={e => { if (!item.done) e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {item.done && <Check size={12} color="white" strokeWidth={3} />}
      </button>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: '13px', fontWeight: 500,
          color: item.done ? 'var(--cream-muted)' : 'var(--cream)',
          textDecoration: item.done ? 'line-through' : 'none',
          transition: 'color 0.3s ease, text-decoration 0.3s ease',
          display: 'block',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.text}
        </span>
      </div>

      {/* Quantity badge */}
      {item.qty && (
        <span style={{
          fontSize: '10px', fontWeight: 600, flexShrink: 0,
          padding: '2px 8px', borderRadius: '6px',
          background: 'var(--obsidian-4)', color: 'var(--cream-dim)',
          border: '1px solid var(--border)',
        }}>
          {item.qty}
        </span>
      )}

      {/* Category chip */}
      <span style={{
        fontSize: '9px', fontWeight: 600, flexShrink: 0,
        padding: '2px 8px', borderRadius: '6px',
        background: cat.dim, color: cat.color,
        display: 'flex', alignItems: 'center', gap: '3px',
        whiteSpace: 'nowrap',
      }}>
        {cat.emoji} {cat.label}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        style={{
          width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cream-muted)', transition: 'all 0.15s var(--ease-spring)',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-dim)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
