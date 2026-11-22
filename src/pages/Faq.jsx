import { useMemo } from 'react';
import Button from '../components/ui/Button.jsx';
import { PageLoader } from '../components/ui/Loaders.jsx';
import { api } from '../services/api.js';
import useQuery from '../services/useQuery.js';
import useSeo from '../services/seo.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Foire aux questions : /faq (anglais : /en/faq). Questions éditables dans le back-office ; balisage FAQPage pour Google.
export default function Faq() {
  const { t, l, lang } = useI18n();
  const { data, error, loading, reload } = useQuery(() => api.faq.list(), []);
  const items = useMemo(() => (data?.data ?? []).map((f) => ({
    id: f.id,
    q: (lang === 'en' && f.questionEn) || f.question,
    a: (lang === 'en' && f.answerEn) || f.answer,
  })), [data, lang]);

  useSeo({
    title: t('faq.seoTitle'), description: t('faq.seoDesc'), path: '/faq',
    jsonLd: items.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) } : undefined,
  });

  if (loading && !data) return <PageLoader label={t('loading')} />;
  return (
    <section className="section">
      <div className="container faq">
        <h1>{t('faq.title')}</h1>
        <p className="lead">{t('faq.intro')}</p>
        {error && <p className="notice notice--error" role="alert">{error.message} <button className="link-btn" onClick={reload}>{t('retry')}</button></p>}
        {!error && items.length === 0 && <p>{t('faq.empty')}</p>}
        <div className="faq__list">
          {items.map((i) => (
            <details key={i.id} className="faq__item">
              <summary>{i.q}</summary>
              <p>{i.a}</p>
            </details>
          ))}
        </div>
        <div className="faq__cta">
          <h2>{t('faq.contactTitle')}</h2>
          <Button to={l('/contact')}>{t('faq.contactButton')}</Button>
        </div>
      </div>
    </section>
  );
}
