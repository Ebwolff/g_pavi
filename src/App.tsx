import { Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NovaOS } from './pages/NovaOS';
import { ListaOS } from './pages/ListaOS';
import { EditarOS } from './pages/EditarOS';
import { Relatorios } from './pages/Relatorios';
import { Configuracoes } from './pages/Configuracoes';
import { DashboardMock } from './pages/DashboardMock';
import { DebugService } from './pages/DebugService';
import { Alertas } from './pages/Alertas';
import { PendenciasOS } from './pages/PendenciasOS';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000,
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
            return (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h1 style={{ color: '#dc2626' }}>Erro na aplicação</h1>
                    <pre style={{
                        background: '#f3f4f6',
                        padding: '20px',
                        borderRadius: '8px',
                        textAlign: 'left',
                        overflow: 'auto'
                    }}>
                        {this.state.error?.message}
                        {'\n\n'}
                        {this.state.error?.stack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/os/nova"
                            element={
                                <ProtectedRoute>
                                    <NovaOS />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/os/lista"
                            element={
                                <ProtectedRoute>
                                    <ListaOS />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/os/editar/:id"
                            element={
                                <ProtectedRoute>
                                    <EditarOS />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/relatorios"
                            element={
                                <ProtectedRoute>
                                    <Relatorios />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/configuracoes"
                            element={
                                <ProtectedRoute>
                                    <Configuracoes />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/dashboard-novo"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/debug"
                            element={
                                <ProtectedRoute>
                                    <DebugService />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/alertas"
                            element={
                                <ProtectedRoute>
                                    <Alertas />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/pendencias"
                            element={
                                <ProtectedRoute>
                                    <PendenciasOS />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
