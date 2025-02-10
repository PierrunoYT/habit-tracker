'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        
        // Log error to your error reporting service
        console.error('Uncaught error:', error);
        console.error('Component stack:', errorInfo.componentStack);
        
        // Add error reporting service here
        // Example: reportError(error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        // Add window location reload if needed
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[200px] p-8 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-center max-w-lg">
                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                            Something went wrong
                        </h2>
                        <div className="text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                            <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
                            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                                <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm overflow-auto max-h-[200px] text-left">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                onClick={this.handleRetry}
                            >
                                Try again
                            </button>
                            <button
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                onClick={() => window.location.reload()}
                            >
                                Reload page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 