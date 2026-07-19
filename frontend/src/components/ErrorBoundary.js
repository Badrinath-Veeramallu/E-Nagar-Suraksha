import React from 'react';

/**
 * React Error Boundary — catches uncaught JS errors in any child subtree.
 * Prevents blank screen; shows a friendly recovery UI instead.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="max-w-md w-full text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 text-sm mb-2">
                            An unexpected error occurred. This has been noted.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-left text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 overflow-auto max-h-32 whitespace-pre-wrap">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="btn-primary"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
