import { useState, useRef } from 'react';
import { Copy, Check, Plus, Trash2, Pencil, Eye, EyeOff, FileKey2, Paperclip, Download, X } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments.js';
import { getDocumentFileUrl } from '../lib/db.js';
import styles from './Documents.module.css';
import SectionSkeleton from './SectionSkeleton.jsx';
import { useMinLoading } from '../hooks/useMinLoading.js';

const CATS = [
  { id: 'personal',   label: 'Personal',   emoji: '🪪', color: '#6B8FD4', dim: 'rgba(107,143,212,0.15)' },
  { id: 'financiero', label: 'Financiero',  emoji: '💳', color: '#F0A500', dim: 'rgba(240,165,0,0.15)' },
  { id: 'vehiculo',   label: 'Vehículo',    emoji: '🚗', color: '#5FAD8E', dim: 'rgba(95,173,142,0.15)' },
  { id: 'salud',      label: 'Salud',       emoji: '🏥', color: '#E05C5C', dim: 'rgba(224,92,92,0.15)' },
  { id: 'laboral',    label: 'Laboral',     emoji: '💼', color: '#A47BD4', dim: 'rgba(164,123,212,0.15)' },
  { id: 'otro',       label: 'Otro',        emoji: '📄', color: '#7A7060', dim: 'rgba(122,112,96,0.15)' },
];
const catById = Object.fromEntries(CATS.map(c => [c.id, c]));

const SUGGESTIONS = [
  { name: 'DNI', cat: 'personal' },           { name: 'CUIL / CUIT', cat: 'financiero' },
  { name: 'Pasaporte', cat: 'personal' },      { name: 'CBU', cat: 'financiero' },
  { name: 'Alias CBU', cat: 'financiero' },    { name: 'Patente', cat: 'vehiculo' },
  { name: 'Número de seguro médico', cat: 'salud' }, { name: 'CUIL empleador', cat: 'laboral' },
];

const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.zip';

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents({ userId }) {
  const { docs, loading: dataLoading, addDoc, editDoc, removeDoc } = useDocuments(userId);
  const loading = useMinLoading(dataLoading);

  const [showForm, setShowForm]           = useState(false);
  const [editId, setEditId]               = useState(null);
  const [form, setForm]                   = useState({ name: '', number: '', cat: 'personal', notes: '', expires: '' });
  const [file, setFile]                   = useState(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const [hidden, setHidden]               = useState(new Set());
  const [copied, setCopied]               = useState(null);
  const [deletingIds, setDeletingIds]     = useState(new Set());
  const [saving, setSaving]               = useState(false);
  const fileInputRef                      = useRef(null);

  const resetForm = () => {
    setForm({ name: '', number: '', cat: 'personal', notes: '', expires: '' });
    setFile(null);
    setRemoveExistingFile(false);
    setShowForm(false);
    setEditId(null);
  };

  const saveDoc = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const fileOpt = file
          ? { file }
          : removeExistingFile ? { remove: true } : undefined;
        await editDoc(editId, form, fileOpt);
        setEditId(null);
      } else {
        const created = await addDoc(form, file || undefined);
        if (created) setHidden(prev => new Set([...prev, created.id]));
      }
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteDoc = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      removeDoc(id);
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const startEdit = (doc) => {
    setForm({ name: doc.name, number: doc.number || '', cat: doc.cat, notes: doc.notes || '', expires: doc.expires || '' });
    setFile(null);
    setRemoveExistingFile(false);
    setEditId(doc.id);
    setShowForm(true);
  };

  const copyNum = (id, num) => {
    navigator.clipboard.writeText(num);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const toggleHide = (id) => setHidden(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const mask = (str) => {
    if (!str || str.length <= 4) return str;
    return str.slice(0, 4) + '  •  •  •  •  •  •' + str.slice(-2);
  };

  const downloadDoc = async (doc) => {
    try {
      const url = await getDocumentFileUrl(doc.filePath);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  const editingDoc = editId ? docs.find(d => d.id === editId) : null;
  const hasExistingFile = editingDoc?.fileName && !removeExistingFile;

  if (loading) return <SectionSkeleton variant="rows" count={5} />;

  return (
    <div className={`animate-viewIn ${styles.container}`}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FileKey2 size={18} color="white" />
          </div>
          <div>
            <h1 className={styles.title}>Documentos</h1>
            <p className={styles.subtitle}>
              {docs.length} documento{docs.length !== 1 ? 's' : ''} guardado{docs.length !== 1 ? 's' : ''}
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

      {/* Form */}
      {showForm && (
        <div className={`form-spring ${styles.form}`}>
          <div className={styles.formGrid2}>
            <input
              value={form.name} autoFocus
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del documento"
              className={styles.input}
            />
            <input
              value={form.number}
              onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
              placeholder="Número / valor (opcional)"
              className={styles.input}
            />
          </div>

          {!editId && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s.name}
                  onClick={() => setForm(f => ({ ...f, name: s.name, cat: s.cat }))}
                  className={`${styles.suggestionChip} ${form.name === s.name ? styles.suggestionChipActive : ''}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div className={styles.catGrid}>
            {CATS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setForm(f => ({ ...f, cat: cat.id }))}
                className={`${styles.catBtn} ${form.cat === cat.id ? styles.catBtnActive : ''}`}
                style={form.cat === cat.id ? { '--cat-color': cat.color, '--cat-dim': cat.dim } : {}}
              >
                <span className={styles.catEmoji}>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className={styles.formGrid2Bottom}>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notas (opcional)"
              className={styles.input}
            />
            <input
              value={form.expires}
              onChange={e => setForm(f => ({ ...f, expires: e.target.value }))}
              placeholder="Vence (opcional)"
              className={styles.input}
            />
          </div>

          {/* File attachment */}
          <div className={styles.fileArea}>
            {hasExistingFile && (
              <div className={styles.fileChipRow}>
                <div className={styles.fileChip}>
                  <Paperclip size={10} />
                  <span className={styles.fileChipName}>{editingDoc.fileName}</span>
                  <span className={styles.fileChipSize}>{formatFileSize(editingDoc.fileSize)}</span>
                  <button
                    className={styles.fileChipRemove}
                    onClick={() => { setRemoveExistingFile(true); setFile(null); }}
                    title="Quitar archivo"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            )}
            {removeExistingFile && !file && (
              <p className={styles.fileRemoveNote}>El archivo será eliminado al guardar.</p>
            )}
            {file ? (
              <div className={styles.fileChipRow}>
                <div className={`${styles.fileChip} ${styles.fileChipNew}`}>
                  <Paperclip size={10} />
                  <span className={styles.fileChipName}>{file.name}</span>
                  <span className={styles.fileChipSize}>{formatFileSize(file.size)}</span>
                  <button
                    className={styles.fileChipRemove}
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    title="Quitar"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            ) : (
              <label className={styles.fileLabel}>
                <Paperclip size={11} />
                {hasExistingFile ? 'Reemplazar archivo' : 'Adjuntar archivo'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILES}
                  className={styles.fileInput}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setFile(f); setRemoveExistingFile(false); }
                  }}
                />
              </label>
            )}
          </div>

          <div className={styles.formActions}>
            <button onClick={saveDoc} disabled={saving || !form.name.trim()} className={styles.submitBtn}>
              {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar documento'}
            </button>
            <button onClick={resetForm} className={styles.cancelBtn}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Empty */}
      {docs.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🪪</div>
          <div className={styles.emptyTitle}>Sin documentos guardados</div>
          <p className={styles.emptyDesc}>Guardá tus números de documento para tenerlos siempre a mano</p>
        </div>
      )}

      {/* Category groups */}
      {CATS.map(cat => {
        const catDocs = docs.filter(d => d.cat === cat.id);
        if (!catDocs.length) return null;
        const catVars = { '--cat-color': cat.color, '--cat-dim': cat.dim };
        return (
          <div key={cat.id} className={styles.catGroup} style={catVars}>
            <div className={styles.catGroupHeader}>
              <span className={styles.catGroupEmoji}>{cat.emoji}</span>
              <span className={styles.catGroupLabel}>{cat.label}</span>
            </div>
            <div className={styles.docList}>
              {catDocs.map((doc, i) => (
                <div
                  key={doc.id}
                  className={`${styles.docRow} ${deletingIds.has(doc.id) ? 'item-out' : ''}`}
                  style={{
                    '--cat-color':        cat.color,
                    '--cat-border':       `${cat.color}22`,
                    '--cat-border-hover': `${cat.color}55`,
                    animationDelay:       `${i * 0.05}s`,
                    animationName:        'fadeUp',
                    animationDuration:    '0.25s',
                    animationTimingFunction: 'var(--ease-spring)',
                    animationFillMode:    'both',
                  }}
                >
                  <div className={styles.docInfo}>
                    <div className={styles.docName}>{doc.name}</div>
                    {doc.number && (
                      <div className={`${styles.docNumber} ${hidden.has(doc.id) ? styles.docNumberHidden : ''}`}>
                        {hidden.has(doc.id) ? mask(doc.number) : doc.number}
                      </div>
                    )}
                    {doc.notes && <div className={styles.docNotes}>{doc.notes}</div>}
                    {doc.fileName && (
                      <div className={styles.docFile}>
                        <Paperclip size={9} />
                        {doc.fileName}
                        {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                      </div>
                    )}
                  </div>
                  {doc.expires && (
                    <span className={styles.expiresBadge}>Vence {doc.expires}</span>
                  )}
                  {doc.number && (
                    <IconBtn onClick={() => toggleHide(doc.id)} title={hidden.has(doc.id) ? 'Ver' : 'Ocultar'}>
                      {hidden.has(doc.id) ? <Eye size={13} /> : <EyeOff size={13} />}
                    </IconBtn>
                  )}
                  {doc.number && (
                    <IconBtn onClick={() => copyNum(doc.id, doc.number)} title="Copiar número">
                      {copied === doc.id ? <Check size={13} color="var(--sage)" /> : <Copy size={13} />}
                    </IconBtn>
                  )}
                  {doc.filePath && (
                    <IconBtn onClick={() => downloadDoc(doc)} title={`Descargar ${doc.fileName}`}>
                      <Download size={13} />
                    </IconBtn>
                  )}
                  <IconBtn onClick={() => startEdit(doc)} title="Editar">
                    <Pencil size={13} />
                  </IconBtn>
                  <IconBtn onClick={() => deleteDoc(doc.id)} title="Eliminar" danger>
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IconBtn({ children, onClick, danger, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`${styles.iconBtn} ${danger ? styles.iconBtnDanger : ''}`}
    >
      {children}
    </button>
  );
}
