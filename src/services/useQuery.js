import { useCallback, useEffect, useRef, useState } from 'react';

/** Charge des données au montage et quand `deps` change. Renvoie { data, error, loading, reload }. */
export default function useQuery(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher().then(
      (data) => { if (id === run.current) setState({ data, error: null, loading: false }); },
      (error) => { if (id === run.current) setState((s) => ({ data: s.data, error, loading: false })); }
    );
  }, deps);

  useEffect(() => {
    load();
    return () => { run.current++; }; // ignore les réponses d'une requête devenue inutile
  }, [load]);

  return { ...state, reload: load };
}
