import { useCallback, useEffect, useRef, useState } from 'react';
import { parsePhase1, type Phase1View } from './phase1';

export function usePhase1() {
  const [view, setView] = useState<Phase1View | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrievedAt, setRetrievedAt] = useState<string | null>(null);
  const sequence = useRef(0), publication = useRef(0), controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 25000);
    setLoading(true);
    try {
      const response = await fetch(`/api/nfl-phase1-predictions?t=${Date.now()}`, {
        cache: 'no-store', signal: abort.signal, headers: { 'Cache-Control': 'no-cache' },
      });
      const raw = await response.json();
      if (!response.ok) throw new Error([raw.error || `HTTP ${response.status}`, raw.details].filter(Boolean).join(': '));
      const next = parsePhase1(raw);
      if (request !== sequence.current) return;
      if (next.publicationMs < publication.current) throw new Error('Stale NFL Phase 1 response: publication predates the last accepted artifact.');
      publication.current = next.publicationMs;
      setView(next); // Replace the entire snapshot. Never append old games/rows.
      setRetrievedAt(response.headers.get('X-Forecast-Retrieved-At') || new Date().toISOString());
      setError(null);
    } catch (err) {
      if (request !== sequence.current) return;
      setView(null); // Errors never leave last week's data masquerading as current.
      setError(err instanceof Error ? err.message : 'NFL Phase 1 retrieval failed');
    } finally {
      clearTimeout(timeout);
      if (request === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 30000);
    return () => { clearInterval(interval); ++sequence.current; controller.current?.abort(); };
  }, [refresh]);
  return { view, loading, error, retrievedAt, refresh };
}
