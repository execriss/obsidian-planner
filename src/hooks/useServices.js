import { useState, useEffect, useCallback } from 'react';
import {
  fetchServices, createService, updateService, deleteService, createServicePayment,
} from '../lib/db.js';

export function useServices(userId) {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchServices(userId)
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const addService = useCallback(async (svc) => {
    const created = await createService(userId, svc);
    setServices(prev => [...prev, created]);
  }, [userId]);

  const editService = useCallback(async (id, updates) => {
    const updated = await updateService(id, updates);
    setServices(prev => prev.map(s => s.id === id ? updated : s));
  }, []);

  const removeService = useCallback(async (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    await deleteService(id).catch(console.error);
  }, []);

  const addPayment = useCallback(async (svcId, payment) => {
    const newPayment = await createServicePayment(userId, svcId, payment);
    setServices(prev => prev.map(s =>
      s.id === svcId ? { ...s, payments: [...(s.payments || []), newPayment] } : s
    ));
    return newPayment;
  }, [userId]);

  return { services, loading, addService, editService, removeService, addPayment };
}
