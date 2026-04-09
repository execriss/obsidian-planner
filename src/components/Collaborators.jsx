import { useState } from 'react';
import {
  Users, UserPlus, Mail, Check, X, Trash2, Clock,
  ShoppingCart, Wallet, ChevronDown, AlertCircle,
} from 'lucide-react';
import styles from './Collaborators.module.css';

const SHAREABLE_SECTIONS = [
  { id: 'grocery', label: 'Compras',      icon: ShoppingCart },
  { id: 'budget',  label: 'Presupuesto',  icon: Wallet },
];

function SectionChip({ sectionId }) {
  const section = SHAREABLE_SECTIONS.find(s => s.id === sectionId);
  if (!section) return null;
  const Icon = section.icon;
  return (
    <span className={styles.chip} data-section={sectionId}>
      <Icon size={10} />
      {section.label}
    </span>
  );
}

export default function Collaborators({ collab }) {
  const {
    collaborations,
    incomingInvitations,
    sentInvitations,
    invite,
    accept,
    reject,
    revoke,
    removeCollab,
  } = collab;

  const [showForm,       setShowForm]       = useState(false);
  const [inviteEmail,    setInviteEmail]     = useState('');
  const [inviteSections, setInviteSections] = useState(['grocery']);
  const [sending,        setSending]        = useState(false);
  const [successMsg,     setSuccessMsg]     = useState('');
  const [errorMsg,       setErrorMsg]       = useState('');
  const [acceptingIds,   setAcceptingIds]   = useState(new Set());
  const [rejectingIds,   setRejectingIds]   = useState(new Set());
  const [removingIds,    setRemovingIds]    = useState(new Set());

  const ownedCollabs      = collaborations.filter(c => c.ownerId       === collab.userId);
  const receivedCollabs   = collaborations.filter(c => c.collaboratorId === collab.userId);
  const pendingIncoming   = incomingInvitations;
  const pendingSent       = sentInvitations.filter(i => i.status === 'pending');

  const toggleSection = (id) => {
    setInviteSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || inviteSections.length === 0) return;
    setSending(true);
    setErrorMsg('');
    try {
      await invite(inviteEmail.trim().toLowerCase(), inviteSections);
      setSuccessMsg(`Invitación enviada a ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteSections(['grocery']);
      setShowForm(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo enviar la invitación');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (id) => {
    setAcceptingIds(prev => new Set(prev).add(id));
    try { await accept(id); }
    catch (err) { console.error(err); }
    finally { setAcceptingIds(prev => { const s = new Set(prev); s.delete(id); return s; }); }
  };

  const handleReject = async (id) => {
    setRejectingIds(prev => new Set(prev).add(id));
    try { await reject(id); }
    catch (err) { console.error(err); }
    finally { setRejectingIds(prev => { const s = new Set(prev); s.delete(id); return s; }); }
  };

  const handleRevoke = async (id) => {
    setRemovingIds(prev => new Set(prev).add(id));
    try { await revoke(id); }
    catch (err) { console.error(err); }
    finally { setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s; }); }
  };

  const handleRemoveCollab = async (id) => {
    setRemovingIds(prev => new Set(prev).add(id));
    try { await removeCollab(id); }
    catch (err) { console.error(err); }
    finally { setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s; }); }
  };

  // Group owned collaborations by collaborator email
  const collabsByCollaborator = ownedCollabs.reduce((acc, c) => {
    const key = c.collaboratorEmail;
    if (!acc[key]) acc[key] = { email: key, collaboratorId: c.collaboratorId, items: [] };
    acc[key].items.push(c);
    return acc;
  }, {});

  // Group received collaborations by owner email
  const collabsByOwner = receivedCollabs.reduce((acc, c) => {
    const key = c.ownerEmail;
    if (!acc[key]) acc[key] = { email: key, ownerId: c.ownerId, items: [] };
    acc[key].items.push(c);
    return acc;
  }, {});

  return (
    <div className={styles.container}>

      {/* ── Pending incoming invitations ── */}
      {pendingIncoming.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionDot} data-color="amber" />
            <h3 className={styles.sectionTitle}>
              Invitaciones pendientes
            </h3>
            <span className={styles.badge}>{pendingIncoming.length}</span>
          </div>

          <div className={styles.inviteList}>
            {pendingIncoming.map((inv, i) => (
              <div
                key={inv.id}
                className={styles.inviteCard}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className={styles.inviteCardTop}>
                  <div className={styles.avatarSmall}>
                    {inv.inviterEmail[0].toUpperCase()}
                  </div>
                  <div className={styles.inviteCardInfo}>
                    <span className={styles.inviteFrom}>{inv.inviterEmail}</span>
                    <span className={styles.inviteLabel}>quiere compartir contigo</span>
                  </div>
                </div>

                <div className={styles.chipRow}>
                  {inv.sections.map(s => <SectionChip key={s} sectionId={s} />)}
                </div>

                <div className={styles.inviteActions}>
                  <button
                    onClick={() => handleAccept(inv.id)}
                    disabled={acceptingIds.has(inv.id) || rejectingIds.has(inv.id)}
                    className={styles.acceptBtn}
                  >
                    <Check size={13} />
                    {acceptingIds.has(inv.id) ? 'Aceptando...' : 'Aceptar'}
                  </button>
                  <button
                    onClick={() => handleReject(inv.id)}
                    disabled={acceptingIds.has(inv.id) || rejectingIds.has(inv.id)}
                    className={styles.rejectBtn}
                  >
                    <X size={13} />
                    {rejectingIds.has(inv.id) ? 'Rechazando...' : 'Rechazar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Success / error alerts ── */}
      {successMsg && (
        <div className={styles.alertSuccess}>
          <Check size={13} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className={styles.alertError}>
          <AlertCircle size={13} /> {errorMsg}
        </div>
      )}

      {/* ── Invite new collaborator ── */}
      <section className={styles.section}>
        <button
          onClick={() => { setShowForm(v => !v); setErrorMsg(''); }}
          className={`${styles.inviteTrigger} ${showForm ? styles.inviteTriggerOpen : ''}`}
        >
          <div className={styles.inviteTriggerLeft}>
            <div className={styles.inviteIconBox}>
              <UserPlus size={14} color="var(--amber)" />
            </div>
            <span>Invitar colaborador</span>
          </div>
          <ChevronDown
            size={14}
            className={`${styles.triggerChevron} ${showForm ? styles.triggerChevronOpen : ''}`}
          />
        </button>

        {showForm && (
          <form onSubmit={handleSendInvite} className={`form-spring ${styles.inviteForm}`}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                <Mail size={11} /> Email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="novia@gmail.com"
                className={styles.emailInput}
                required
                autoFocus
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Secciones a compartir</label>
              <div className={styles.sectionGrid}>
                {SHAREABLE_SECTIONS.map(({ id, label, icon: Icon }) => {
                  const active = inviteSections.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleSection(id)}
                      className={`${styles.sectionToggle} ${active ? styles.sectionToggleActive : ''}`}
                    >
                      <Icon size={13} />
                      {label}
                      {active && <Check size={10} className={styles.sectionCheck} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || inviteSections.length === 0 || !inviteEmail.trim()}
              className={styles.sendBtn}
            >
              {sending ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </form>
        )}
      </section>

      {/* ── Active: shared by me ── */}
      {Object.values(collabsByCollaborator).length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionDot} data-color="sage" />
            <h3 className={styles.sectionTitle}>Compartido por mí</h3>
          </div>

          <div className={styles.collabList}>
            {Object.values(collabsByCollaborator).map((group, i) => (
              <div
                key={group.email}
                className={styles.collabCard}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={styles.collabCardRow}>
                  <div className={styles.avatarSmall}>
                    {group.email[0].toUpperCase()}
                  </div>
                  <div className={styles.collabInfo}>
                    <span className={styles.collabEmail}>{group.email}</span>
                    <div className={styles.chipRow}>
                      {group.items.map(c => <SectionChip key={c.id} sectionId={c.section} />)}
                    </div>
                  </div>
                  <button
                    onClick={() => group.items.forEach(c => handleRemoveCollab(c.id))}
                    disabled={group.items.some(c => removingIds.has(c.id))}
                    className={styles.removeBtn}
                    title="Quitar acceso"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Active: shared with me ── */}
      {Object.values(collabsByOwner).length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionDot} data-color="blue" />
            <h3 className={styles.sectionTitle}>Compartido conmigo</h3>
          </div>

          <div className={styles.collabList}>
            {Object.values(collabsByOwner).map((group, i) => (
              <div
                key={group.email}
                className={styles.collabCard}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={styles.collabCardRow}>
                  <div className={styles.avatarSmall}>
                    {group.email[0].toUpperCase()}
                  </div>
                  <div className={styles.collabInfo}>
                    <span className={styles.collabEmail}>{group.email}</span>
                    <div className={styles.chipRow}>
                      {group.items.map(c => <SectionChip key={c.id} sectionId={c.section} />)}
                    </div>
                  </div>
                  <button
                    onClick={() => group.items.forEach(c => handleRemoveCollab(c.id))}
                    disabled={group.items.some(c => removingIds.has(c.id))}
                    className={styles.removeBtn}
                    title="Salir de la colaboración"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pending sent invitations ── */}
      {pendingSent.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionDot} data-color="muted" />
            <h3 className={styles.sectionTitle}>Invitaciones enviadas</h3>
          </div>

          <div className={styles.sentList}>
            {pendingSent.map((inv, i) => (
              <div
                key={inv.id}
                className={`${styles.sentCard} ${removingIds.has(inv.id) ? 'item-out' : ''}`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <Clock size={11} className={styles.sentIcon} />
                <div className={styles.sentInfo}>
                  <span className={styles.sentEmail}>{inv.inviteeEmail}</span>
                  <div className={styles.chipRow}>
                    {inv.sections.map(s => <SectionChip key={s} sectionId={s} />)}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  disabled={removingIds.has(inv.id)}
                  className={styles.removeBtn}
                  title="Cancelar invitación"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ── */}
      {collaborations.length === 0
        && pendingIncoming.length === 0
        && pendingSent.length === 0
        && !showForm && (
        <div className={styles.emptyState}>
          <Users size={28} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Sin colaboradores aún</p>
          <p className={styles.emptyText}>
            Invitá a alguien para compartir tus listas de compras o presupuesto.
          </p>
        </div>
      )}
    </div>
  );
}
