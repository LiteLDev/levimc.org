import { Component, type ErrorInfo, type ReactNode } from "react";
import { PixelIcon } from "../kit-ui";
import { useI18n } from "../i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** What to show instead; `reset` renders the children again. */
  fallback: (reset: () => void) => ReactNode;
  /** A new key (another page) clears the error. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  /** A flag, not the error: anything can be thrown, `0` and `""` included. */
  failed: boolean;
  resetKey: string | undefined;
}

/** Catches errors thrown while rendering its children and shows `fallback`. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    return props.resetKey !== state.resetKey
      ? { failed: false, resetKey: props.resetKey }
      : null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  private reset = () => this.setState({ failed: false });

  render() {
    return this.state.failed ? this.props.fallback(this.reset) : this.props.children;
  }
}

interface ErrorMessageProps {
  message: string;
  reset: () => void;
}

/** The error page: a painted card with the message and a way to try again. */
export function ErrorMessage({ message, reset }: ErrorMessageProps) {
  const { t } = useI18n();
  return (
    <main id="main" className="pkg-main pkg-notfound kit-above-backdrop" tabIndex={-1}>
      <div className="px-card kit-painted pkg-notfound-card" role="alert">
        <div className="kit-slot pkg-notfound-compass" aria-hidden="true">
          <PixelIcon name="tnt" size={64} />
        </div>
        <h2 className="pkg-error-title">{t.errorTitle}</h2>
        <p className="pkg-notfound-text">{message}</p>
        <button type="button" className="mc-btn mc-btn-primary" onClick={reset}>
          {t.tryAgain}
        </button>
      </div>
    </main>
  );
}
