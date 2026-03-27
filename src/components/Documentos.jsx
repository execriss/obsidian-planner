import { useState } from 'react';
import { Copy, Check, Plus, Trash2, Pencil, Eye, EyeOff, FileKey2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useIsMobile } from '../hooks/useIsMobile.js';

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
  { name: 'DNI', cat: 'personal' }, { name: 'CUIL / CUIT', cat: 'financiero' },
  { name: 'Pasaporte', cat: 'personal' }, { name: 'CBU', cat: 'financiero' },
  { name: 'Alias CBU', cat: 'financiero' }, { name: 'Patente', cat: 'vehiculo' },
  { name: 'Número de seguro médico', cat: 'salud' }, { name: 'CUIL empleador', cat: 'laboral' },
];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const inputSt = {
  width: '100%', background: 'var(--obsidian-4)',
  border: '1px solid var(--border-light)', borderRadius: '10px',
  padding: '10px 14px', fontSize: '13px', color: 'var(--cream)',
  outline: 'none', transition: 'border-color 0.2s ease',
};

export default function Documentos() {
  const isMobile = useIsMobile();
  const [docs, setDocs] = useLocalStorage('docs', []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ name: '', number: '', cat: 'personal', notes: '', expires: '' });
  const [hidden, setHidden]     = useState(new Set(docs.map(d => d.id)));
  const [copied, setCopied]     = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const resetForm = () => { setForm({ name: '', number: '', cat: 'personal', notes: '', expires: '' }); setShowForm(false); setEditId(null); };

  const saveDoc = () => {
    if (!form.name.trim() || !form.number.trim()) return;
    if (editId) {
      setDocs(prev => prev.map(d => d.id === editId ? { ...d, ...form } : d));
      setEditId(null);
    } else {
      const id = uid();
      setDocs(prev => [...prev, { id, ...form }]);
      setHidden(prev => new Set([...prev, id]));
    }
    resetForm();
  };

  const deleteDoc = (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setDocs(prev => prev.filter(d => d.id !== id));
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const startEdit = (doc) => {
    setForm({ name: doc.name, number: doc.number, cat: doc.cat, notes: doc.notes || '', expires: doc.expires || '' });
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

  const mask = (str) => str.slice(0, 4) + '  •  •  •  •  •  •' + str.slice(-2);

  return (
    <div className="animate-viewIn" style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', animation: 'fadeDown 0.35s var(--ease-out) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6B8FD4, #4A6CB8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(107,143,212,0.25)',
            animation: 'float 3.5s ease-in-out infinite',
          }}>
            <FileKey2 size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Documentos
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--cream-muted)', marginTop: '3px' }}>
              {docs.length} documento{docs.length !== 1 ? 's' : ''} guardado{docs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            borderRadius: '10px', fontSize: '12px', fontWeight: 600,
            background: showForm ? 'rgba(107,143,212,0.15)' : 'var(--obsidian-3)',
            border: `1px solid ${showForm ? '#6B8FD4' : 'var(--border)'}`,
            color: showForm ? '#6B8FD4' : 'var(--cream)',
            transition: 'all 0.2s var(--ease-spring)',
          }}
        >
          <Plus size={13} style={{ transform: showForm ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s var(--ease-spring)' }} />
          Agregar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-spring" style={{
          background: 'var(--obsidian-3)', border: '1px solid var(--border-light)',
          borderRadius: '16px', padding: '20px', marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del documento" autoFocus style={inputSt}
              onFocus={e => e.target.style.borderColor = '#6B8FD4'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
            <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
              placeholder="Número / valor"
              onKeyDown={e => e.key === 'Enter' && saveDoc()}
              style={inputSt}
              onFocus={e => e.target.style.borderColor = '#6B8FD4'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
          </div>

          {/* Suggestions */}
          {!editId && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
              {SUGGESTIONS.map(s => (
                <button key={s.name} onClick={() => setForm(f => ({ ...f, name: s.name, cat: s.cat }))}
                  style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '10px',
                    border: '1px solid var(--border)', color: 'var(--cream-muted)',
                    background: form.name === s.name ? 'var(--obsidian-4)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}>
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Category */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {CATS.map(cat => (
              <button key={cat.id} onClick={() => setForm(f => ({ ...f, cat: cat.id }))} style={{
                padding: '7px 4px', borderRadius: '9px', fontSize: '9px', fontWeight: 600,
                border: `1px solid ${form.cat === cat.id ? cat.color : 'var(--border)'}`,
                background: form.cat === cat.id ? cat.dim : 'transparent',
                color: form.cat === cat.id ? cat.color : 'var(--cream-muted)',
                transition: 'all 0.18s var(--ease-spring)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              }}>
                <span style={{ fontSize: '14px' }}>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notas (opcional)" style={inputSt}
              onFocus={e => e.target.style.borderColor = '#6B8FD4'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
            <input value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))}
              placeholder="Vence (opcional)" style={inputSt}
              onFocus={e => e.target.style.borderColor = '#6B8FD4'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveDoc} style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              background: '#6B8FD4', color: 'white', fontSize: '12px', fontWeight: 700,
              transition: 'all 0.2s var(--ease-spring)',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >{editId ? 'Guardar cambios' : 'Agregar documento'}</button>
            <button onClick={resetForm} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--cream-muted)', fontSize: '12px' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {docs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', animation: 'fadeIn 0.4s ease both' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🪪</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--cream-dim)', marginBottom: '8px' }}>Sin documentos guardados</div>
          <p style={{ fontSize: '12px', color: 'var(--cream-muted)' }}>Guardá tus números de documento para tenerlos siempre a mano</p>
        </div>
      )}

      {/* Category groups */}
      {CATS.map(cat => {
        const catDocs = docs.filter(d => d.cat === cat.id);
        if (!catDocs.length) return null;
        return (
          <div key={cat.id} style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '14px' }}>{cat.emoji}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: cat.color }}>
                {cat.label}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {catDocs.map((doc, i) => (
                <div key={doc.id}
                  className={deletingIds.has(doc.id) ? 'item-out' : ''}
                  style={{
                    display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '12px',
                    padding: isMobile ? '12px' : '13px 16px', borderRadius: '12px',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    background: 'var(--obsidian-3)',
                    border: `1px solid ${cat.color}22`,
                    animation: `fadeUp 0.25s var(--ease-spring) ${i * 0.05}s both`,
                    transition: 'border-color 0.15s ease, transform 0.2s var(--ease-spring)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${cat.color}55`; e.currentTarget.style.transform = 'translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${cat.color}22`; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)', marginBottom: '3px' }}>{doc.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: hidden.has(doc.id) ? 'var(--cream-muted)' : cat.color, letterSpacing: '0.05em', transition: 'color 0.2s ease' }}>
                      {hidden.has(doc.id) ? mask(doc.number) : doc.number}
                    </div>
                    {doc.notes && <div style={{ fontSize: '10px', color: 'var(--cream-muted)', marginTop: '3px' }}>{doc.notes}</div>}
                  </div>
                  {doc.expires && (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--obsidian-4)', color: 'var(--cream-muted)', border: '1px solid var(--border)', flexShrink: 0 }}>
                      Vence {doc.expires}
                    </span>
                  )}
                  <IconBtn onClick={() => toggleHide(doc.id)} title={hidden.has(doc.id) ? 'Ver' : 'Ocultar'}>
                    {hidden.has(doc.id) ? <Eye size={13} /> : <EyeOff size={13} />}
                  </IconBtn>
                  <IconBtn onClick={() => copyNum(doc.id, doc.number)} title="Copiar">
                    {copied === doc.id ? <Check size={13} color="var(--sage)" /> : <Copy size={13} />}
                  </IconBtn>
                  <IconBtn onClick={() => startEdit(doc)} title="Editar"><Pencil size={13} /></IconBtn>
                  <IconBtn onClick={() => deleteDoc(doc.id)} title="Eliminar" danger><Trash2 size={13} /></IconBtn>
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
    <button onClick={onClick} title={title} style={{
      width: '28px', height: '28px', borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--cream-muted)', flexShrink: 0,
      transition: 'all 0.15s var(--ease-spring)',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = danger ? 'var(--coral)' : 'var(--cream)'; e.currentTarget.style.background = danger ? 'var(--coral-dim)' : 'var(--obsidian-4)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}
