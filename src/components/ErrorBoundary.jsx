import React from 'react';

// Simple yet premium error boundary
// Shows a user-friendly message with an option to reload the page.
// Styling follows the app's dark theme with accent colors.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could log the error to an external service here.
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Simple reload – in a production app you might attempt a soft reset.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8]">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl text-center border border-red-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h2>
            <p className="text-slate-600 mb-4">An unexpected error occurred while loading this page. Please try reloading.</p>
            {this.state.error && (
              <pre className="text-left text-xs bg-red-50 p-3 rounded mb-4 overflow-auto max-h-40 border border-red-200 text-red-800">
                {this.state.error.toString()}
              </pre>
            )}
            {this.state.errorInfo?.componentStack && (
              <details className="text-left mb-4">
                <summary className="text-xs text-slate-500 cursor-pointer">Component Stack</summary>
                <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto max-h-40 border text-slate-600">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
