import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CONSENT_DAYS, OPTIONAL_SERVICES } from '../config/consent.js';

const KEY = 'dab-consent';
const ConsentContext = createContext(null);

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && Date.now() - v.date < CONSENT_DAYS * 86_400_000) return v;
  } catch { /* pas de choix enregistré */ }
  return null;
}

// Mémorise le choix du visiteur et ne déclenche un service qu'avec son accord.
export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(read);
  const [open, setOpen] = useState(false);
  const active = useRef(new Set());

  useEffect(() => {
    if (!consent) return;
    for (const s of OPTIONAL_SERVICES) {
      if (consent.choices[s.id] && !active.current.has(s.id)) {
        active.current.add(s.id);
        s.enable();
      }
    }
  }, [consent]);

  const value = useMemo(() => {
    const save = (choices) => {
      const next = { choices, date: Date.now() };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
      // Un consentement retiré après activation : on recharge pour que le service s'arrête vraiment
      if ([...active.current].some((id) => !choices[id])) { window.location.reload(); return; }
      setConsent(next);
      setOpen(false);
    };
    const all = (v) => Object.fromEntries(OPTIONAL_SERVICES.map((s) => [s.id, v]));
    return {
      services: OPTIONAL_SERVICES, consent, decided: Boolean(consent), open,
      openSettings: () => setOpen(true), closeSettings: () => setOpen(false),
      acceptAll: () => save(all(true)), refuseAll: () => save(all(false)), save,
    };
  }, [consent, open]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export const useConsent = () => useContext(ConsentContext);
