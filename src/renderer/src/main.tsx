import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[namistack] render crash', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            margin: 0,
            padding: '24px',
            background: '#f6f7f3',
            color: '#111827',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif'
          }}
        >
          <h1 style={{ margin: '0 0 12px', fontSize: '24px' }}>NamiStack failed to render</h1>
          <p style={{ margin: '0 0 16px', fontSize: '14px' }}>
            The app hit a renderer error before the UI could load.
          </p>
          <pre
            style={{
              overflowX: 'auto',
              border: '1px solid #d7dde3',
              background: '#ffffff',
              padding: '16px',
              fontSize: '12px',
              lineHeight: 1.6
            }}
          >
            {this.state.error.stack || this.state.error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

window.addEventListener('error', (event) => {
  console.error('[namistack] window error', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[namistack] unhandled rejection', event.reason);
});

console.log('[namistack] renderer bootstrap');

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
