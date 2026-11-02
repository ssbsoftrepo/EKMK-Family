import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', fontFamily: 'sans-serif', maxWidth: '720px', margin: '40px auto' }}>
          <h2 style={{ color: '#c4502f', fontSize: '24px', fontWeight: 'bold' }}>Something went wrong loading the Admin Portal</h2>
          <pre style={{ background: '#f5f5f5', color: '#111', padding: '16px', borderRadius: '12px', overflow: 'auto', border: '1px solid #ddd', marginTop: '16px', fontSize: '14px', lineHeight: '1.5' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '12px', background: '#1e4636', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            Reload Admin
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
