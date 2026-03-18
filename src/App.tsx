import { Component, ReactNode, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './components/AppRoutes';
import { useThemeStore } from '@/stores/themeStore';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: true,
            retry: 1,
            staleTime: 0,
            gcTime: 5 * 60 * 1000,
        },
    },
});

// Error Boundary
class ErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;
            return (
                <div className="p-10 text-center">
                    <h1 className="text-red-600 text-2xl font-bold mb-4">Erro na aplicação</h1>
                    {isDev ? (
                        <pre className="bg-gray-100 p-5 rounded-lg text-left overflow-auto text-sm">
                            {this.state.error?.message}
                            {'\n\n'}
                            {this.state.error?.stack}
                        </pre>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-4">Ocorreu um erro inesperado. Por favor, recarregue a página.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                            >
                                Recarregar
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

function App() {
    const { theme } = useThemeStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
    }, [theme]);

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
