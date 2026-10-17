import { Component } from 'react';
import { useLocation } from 'react-router-dom';

// Attrape les plantages d'affichage (erreur JavaScript, fichier de page introuvable après une mise en ligne)
// et affiche à la place une page d'erreur au lieu d'un écran blanc.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) { console.error('Erreur d’affichage :', error, info?.componentStack); }

  componentDidUpdate(prev) {
    // Changement de page : on réessaie d'afficher normalement
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    return error ? this.props.fallback(error) : this.props.children;
  }
}

export function RouteErrorBoundary({ fallback, children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname} fallback={fallback}>{children}</ErrorBoundary>;
}
