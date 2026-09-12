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
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900 shadow-sm m-4">
          <div className="max-w-md text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center mx-auto text-red-600 text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Component Recovered Safely
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'A safe recovery was triggered.'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-navy text-white hover:bg-navy-light transition-colors"
              >
                Reload Verification Dashboard
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/dashboard'; }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
