import { Fragment } from 'react';

// Titre dont les mots remontent un à un au chargement.
export default function SplitWords({ text, as: Tag = 'h1' }) {
  return (
    <Tag className="split" aria-label={text}>
      {text.split(' ').map((w, i) => (
        <Fragment key={i}>
          <span className="split__w" aria-hidden="true" style={{ '--i': i }}><span>{w}</span></span>{' '}
        </Fragment>
      ))}
    </Tag>
  );
}
