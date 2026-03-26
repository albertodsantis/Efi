import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  declare state: State;
  declare props: Readonly<Props>;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-(--surface-app) px-6">
          <div className="w-full max-w-lg rounded-4xl border bg-(--surface-card) p-8 text-center shadow-lg border-(--line-soft)">
            <p className="text-[11px] font-bold tracking-[0.18em] text-rose-500 uppercase">
              Error inesperado
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-(--text-primary)">
              Algo salio mal
            </h1>
            <p className="mt-2 text-sm text-(--text-secondary)">
              Ha ocurrido un error inesperado. Recarga la pagina para continuar.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 w-full rounded-2xl bg-(--accent) py-3.5 text-sm font-bold text-white"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
