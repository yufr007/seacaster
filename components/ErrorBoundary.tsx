import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // TODO: Send to Sentry/LogRocket
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-ocean-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black mb-2">SeaCaster Capized!</h1>
          <p className="text-ocean-300 mb-8 max-w-xs">
            Something went wrong. The seas are rough today.
            <br />
            <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded mt-2 inline-block text-red-300">
              {this.state.error?.message}
            </span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <RefreshCw size={20} /> Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;