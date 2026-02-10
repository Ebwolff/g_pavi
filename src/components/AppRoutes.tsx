
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';

// Lazy loading das páginas
const Dashboard = lazy(() => import('../pages/DashboardNovo').then(module => ({ default: module.DashboardNovo })));
const NovaOS = lazy(() => import('../pages/NovaOS').then(module => ({ default: module.NovaOS })));
const ListaOS = lazy(() => import('../pages/ListaOS').then(module => ({ default: module.ListaOS })));
const EditarOS = lazy(() => import('../pages/EditarOS').then(module => ({ default: module.EditarOS })));
const Relatorios = lazy(() => import('../pages/Relatorios').then(module => ({ default: module.Relatorios })));
const Configuracoes = lazy(() => import('../pages/Configuracoes').then(module => ({ default: module.Configuracoes })));
const Alertas = lazy(() => import('../pages/Alertas').then(module => ({ default: module.Alertas })));
const PendenciasOS = lazy(() => import('../pages/PendenciasOS').then(module => ({ default: module.PendenciasOS })));
const PainelCompras = lazy(() => import('../pages/PainelCompras'));
const PainelTecnico = lazy(() => import('../pages/PainelTecnico'));
const PainelDiretoria = lazy(() => import('../pages/PainelDiretoria'));
const PainelConsultor = lazy(() => import('../pages/PainelConsultor'));
const PainelChefeOficina = lazy(() => import('../pages/PainelChefeOficina'));
const PainelAlmoxarifado = lazy(() => import('../pages/PainelAlmoxarifado'));
const PainelFeramental = lazy(() => import('../pages/PainelFeramental'));

// Loading skeleton premium
function PageSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <div className="flex">
                {/* Sidebar skeleton */}
                <div className="w-64 h-screen bg-[var(--surface)] border-r border-[var(--border-subtle)] p-4 hidden md:block">
                    <div className="h-8 w-32 bg-white/5 rounded-lg mb-8 animate-pulse" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                        ))}
                    </div>
                </div>
                {/* Content skeleton */}
                <div className="flex-1 p-8">
                    <div className="h-8 w-48 bg-white/5 rounded-lg mb-2 animate-pulse" />
                    <div className="h-4 w-72 bg-white/5 rounded-lg mb-8 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="h-80 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
                        <div className="h-80 bg-white/5 rounded-2xl border border-white/5 animate-pulse" style={{ animationDelay: '200ms' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AppRoutes() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/os/nova" element={<ProtectedRoute><NovaOS /></ProtectedRoute>} />
                <Route path="/os/lista" element={<ProtectedRoute><ListaOS /></ProtectedRoute>} />
                <Route path="/os/editar/:id" element={<ProtectedRoute><EditarOS /></ProtectedRoute>} />
                <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
                <Route path="/pendencias" element={<ProtectedRoute><PendenciasOS /></ProtectedRoute>} />

                <Route path="/compras" element={<ProtectedRoute><PainelCompras /></ProtectedRoute>} />
                <Route path="/tecnico" element={<ProtectedRoute><PainelTecnico /></ProtectedRoute>} />
                <Route path="/diretoria" element={<ProtectedRoute><PainelDiretoria /></ProtectedRoute>} />
                <Route path="/consultor" element={<ProtectedRoute><PainelConsultor /></ProtectedRoute>} />
                <Route path="/chefe-oficina" element={<ProtectedRoute><PainelChefeOficina /></ProtectedRoute>} />
                <Route path="/almoxarifado" element={<ProtectedRoute><PainelAlmoxarifado /></ProtectedRoute>} />
                <Route path="/feramental" element={<ProtectedRoute><PainelFeramental /></ProtectedRoute>} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Suspense>
    );
}

