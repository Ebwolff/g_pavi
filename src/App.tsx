import { Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { RoleGuard } from './components/RoleGuard';
import { getDefaultRoute } from './utils/permissions';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DashboardNovo } from './pages/DashboardNovo';
import { NovaOS } from './pages/NovaOS';
import { ListaOS } from './pages/ListaOS';
import { EditarOS } from './pages/EditarOS';
import { Relatorios } from './pages/Relatorios';
import { Configuracoes } from './pages/Configuracoes';
import { DebugService } from './pages/DebugService';
import { Alertas } from './pages/Alertas';
import { PendenciasOS } from './pages/PendenciasOS';
import PainelCompras from './pages/PainelCompras';
import PainelTecnico from './pages/PainelTecnico';
import PainelDiretoria from './pages/PainelDiretoria';
import PainelConsultor from './pages/PainelConsultor';
import PainelChefeOficina from './pages/PainelChefeOficina';
import PainelAlmoxarifado from './pages/PainelAlmoxarifado';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: true, // Recarregar ao focar na janela
            retry: 1,
            staleTime: 0, // Dados são considerados obsoletos imediatamente
            gcTime: 5 * 60 * 1000, // Garbage collection em 5 minutos
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
    const { isAuthenticated, isLoading, profile } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                    <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Aplica proteção por role
    return <RoleGuard>{children}</RoleGuard>;
}

// Componente para redirecionamento inteligente baseado no role
function SmartRedirect() {
    const { profile, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    const defaultRoute = getDefaultRoute(profile?.role);
    return <Navigate to={defaultRoute} replace />;
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
                                    <DashboardNovo />
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

                        <Route
                            path="/compras"
                            element={
                                <ProtectedRoute>
                                    <PainelCompras />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/tecnico"
                            element={
                                <ProtectedRoute>
                                    <PainelTecnico />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/diretoria"
                            element={
                                <ProtectedRoute>
                                    <PainelDiretoria />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/consultor"
                            element={
                                <ProtectedRoute>
                                    <PainelConsultor />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/chefe-oficina"
                            element={
                                <ProtectedRoute>
                                    <PainelChefeOficina />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/almoxarifado"
                            element={
                                <ProtectedRoute>
                                    <PainelAlmoxarifado />
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
