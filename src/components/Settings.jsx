import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Eye, EyeOff, Key, ExternalLink, Users, Bell, BellOff } from 'lucide-react';
import { getApiKey, generateApiKey, savePushSubscription, deletePushSubscription, getPushSubscription } from '../lib/db.js';
import Collaborators from './Collaborators.jsx';
import styles from './Settings.module.css';

const API_BASE      = 'https://api.exegestion.com';
const VAPID_PUB_KEY = 'BPv9_P4oR5usEY6OqT1QWAIK3lSkd5bW2NdhWwZrVgSV7kwelOY3ERcRRiAUX0vESHPporbhEOWQEqhdu8c1I6s';

const TABS = [
  { id: 'api',   label: 'API & Cuenta',  icon: Key   },
  { id: 'collab', label: 'Colaboradores', icon: Users },
];

// ─── Notifications section ────────────────────────────────────────────────────

function NotificationsSection({ userId }) {
  const [status, setStatus]   = useState('loading'); // loading | on | off | unsupported
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    getPushSubscription(userId)
      .then(sub => setStatus(sub ? 'on' : 'off'))
      .catch(() => setStatus('off'));
  }, [userId]);

  const enable = async () => {
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('off'); setWorking(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUB_KEY),
      });
      await savePushSubscription(userId, sub.toJSON());
      setStatus('on');
    } catch (e) {
      console.error('Push subscribe error:', e);
    } finally {
      setWorking(false);
    }
  };

  const disable = async () => {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await deletePushSubscription(userId);
      setStatus('off');
    } catch (e) {
      console.error('Push unsubscribe error:', e);
    } finally {
      setWorking(false);
    }
  };

  if (status === 'unsupported') return null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconBox}>
          <Bell size={15} color="var(--blue)" />
        </div>
        <div className={styles.cardTitleGroup}>
          <div>Notificaciones</div>
          <div>Recordatorio diario a las 9:30 con el resumen de tareas</div>
        </div>
        <div className={`${styles.notifDot} ${status === 'on' ? styles.notifDotOn : styles.notifDotOff}`} />
      </div>

      <div className={styles.divider} />

      {status === 'loading' ? (
        <div className={styles.loadingText}>Verificando...</div>
      ) : (
        <div className={styles.notifBody}>
          <p className={styles.notifDesc}>
            {status === 'on'
              ? 'Recibís un resumen a las 9:30 AM con las tareas del día y las pendientes de ayer.'
              : 'Activá las notificaciones para recibir un resumen diario de tus tareas.'}
          </p>
          {status === 'off' ? (
            <button onClick={enable} disabled={working} className={styles.notifEnableBtn}>
              <Bell size={13} />
              {working ? 'Activando...' : 'Activar notificaciones'}
            </button>
          ) : (
            <button onClick={disable} disabled={working} className={styles.notifDisableBtn}>
              <BellOff size={13} />
              {working ? 'Desactivando...' : 'Desactivar'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ─── Main Settings ────────────────────────────────────────────────────────────

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
          {/* Notifications */}
          <NotificationsSection userId={user.id} />

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
