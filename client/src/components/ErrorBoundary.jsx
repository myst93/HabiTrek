import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3.5rem', color: '#e63946' }}></i>
          <h2 style={{ marginTop: '1rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
