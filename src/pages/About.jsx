import Button from '../components/ui/Button.jsx';
import ProductImage from '../components/ui/ProductImage.jsx';
import Trust from '../components/ui/Trust.jsx';
import { NotFoundView } from '../components/ui/ErrorPages.jsx';
import logo from '../assets/logo.svg';
import useSeo from '../services/seo.js';
import { useContent } from '../store/store.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

// Page « À propos » : texte et photo modifiables dans le back-office (Contenu du site). Absente du site tant qu'elle n'est pas activée.
export default function About() {
  const { t, l, lang } = useI18n();
  const { about, features } = useContent();
  const quotes = features?.quotes !== false;
  const en = lang === 'en';
  const pick = (fr, enText) => (en && enText ? enText : fr);
  const title = pick(about?.title, about?.titleEn);
  const lead = pick(about?.lead, about?.leadEn);
  const paragraphs = (pick(about?.text, about?.textEn) ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  useSeo(about?.enabled
    ? { title, description: lead || t('about.seoDesc'), path: '/a-propos', image: about.image || undefined }
    : { noindex: true });

  if (!about?.enabled) return <NotFoundView />;
  return (
    <>
      <section className="section">
        <div className="container about">
          <div>
            <h1>{title}</h1>
            {lead && <p className="about__lead">{lead}</p>}
            <div className="about__text">{paragraphs.map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{p}</p>)}</div>
            {about.signature && <p className="about__sign">{about.signature}</p>}
            <div className="about__actions">
              <Button to={l('/produits')}>{t('about.shop')}</Button>
              {quotes && <Button to={l('/devis')} variant="ghost">{t('about.quote')}</Button>}
            </div>
          </div>
          {about.image
            ? <div className="about__photo"><ProductImage src={about.image} label={t('about.photoAlt')} priority sizes="(min-width: 900px) 460px, 92vw" /></div>
            : <div className="about__photo about__photo--logo"><img src={logo} alt="" width="280" height="280" /></div>}
        </div>
      </section>
      <Trust />
    </>
  );
}
