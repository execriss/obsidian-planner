import { useState, useEffect } from 'react';

/**
 * Guarantees a minimum display time for loading states.
 * Prevents skeleton flashes that are imperceptible when fetches resolve very fast.
 */
export function useMinLoading(loading, minMs = 400) {
  const [minPassed, setMinPassed] = useState(false);

  useEffect(() => {
    setMinPassed(false);
    const id = setTimeout(() => setMinPassed(true), minMs);
    return () => clearTimeout(id);
  }, [minMs]);

  return loading || !minPassed;
}
