import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Pin, PinOff, StickyNote } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = [
  { id: 'amber',  label: 'Ámbar',   accent: '#F0A500', bg: 'rgba(240,165,0,0.07)',   border: 'rgba(240,165,0,0.25)' },
  { id: 'sage',   label: 'Verde',   accent: '#5FAD8E', bg: 'rgba(95,173,142,0.07)',  border: 'rgba(95,173,142,0.25)' },
  { id: 'coral',  label: 'Coral',   accent: '#E05C5C', bg: 'rgba(224,92,92,0.07)',   border: 'rgba(224,92,92,0.25)' },
  { id: 'blue',   label: 'Azul',    accent: '#6B8FD4', bg: 'rgba(107,143,212,0.07)', border: 'rgba(107,143,212,0.25)' },
  { id: 'purple', label: 'Violeta', accent: '#A47BD4', bg: 'rgba(164,123,212,0.07)', border: 'rgba(164,123,212,0.25)' },
  { id: 'muted',  label: 'Neutro',  accent: '#7A7060', bg: 'rgba(122,112,96,0.07)',  border: 'rgba(122,112,96,0.2)' },
];
const colorById = Object.fromEntries(COLORS.map(c => [c.id, c]));

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function QuickNotes() {
  const isMobile = useIsMobile();
  const [notes, setNotes] = useLocalStorage('quick_notes', []);
  const [showNew, setShowNew]   = useState(false);
  const [editId, setEditId]     = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('amber');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const textareaRef = useRef(null);

  const pinned   = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);

  const saveNote = () => {
    if (!newContent.trim() && !newTitle.trim()) return;
    if (editId) {
      setNotes(prev => prev.map(n => n.id === editId
        ? { ...n, title: newTitle, content: newContent, color: newColor, updatedAt: new Date().toISOString() }
        : n
      ));
      setEditId(null);
    } else {
      setNotes(prev => [{
        id: uid(), title: newTitle, content: newContent,
        color: newColor, pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, ...prev]);
    }
    setNewTitle(''); setNewContent(''); setNewColor('amber'); setShowNew(false);
  };

  const startEdit = (note) => {
    setNewTitle(note.title || '');
    setNewContent(note.content);
    setNewColor(note.color || 'amber');
    setEditId(note.id);
    setShowNew(true);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const togglePin = (id) => setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const deleteNote = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setNotes(prev => prev.filter(n => n.id !== id));
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const cancel = () => {
    setNewTitle(''); setNewContent(''); setNewColor('amber');
    setShowNew(false); setEditId(null);
  };

  return (
    <div className="animate-viewIn" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', animation: 'fadeDown 0.35s var(--ease-out) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #F0A500, #C88500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(240,165,0,0.25)',
            animation: 'float 3.5s ease-in-out infinite',
          }}>
            <StickyNote size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Notas rápidas
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--cream-muted)', marginTop: '3px' }}>
              {notes.length} nota{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => { cancel(); setShowNew(!showNew); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            borderRadius: '10px', fontSize: '12px', fontWeight: 600,
            background: showNew ? 'rgba(240,165,0,0.12)' : 'var(--obsidian-3)',
            border: `1px solid ${showNew ? 'var(--amber-dim)' : 'var(--border)'}`,
            color: showNew ? 'var(--amber)' : 'var(--cream)',
            transition: 'all 0.2s var(--ease-spring)',
          }}
        >
          <Plus size={13} style={{ transform: showNew ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s var(--ease-spring)' }} />
          Nueva nota
        </button>
      </div>

      {/* New / edit note form */}
      {showNew && (
        <div className="form-spring" style={{
          background: colorById[newColor].bg,
          border: `1px solid ${colorById[newColor].border}`,
          borderRadius: '16px', padding: '20px', marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          borderLeft: `4px solid ${colorById[newColor].accent}`,
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Título (opcional)"
            style={{
              width: '100%', background: 'transparent', border: 'none',
              fontSize: '16px', fontWeight: 700, color: colorById[newColor].accent,
              outline: 'none', marginBottom: '10px', fontFamily: 'var(--font-display)',
            }}
          />
          <textarea
            ref={textareaRef}
            autoFocus={!editId}
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveNote(); if (e.key === 'Escape') cancel(); }}
            placeholder="Escribí tu nota acá... (Ctrl+Enter para guardar)"
            rows={5}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              fontSize: '13px', color: 'var(--cream)', outline: 'none',
              resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--font-body)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {COLORS.map(c => (
                <button key={c.id} onClick={() => setNewColor(c.id)} style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: c.accent,
                  border: `2px solid ${newColor === c.id ? 'white' : 'transparent'}`,
                  transform: newColor === c.id ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.18s var(--ease-spring)',
                  boxShadow: newColor === c.id ? `0 0 8px ${c.accent}66` : 'none',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={cancel} style={{ padding: '7px 14px', borderRadius: '9px', border: '1px solid var(--border)', color: 'var(--cream-muted)', fontSize: '12px' }}>Cancelar</button>
              <button onClick={saveNote} style={{
                padding: '7px 18px', borderRadius: '9px', fontSize: '12px', fontWeight: 700,
                background: colorById[newColor].accent, color: 'white',
                transition: 'all 0.2s var(--ease-spring)',
                boxShadow: `0 4px 14px ${colorById[newColor].accent}44`,
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {editId ? 'Guardar' : 'Agregar nota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {notes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', animation: 'fadeIn 0.4s ease both' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>📝</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--cream-dim)', marginBottom: '8px' }}>Sin notas todavía</div>
          <p style={{ fontSize: '12px', color: 'var(--cream-muted)' }}>Capturá ideas, recordatorios o cualquier cosa que quieras guardar</p>
        </div>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cream-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Pin size={10} /> Fijadas
          </div>
          <NoteGrid notes={pinned} deletingIds={deletingIds} onEdit={startEdit} onTogglePin={togglePin} onDelete={deleteNote} isMobile={isMobile} />
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cream-muted)', marginBottom: '10px' }}>
              Otras notas
            </div>
          )}
          <NoteGrid notes={unpinned} deletingIds={deletingIds} onEdit={startEdit} onTogglePin={togglePin} onDelete={deleteNote} isMobile={isMobile} />
        </div>
      )}
    </div>
  );
}

function NoteGrid({ notes, deletingIds, onEdit, onTogglePin, onDelete, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '12px',
    }}>
      {notes.map((note, i) => {
        const c = colorById[note.color] || colorById['amber'];
        return (
          <div
            key={note.id}
            className={deletingIds.has(note.id) ? 'item-out' : ''}
            style={{
              background: c.bg, border: `1px solid ${c.border}`,
              borderRadius: '14px', padding: '16px',
              borderLeft: `4px solid ${c.accent}`,
              animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.04}s both`,
              transition: 'transform 0.2s var(--ease-spring), box-shadow 0.2s ease',
              cursor: 'pointer', position: 'relative',
            }}
            onClick={() => onEdit(note)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${c.accent}44`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {note.title && (
              <div style={{ fontSize: '13px', fontWeight: 700, color: c.accent, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                {note.title}
              </div>
            )}
            <div style={{
              fontSize: '12px', color: 'var(--cream-dim)', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {note.content}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <span style={{ fontSize: '9px', color: 'var(--cream-muted)' }}>
                {format(new Date(note.updatedAt), "d MMM yyyy", { locale: es })}
              </span>
              <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                <NoteBtn onClick={() => onTogglePin(note.id)} accent={c.accent}>
                  {note.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                </NoteBtn>
                <NoteBtn onClick={() => onDelete(note.id)} danger>
                  <Trash2 size={11} />
                </NoteBtn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NoteBtn({ children, onClick, danger, accent }) {
  return (
    <button onClick={onClick} style={{
      width: '24px', height: '24px', borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--cream-muted)', transition: 'all 0.15s var(--ease-spring)',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = danger ? 'var(--coral)' : (accent || 'var(--cream)'); e.currentTarget.style.background = danger ? 'var(--coral-dim)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}
