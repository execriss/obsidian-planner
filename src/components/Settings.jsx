import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Eye, EyeOff, Key, ExternalLink } from 'lucide-react';
import { getApiKey, generateApiKey } from '../lib/db.js';
import styles from './Settings.module.css';

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
    <div className={styles.container}>
      <div className={styles.headerBlock}>
        <div className={styles.title}>Ajustes</div>
        <div className={styles.subtitle}>API & Cuenta</div>
      </div>

      {/* API Key card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.iconBox}>
            <Key size={15} color="var(--amber)" />
          </div>
          <div className={styles.cardTitleGroup}>
            <div>API Key</div>
            <div>Para conectar el planner con herramientas externas</div>
          </div>
          <a href={API_BASE} target="_blank" rel="noopener noreferrer" className={styles.docsLink}>
            Ver docs <ExternalLink size={11} />
          </a>
        </div>

        <div className={styles.divider} />

        {loading ? (
          <div className={styles.loadingText}>Cargando...</div>
        ) : (
          <>
            {apiKey ? (
              <div className={styles.keyRow}>
                <div className={styles.keyDisplay}>
                  {showKey ? apiKey.api_key : '•'.repeat(40)}
                </div>
                <button onClick={() => setShowKey(!showKey)} className={styles.iconBtn} title={showKey ? 'Ocultar' : 'Mostrar'}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => copy(apiKey.api_key)}
                  className={copied ? styles.iconBtnCopied : styles.iconBtn}
                  title="Copiar"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ) : (
              <p className={styles.noKeyText}>
                No tenés una API key todavía.
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`${apiKey ? styles.generateBtnSecondary : styles.generateBtnPrimary} ${generating ? styles.generateBtnDisabled : ''}`}
            >
              <RefreshCw size={13} className={generating ? styles.spinIcon : undefined} />
              {apiKey ? 'Regenerar key' : 'Generar API key'}
            </button>

            {apiKey && (
              <div className={styles.exampleBlock}>
                <div className={styles.exampleLabel}>Ejemplo de uso</div>
                <pre className={styles.exampleCode}>{`curl ${API_BASE}/tasks \\
  -H "Authorization: Bearer ${showKey ? apiKey.api_key : '<tu-api-key>'}"`}</pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* Account */}
      <div className={styles.accountCard}>
        <div className={styles.accountLabel}>Cuenta</div>
        <div className={styles.accountEmail}>{user.email}</div>
      </div>
    </div>
  );
}
