import { useRef } from 'react';
import Button from '../components/ui/Button.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import { ProductSkeleton, SliderSkeleton } from '../components/ui/Loaders.jsx';
import ProductSlider from '../components/ui/ProductSlider.jsx';
import Reveal from '../components/effects/Reveal.jsx';
import SplitWords from '../components/effects/SplitWords.jsx';
import Marquee from '../components/effects/Marquee.jsx';
import PaintStory from '../components/effects/PaintStory.jsx';
import WaveDivider from '../components/effects/WaveDivider.jsx';
import useScrollVar from '../hooks/useScrollVar.js';
import logo from '../assets/logo.svg';
import { api } from '../services/api.js';
import useQuery from '../services/useQuery.js';
import useSeo, { SITE_NAME, SITE_URL } from '../services/seo.js';
import { useContent } from '../store/store.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function Home() {
  const { t, l, lang } = useI18n();
  const { hero, marquee, story, latest, blocks, contact } = useContent();
  useSeo({
    description: hero.text,
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${SITE_URL}/#organisation`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png`,
          email: contact.email || undefined, sameAs: contact.instagram ? [contact.instagram] : undefined },
        { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: SITE_NAME, url: `${SITE_URL}${l('/')}`, inLanguage: lang === 'en' ? 'en-GB' : 'fr-FR', publisher: { '@id': `${SITE_URL}/#organisation` } },
      ],
    },
  });
  // Slider : GET /api/slider (réglages + produits déjà choisis) ; créations : GET /api/products
  const sliderQ = useQuery(() => api.slider.get(), []);
  const latestQ = useQuery(() => api.products.list({ page: 1, perPage: latest.count }), [latest.count]);
  const sliderProducts = sliderQ.data?.products ?? [];
  const products = latestQ.data?.data ?? [];
  const heroRef = useRef(null);
  useScrollVar(heroRef, 'leave'); // le logo tourne et s'éloigne, le texte s'efface

  return (
    <>
      {sliderQ.loading && !sliderQ.data && <SliderSkeleton />}
      {sliderProducts.length > 0 && <ProductSlider key={sliderProducts.map((p) => p.id).join('-')} products={sliderProducts} delay={sliderQ.data?.settings.delay ?? 5} />}

      <section className="hero" ref={heroRef}>
        <div className="hero__inner">
          <div className="hero__text">
            <SplitWords key={hero.title} text={hero.title} />
            <p>{hero.text}</p>
            <div className="hero__actions">
              <Button to={l(hero.primaryTo)}>{hero.primaryLabel}</Button>
              <Button to={l(hero.secondaryTo)} variant="ghost">{hero.secondaryLabel}</Button>
            </div>
          </div>
          <div className="hero__art">
            <img className="hero__logo" src={logo} alt={t('home.logoAlt')} width="500" height="500" decoding="async" />
          </div>
        </div>
      </section>

      <Marquee words={marquee} />
      <PaintStory steps={story} />

      <section className="section">
        <div className="container">
          <Reveal as="h2">{latest.title}</Reveal>
          <div className="product-grid" aria-busy={latestQ.loading}>
            {latestQ.loading && !latestQ.data && <ProductSkeleton count={latest.count} />}
            {products.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider />
      <section className="section section--band">
        <div className="container two-col">
          {blocks.map((b, i) => (
            <Reveal key={i} delay={i * 150}>
              <h2>{b.title}</h2>
              <p>{b.text}</p>
              <Button to={l(b.to)} variant="ghost">{b.cta}</Button>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
