import { useState, useEffect, useCallback } from 'react';
import {
  fetchDocuments, createDocument, updateDocument, deleteDocument,
  uploadDocumentFile, deleteDocumentFile,
} from '../lib/db.js';

export function useDocuments(userId) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchDocuments(userId)
      .then(setDocs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const addDoc = useCallback(async (doc, file) => {
    const created = await createDocument(userId, doc);
    if (!file) {
      setDocs(prev => [...prev, created]);
      return created;
    }
    const fileInfo = await uploadDocumentFile(userId, created.id, file);
    const withFile = await updateDocument(created.id, fileInfo);
    setDocs(prev => [...prev, withFile]);
    return withFile;
  }, [userId]);

  // fileOpt: { file: File } to replace, { remove: true } to delete, undefined to keep
  const editDoc = useCallback(async (id, updates, fileOpt) => {
    let fileUpdates = {};
    if (fileOpt?.remove) {
      const existing = docs.find(d => d.id === id);
      if (existing?.filePath) await deleteDocumentFile(existing.filePath).catch(console.error);
      fileUpdates = { filePath: null, fileName: null, fileSize: null, fileType: null };
    } else if (fileOpt?.file) {
      const existing = docs.find(d => d.id === id);
      if (existing?.filePath) await deleteDocumentFile(existing.filePath).catch(console.error);
      fileUpdates = await uploadDocumentFile(userId, id, fileOpt.file);
    }
    const updated = await updateDocument(id, { ...updates, ...fileUpdates });
    setDocs(prev => prev.map(d => d.id === id ? updated : d));
  }, [userId, docs]);

  const removeDoc = useCallback(async (id) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    await deleteDocument(id).catch(console.error);
  }, []);

  return { docs, loading, addDoc, editDoc, removeDoc };
}
