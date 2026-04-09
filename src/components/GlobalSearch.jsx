import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Calendar, StickyNote, Flame, FileKey2, ShoppingCart, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearch } from '../hooks/useSearch.js';
import styles from './GlobalSearch.module.css';

const SECTIONS = [
  { key: 'tasks',     label: 'Tareas',      icon: Calendar,     view: 'calendar' },
  { key: 'notes',     label: 'Notas',       icon: StickyNote,   view: 'notas' },
  { key: 'habits',    label: 'Hábitos',     icon: Flame,        view: 'habitos' },
  { key: 'documents', label: 'Documentos',  icon: FileKey2,     view: 'docs' },
  { key: 'grocery',   label: 'Compras',     icon: ShoppingCart, view: 'grocery' },
];

function getResultText(item, key) {
  switch (key) {
    case 'tasks':     return { primary: item.title,   secondary: item.date ? format(new Date(item.date + 'T00:00:00'), "d MMM", { locale: es }) : '' };
    case 'notes':     return { primary: item.title || item.content?.slice(0, 60) || 'Sin título', secondary: item.title ? item.content?.slice(0, 50) : '' };
    case 'habits':    return { primary: `${item.icon} ${item.name}`, secondary: '' };
    case 'documents': return { primary: item.name, secondary: item.number || '' };
    case 'grocery':   return { primary: item.name, secondary: item.done ? 'Comprado' : '' };
    default:          return { primary: '', secondary: '' };
  }
}

export default function GlobalSearch({ userId, isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { results, loading } = useSearch(userId, query);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Build flat list for keyboard nav
  const flatItems = useMemo(() => {
    return SECTIONS.flatMap(section => {
      const items = results[section.key] || [];
      return items.map(item => ({ ...item, _section: section }));
    });
  }, [results]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [flatItems.length]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && flatItems[activeIdx]) {
        handleSelect(flatItems[activeIdx]);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, flatItems, activeIdx]);

  const handleSelect = (item) => {
    const view = item._section.view;
    const extra = item._section.key === 'tasks' && item.date ? { date: item.date } : {};
    onNavigate(view, extra);
    onClose();
  };

  const hasResults = flatItems.length > 0;
  const showEmpty  = query.trim().length >= 2 && !loading && !hasResults;

  if (!isOpen) return null;

  // Group results by section for rendering
  const groups = SECTIONS
    .map(section => ({ section, items: results[section.key] || [] }))
    .filter(g => g.items.length > 0);

  let globalIdx = 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Input */}
        <div className={styles.inputRow}>
          <Search size={15} className={styles.searchIcon} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tareas, notas, hábitos, documentos…"
            className={styles.input}
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <div className={styles.spinner} />}
          {!loading && query && (
            <button onClick={() => setQuery('')} className={styles.clearBtn}>
              <X size={13} />
            </button>
          )}
          <kbd className={styles.escHint}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className={styles.results}>
          {!query.trim() && (
            <div className={styles.hint}>
              Escribí al menos 2 caracteres para buscar
            </div>
          )}

          {showEmpty && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <div className={styles.emptyText}>Sin resultados para <strong>"{query}"</strong></div>
            </div>
          )}

          {groups.map(({ section, items }) => {
            const Icon = section.icon;
            return (
              <div key={section.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <Icon size={11} />
                  {section.label}
                </div>
                {items.map(item => {
                  const idx = globalIdx++;
                  const isActive = idx === activeIdx;
                  const { primary, secondary } = getResultText(item, section.key);
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      className={`${styles.resultItem} ${isActive ? styles.resultItemActive : ''}`}
                      onClick={() => handleSelect({ ...item, _section: section })}
                      onMouseEnter={() => setActiveIdx(idx)}
                    >
                      <div className={styles.resultMain}>
                        <span className={styles.resultPrimary}>{primary}</span>
                        {secondary && <span className={styles.resultSecondary}>{secondary}</span>}
                      </div>
                      <ArrowRight size={12} className={styles.resultArrow} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {hasResults && (
          <div className={styles.footer}>
            <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
            <span><kbd>↵</kbd> abrir</span>
            <span><kbd>Esc</kbd> cerrar</span>
          </div>
        )}
      </div>
    </div>
  );
}
