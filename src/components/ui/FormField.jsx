import { useId } from 'react';

// as="input" (défaut) | "textarea" | "select" (les <option> sont passés en enfants)
export default function FormField({ label, error, as: Tag = 'input', children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={!!error} {...props}>{children}</Tag>
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}
