import { useState, useRef } from 'react';
import { Plus, Trash2, Pin, PinOff, StickyNote } from 'lucide-react';
import { useNotes } from '../hooks/useNotes.js';
import { useMinLoading } from '../hooks/useMinLoading.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './QuickNotes.module.css';
import SectionSkeleton from './SectionSkeleton.jsx';

const COLORS = [
  { id: 'amber',  label: 'Ámbar',   accent: '#F0A500', bg: 'rgba(240,165,0,0.07)',   border: 'rgba(240,165,0,0.25)' },
  { id: 'sage',   label: 'Verde',   accent: '#5FAD8E', bg: 'rgba(95,173,142,0.07)',  border: 'rgba(95,173,142,0.25)' },
  { id: 'coral',  label: 'Coral',   accent: '#E05C5C', bg: 'rgba(224,92,92,0.07)',   border: 'rgba(224,92,92,0.25)' },
  { id: 'blue',   label: 'Azul',    accent: '#6B8FD4', bg: 'rgba(107,143,212,0.07)', border: 'rgba(107,143,212,0.25)' },
  { id: 'purple', label: 'Violeta', accent: '#A47BD4', bg: 'rgba(164,123,212,0.07)', border: 'rgba(164,123,212,0.25)' },
  { id: 'muted',  label: 'Neutro',  accent: '#7A7060', bg: 'rgba(122,112,96,0.07)',  border: 'rgba(122,112,96,0.2)' },
];
const colorById = Object.fromEntries(COLORS.map(c => [c.id, c]));

export default function QuickNotes({ userId }) {
  const { notes, loading: dataLoading, addNote, editNote, removeNote, pinNote } = useNotes(userId);
  const loading = useMinLoading(dataLoading);
  const [showNew, setShowNew]       = useState(false);
  const [editId, setEditId]         = useState(null);
  const [newTitle, setNewTitle]     = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor]     = useState('amber');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const textareaRef = useRef(null);

  const pinned   = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);

  const saveNote = async () => {
    if (!newContent.trim() && !newTitle.trim()) return;
    if (editId) {
      await editNote(editId, { title: newTitle, content: newContent, color: newColor });
      setEditId(null);
    } else {
      await addNote({ title: newTitle, content: newContent, color: newColor });
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

  const togglePin = (id) => pinNote(id);

  const deleteNote = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      removeNote(id);
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const cancel = () => {
    setNewTitle(''); setNewContent(''); setNewColor('amber');
    setShowNew(false); setEditId(null);
  };

  const activeColor = colorById[newColor];

  if (loading) return <SectionSkeleton variant="notes" />;

  return (
    <div className={`animate-viewIn ${styles.container}`}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <StickyNote size={18} color="white" />
          </div>
          <div>
            <h1 className={styles.title}>Notas rápidas</h1>
            <p className={styles.count}>
              {notes.length} nota{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => { cancel(); setShowNew(!showNew); }}
          className={`${styles.addBtn} ${showNew ? styles.addBtnActive : ''}`}
        >
          <Plus size={13} className={`${styles.plusIcon} ${showNew ? styles.plusIconRotated : ''}`} />
          Nueva nota
        </button>
      </div>

      {/* Form */}
      {showNew && (
        <div
          className={`form-spring ${styles.form}`}
          style={{
            '--note-accent': activeColor.accent,
            '--note-bg':     activeColor.bg,
            '--note-border': activeColor.border,
          }}
        >
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Título (opcional)"
            className={styles.formTitleInput}
          />
          <textarea
            ref={textareaRef}
            autoFocus={!editId}
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveNote(); if (e.key === 'Escape') cancel(); }}
            placeholder="Escribí tu nota acá... (Ctrl+Enter para guardar)"
            rows={5}
            className={styles.formTextarea}
          />
          <div className={styles.formFooter}>
            <div className={styles.colorPicker}>
              {COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setNewColor(c.id)}
                  className={`${styles.colorDot} ${newColor === c.id ? styles.colorDotSelected : ''}`}
                  style={{
                    '--dot-color': c.accent,
                    '--dot-glow':  `0 0 8px ${c.accent}66`,
                  }}
                />
              ))}
            </div>
            <div className={styles.formActions}>
              <button onClick={cancel} className={styles.cancelBtn}>Cancelar</button>
              <button
                onClick={saveNote}
                className={styles.saveBtn}
                style={{ '--save-glow': `0 4px 14px ${activeColor.accent}44` }}
              >
                {editId ? 'Guardar' : 'Agregar nota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {notes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>📝</div>
          <div className={styles.emptyTitle}>Sin notas todavía</div>
          <p className={styles.emptyText}>Capturá ideas, recordatorios o cualquier cosa que quieras guardar</p>
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <Pin size={10} /> Fijadas
          </div>
          <NoteGrid notes={pinned} deletingIds={deletingIds} onEdit={startEdit} onTogglePin={togglePin} onDelete={deleteNote} />
        </div>
      )}

      {/* Other notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <div className={styles.sectionLabel}>Otras notas</div>}
          <NoteGrid notes={unpinned} deletingIds={deletingIds} onEdit={startEdit} onTogglePin={togglePin} onDelete={deleteNote} />
        </div>
      )}
    </div>
  );
}

function NoteGrid({ notes, deletingIds, onEdit, onTogglePin, onDelete }) {
  return (
    <div className={styles.noteGrid}>
      {notes.map((note, i) => {
        const c = colorById[note.color] || colorById['amber'];
        return (
          <div
            key={note.id}
            className={`${styles.noteCard} ${deletingIds.has(note.id) ? 'item-out' : ''}`}
            style={{
              '--note-accent':    c.accent,
              '--note-bg':        c.bg,
              '--note-border':    c.border,
              '--note-accent-44': `${c.accent}44`,
              animationDelay:     `${i * 0.04}s`,
              animationName:      'fadeUp',
              animationDuration:  '0.25s',
              animationTimingFunction: 'var(--ease-spring)',
              animationFillMode:  'both',
            }}
            onClick={() => onEdit(note)}
          >
            {note.title && <div className={styles.noteTitle}>{note.title}</div>}
            <div className={styles.noteContent}>{note.content}</div>
            <div className={styles.noteFooter}>
              <span className={styles.noteDate}>
                {format(new Date(note.updatedAt), 'd MMM yyyy', { locale: es })}
              </span>
              <div className={styles.noteActions} onClick={e => e.stopPropagation()}>
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

function NoteBtn({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.noteBtn} ${danger ? styles.noteBtnDanger : ''}`}
    >
      {children}
    </button>
  );
}
