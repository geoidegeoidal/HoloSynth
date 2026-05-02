import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('HoloSynth crash:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              style={styles.button}
              onClick={this.handleRetry}
              onMouseEnter={this.handleHoverIn}
              onMouseLeave={this.handleHoverOut}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  handleHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = '#ff00ff';
    e.currentTarget.style.boxShadow = '0 0 24px #ff00ff80';
  };

  handleHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.boxShadow = '0 0 16px #00ffff40';
  };
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse at center, #0a0a20 0%, #050510 70%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  card: {
    textAlign: 'center',
    padding: '48px 64px',
    border: '1px solid #00ffff40',
    borderRadius: 16,
    background: 'rgba(5, 5, 16, 0.9)',
    boxShadow: '0 0 60px #00ffff15',
    maxWidth: 480,
  },
  title: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: 600,
    margin: '0 0 16px 0',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: 1,
  },
  message: {
    color: '#8888aa',
    fontSize: 14,
    margin: '0 0 32px 0',
    fontFamily: 'system-ui, monospace',
    lineHeight: 1.6,
  },
  button: {
    border: '1px solid #00ffff60',
    borderRadius: 8,
    padding: '10px 32px',
    color: '#00ffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    boxShadow: '0 0 16px #00ffff40',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: 1,
  },
};
