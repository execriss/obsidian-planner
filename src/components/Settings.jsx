import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Eye, EyeOff, Key, ExternalLink } from 'lucide-react';
import { getApiKey, generateApiKey } from '../lib/db.js';

const API_BASE = 'https://api.exegestion.com';

export default function Settings({ user }) {
  const [apiKey, setApiKey]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showKey, setShowKey]     = useState(false);

  useEffect(() => {
    getApiKey(user.id).then(data => { setApiKey(data); setLoading(false); });
  }, [user.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    const data = await generateApiKey(user.id);
    setApiKey(data);
    setShowKey(true);
    setGenerating(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ animation: 'scaleIn 0.3s ease', maxWidth: '560px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.02em' }}>
          Ajustes
        </div>
        <div style={{ fontSize: '11px', color: 'var(--cream-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>
          API & Cuenta
        </div>
      </div>

      {/* API Key card */}
      <div style={{ background: 'var(--obsidian-3)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--amber-glow)', border: '1px solid var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={15} color="var(--amber)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>API Key</div>
            <div style={{ fontSize: '11px', color: 'var(--cream-muted)' }}>
              Para conectar el planner con herramientas externas
            </div>
          </div>
          <a
            href={API_BASE}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--amber)', textDecoration: 'none' }}
          >
            Ver docs <ExternalLink size={11} />
          </a>
        </div>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />

        {loading ? (
          <div style={{ color: 'var(--cream-muted)', fontSize: '13px' }}>Cargando...</div>
        ) : (
          <>
            {apiKey ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px',
                  background: 'var(--obsidian-4)', border: '1px solid var(--border)',
                  fontSize: '12px', fontFamily: 'monospace', color: 'var(--amber)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {showKey ? apiKey.api_key : '•'.repeat(40)}
                </div>
                <button onClick={() => setShowKey(!showKey)} style={iconBtn} title={showKey ? 'Ocultar' : 'Mostrar'}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => copy(apiKey.api_key)}
                  style={{ ...iconBtn, color: copied ? 'var(--sage)' : 'var(--cream-muted)' }}
                  title="Copiar"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--cream-muted)', fontStyle: 'italic', marginBottom: '16px' }}>
                No tenés una API key todavía.
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '9px 18px', borderRadius: '10px',
                background: apiKey ? 'transparent' : 'var(--amber)',
                color: apiKey ? 'var(--cream-muted)' : 'var(--obsidian)',
                border: apiKey ? '1px solid var(--border-light)' : 'none',
                fontSize: '12px', fontWeight: 600,
                opacity: generating ? 0.7 : 1,
                transition: 'all 0.2s var(--ease-spring)',
              }}
            >
              <RefreshCw size={13} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
              {apiKey ? 'Regenerar key' : 'Generar API key'}
            </button>

            {apiKey && (
              <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: 'var(--obsidian-4)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--cream-muted)', marginBottom: '8px', fontWeight: 600 }}>Ejemplo de uso</div>
                <pre style={{ fontSize: '11px', color: 'var(--cream-dim)', fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.6, margin: 0 }}>{`curl ${API_BASE}/tasks \\
  -H "Authorization: Bearer ${showKey ? apiKey.api_key : '<tu-api-key>'}"`}</pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* Account */}
      <div style={{ background: 'var(--obsidian-3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--cream-muted)' }}>Cuenta</div>
        <div style={{ fontSize: '13px', color: 'var(--cream)', marginTop: '4px' }}>{user.email}</div>
      </div>
    </div>
  );
}

const iconBtn = {
  width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--cream-muted)', background: 'var(--obsidian-4)',
  border: '1px solid var(--border)', transition: 'all 0.15s ease',
};
