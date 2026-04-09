import { useState, useEffect, useCallback } from 'react';
import {
  fetchIncomingInvitations,
  fetchSentInvitations,
  sendInvitation,
  acceptInvitation,
  rejectInvitation,
  revokeInvitation,
  fetchCollaborations,
  removeCollaboration,
} from '../lib/db.js';

export function useCollaboration(userId, userEmail) {
  const [collaborations,      setCollaborations]      = useState([]);
  const [incomingInvitations, setIncomingInvitations] = useState([]);
  const [sentInvitations,     setSentInvitations]     = useState([]);
  const [loading,             setLoading]             = useState(true);

  const load = useCallback(async () => {
    if (!userId || !userEmail) return;
    setLoading(true);
    try {
      const [collabs, incoming, sent] = await Promise.all([
        fetchCollaborations(userId),
        fetchIncomingInvitations(userEmail),
        fetchSentInvitations(userId),
      ]);
      setCollaborations(collabs);
      setIncomingInvitations(incoming);
      setSentInvitations(sent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => { load(); }, [load]);

  const invite = useCallback(async (inviteeEmail, sections) => {
    const inv = await sendInvitation(userId, userEmail, inviteeEmail, sections);
    setSentInvitations(prev => [inv, ...prev]);
    return inv;
  }, [userId, userEmail]);

  const accept = useCallback(async (invitationId) => {
    const newCollabs = await acceptInvitation(invitationId, userId, userEmail);
    setIncomingInvitations(prev => prev.filter(i => i.id !== invitationId));
    setCollaborations(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      return [...prev, ...newCollabs.filter(c => !existingIds.has(c.id))];
    });
  }, [userId, userEmail]);

  const reject = useCallback(async (invitationId) => {
    await rejectInvitation(invitationId);
    setIncomingInvitations(prev => prev.filter(i => i.id !== invitationId));
  }, []);

  const revoke = useCallback(async (invitationId) => {
    await revokeInvitation(invitationId);
    setSentInvitations(prev => prev.filter(i => i.id !== invitationId));
  }, []);

  const removeCollab = useCallback(async (collaborationId) => {
    await removeCollaboration(collaborationId);
    setCollaborations(prev => prev.filter(c => c.id !== collaborationId));
  }, []);

  return {
    collaborations,
    incomingInvitations,
    sentInvitations,
    loading,
    invite,
    accept,
    reject,
    revoke,
    removeCollab,
    reload: load,
  };
}
