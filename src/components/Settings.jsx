import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Eye, EyeOff, Key, ExternalLink, Users } from 'lucide-react';
import { getApiKey, generateApiKey } from '../lib/db.js';
import Collaborators from './Collaborators.jsx';
import styles from './Settings.module.css';

const API_BASE = 'https://api.exegestion.com';

const TABS = [
  { id: 'api',   label: 'API & Cuenta', icon: Key   },
  { id: 'collab', label: 'Colaboradores', icon: Users },
];

export default function Settings({ user, collab }) {
  const [activeTab, setActiveTab] = useState('api');
  const [apiKey, setApiKey]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showKey, setShowKey]     = useState(false);

  const pendingCount = collab?.incomingInvitations?.length ?? 0;

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
        <div className={styles.subtitle}>API & Colaboración</div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
          >
            <Icon size={13} />
            {label}
            {id === 'collab' && pendingCount > 0 && (
              <span className={styles.tabBadge}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── API & Cuenta tab ── */}
      {activeTab === 'api' && (
        <div className="tab-content">
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
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className={styles.iconBtn}
                      title={showKey ? 'Ocultar' : 'Mostrar'}
                    >
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
      )}

      {/* ── Colaboradores tab ── */}
      {activeTab === 'collab' && (
        <div className="tab-content">
          {collab
            ? <Collaborators collab={{ ...collab, userId: user.id }} />
            : <div className={styles.loadingText}>Cargando colaboraciones...</div>
          }
        </div>
      )}
    </div>
  );
}
