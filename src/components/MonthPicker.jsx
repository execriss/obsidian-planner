import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import styles from './MonthPicker.module.css';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TODAY_MONTH  = format(new Date(), 'yyyy-MM');

export default function MonthPicker({ month, budgetDate, onSelect, accentColor = 'var(--amber)' }) {
  const [open, setOpen]           = useState(false);
  const [pickerYear, setPickerYear] = useState(() => parseInt(month.slice(0, 4)));
  const wrapRef = useRef(null);

  useEffect(() => {
    if (open) setPickerYear(parseInt(month.slice(0, 4)));
  }, [open, month]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Seleccionar mes"
      >
        <span>{format(budgetDate, 'MMMM yyyy', { locale: es })}</span>
        <ChevronDown size={10} className={open ? styles.chevronOpen : ''} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.yearRow}>
            <button className={styles.yearBtn} onClick={() => setPickerYear(y => y - 1)}>
              <ChevronLeft size={13} />
            </button>
            <span className={styles.year}>{pickerYear}</span>
            <button className={styles.yearBtn} onClick={() => setPickerYear(y => y + 1)}>
              <ChevronRight size={13} />
            </button>
          </div>
          <div className={styles.grid}>
            {MONTH_LABELS.map((label, i) => {
              const m = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
              const isSelected = m === month;
              const isCurrent  = m === TODAY_MONTH;
              return (
                <button
                  key={label}
                  className={`${styles.cell} ${isSelected ? styles.cellSelected : ''} ${isCurrent && !isSelected ? styles.cellToday : ''}`}
                  style={isSelected ? { background: accentColor, color: 'var(--obsidian)' } : isCurrent ? { color: accentColor } : {}}
                  onClick={() => { onSelect(m); setOpen(false); }}
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
