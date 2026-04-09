import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, X, Delete, RotateCcw } from 'lucide-react';
import styles from './GroceryCalculator.module.css';

function fmtARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);
}

const ROWS = [
  ['7', '8', '9', 'backspace'],
  ['4', '5', '6', 'C'],
  ['1', '2', '3', '.'],
  ['0', '00', null, null], // last 2 slots = + button (span 2)
];

export default function GroceryCalculator() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [entries, setEntries] = useState([]);
  const [flash, setFlash]     = useState(false);
  const [pressed, setPressed] = useState(null);

  const total    = entries.reduce((s, e) => s + e, 0);
  const inputNum = parseFloat(input.replace(',', '.')) || 0;

  const handleKey = useCallback((key) => {
    setPressed(key);
    setTimeout(() => setPressed(null), 120);

    if (key === 'backspace') { setInput(p => p.slice(0, -1)); return; }
    if (key === 'C')         { setInput(''); return; }
    if (key === 'AC')        { setInput(''); setEntries([]); return; }

    if (key === '+') {
      if (inputNum <= 0) return;
      setEntries(p => [...p, inputNum]);
      setInput('');
      setFlash(true);
      setTimeout(() => setFlash(false), 350);
      return;
    }

    if (key === '.' || key === ',') {
      if (input.includes('.')) return;
      setInput(p => (p || '0') + '.');
      return;
    }
    if (key === '00') {
      if (!input || input === '0') return;
      if (input.replace(/\D/g, '').length >= 7) return;
      setInput(p => p + '00');
      return;
    }
    // digit
    if (input.replace(/\D/g, '').length >= 8) return;
    setInput(p => (p === '0' ? key : p + key));
  }, [input, inputNum]);

  const removeEntry = (idx) =>
    setEntries(p => p.filter((_, i) => i !== idx));

  const hasContent = entries.length > 0 || !!input;

  return createPortal(
    <>
      {/* ── FAB ─────────────────────────────────────────────── */}
      <button
        className={`${styles.fab} ${open ? styles.fabHidden : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Calculadora"
      >
        <Calculator size={22} strokeWidth={2} />
        {total > 0 && (
          <div className={styles.fabBadge}>{fmtARS(total)}</div>
        )}
      </button>

      {/* ── Drawer ──────────────────────────────────────────── */}
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />

          <div className={styles.drawer}>
            <div className={styles.handle} />

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.headerIcon}>
                  <Calculator size={15} color="var(--amber)" />
                </div>
                <span className={styles.headerTitle}>Calculadora de carrito</span>
              </div>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Total */}
            <div className={styles.totalArea}>
              <div className={styles.totalLabel}>TOTAL ACUMULADO</div>
              <div className={`${styles.totalValue} ${flash ? styles.totalFlash : ''}`}>
                {fmtARS(total)}
              </div>

              {entries.length > 0 && (
                <div className={styles.chips}>
                  {entries.map((e, i) => (
                    <button
                      key={i}
                      className={styles.chip}
                      style={{ animationDelay: `${i * 0.04}s` }}
                      onClick={() => removeEntry(i)}
                    >
                      {fmtARS(e)} <X size={8} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input display */}
            <div className={styles.inputDisplay}>
              <span className={`${styles.inputValue} ${!input ? styles.inputPlaceholder : ''}`}>
                {input ? `$ ${input}` : '$ 0'}
              </span>
              <span className={styles.cursor} />
            </div>

            {/* Keypad */}
            <div className={styles.keypad}>
              {ROWS.map((row, ri) => (
                <div key={ri} className={styles.keyRow}>
                  {row.map((key, ki) => {
                    if (key === null) return null;
                    const isBack  = key === 'backspace';
                    const isClear = key === 'C';
                    const isAction = isBack || isClear;
                    const isActive = pressed === key;
                    return (
                      <button
                        key={ki}
                        className={`${styles.key} ${isAction ? styles.keyAction : ''} ${isActive ? styles.keyPressed : ''}`}
                        onPointerDown={() => handleKey(key)}
                      >
                        {isBack ? <Delete size={18} strokeWidth={2} /> : key}
                      </button>
                    );
                  })}

                  {/* + button occupies last 2 slots of row 4 */}
                  {ri === 3 && (
                    <button
                      className={`${styles.keyAdd} ${inputNum > 0 ? styles.keyAddActive : ''}`}
                      onPointerDown={() => handleKey('+')}
                    >
                      {inputNum > 0 ? `+ ${fmtARS(inputNum)}` : '+ Agregar'}
                    </button>
                  )}
                </div>
              ))}

              {/* AC row — always rendered to avoid layout shift */}
              <button
                className={`${styles.keyAC} ${!hasContent ? styles.keyACHidden : ''}`}
                onPointerDown={() => hasContent && handleKey('AC')}
              >
                <RotateCcw size={13} strokeWidth={2} />
                Limpiar todo
              </button>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}
