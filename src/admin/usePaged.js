import { useEffect, useState } from 'react';
import useQuery from '../services/useQuery.js';

/** Valeur "retardée" : évite une requête à chaque lettre tapée dans une recherche */
export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * Liste paginée par l'API : fetcher({ ...filtres, page, perPage }) -> { data, meta }.
 * Renvoie les éléments de la page, les props du composant <Pagination> et reload().
 * Après un changement de filtre, appelez resetPage() pour revenir à la page 1.
 */
export default function usePaged(fetcher, filters = {}, initialSize = 10) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  const key = JSON.stringify(filters);
  const query = useQuery(() => fetcher({ ...filters, page, perPage: size }), [key, page, size]);
  const meta = query.data?.meta;

  // Dernier élément d'une page supprimé : on revient à la dernière page qui existe
  useEffect(() => {
    if (meta && page > meta.pageCount) setPage(meta.pageCount);
  }, [meta, page]);

  return {
    items: query.data?.data ?? [],
    meta,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    resetPage: () => setPage(1),
    pager: {
      page, size,
      pageCount: meta?.pageCount ?? 1,
      total: meta?.total ?? 0,
      onPage: setPage,
      onSize: (n) => { setSize(n); setPage(1); },
    },
  };
}
