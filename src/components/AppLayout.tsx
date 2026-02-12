import { ReactNode, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/utils/permissions';
import {
    LayoutDashboard,
    FileText,
    TrendingUp,
    LogOut,
    PlusCircle,
    List,
    Settings,
    ShoppingCart,
    Wrench,
    BarChart3,
    Users,
    Hammer,
    ChevronRight,
    Car,
    Package
} from 'lucide-react';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, logout } = useAuth();

    const allMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: PlusCircle, label: 'Nova OS', path: '/os/nova' },
        { icon: List, label: 'Lista de OS', path: '/os/lista' },
        { icon: Users, label: 'Consultor', path: '/consultor' },
        { icon: Hammer, label: 'Chefe de Oficina', path: '/chefe-oficina' },
        { icon: Wrench, label: 'Técnico', path: '/tecnico' },
        { icon: ShoppingCart, label: 'Compras', path: '/compras' },
        { icon: Package, label: 'Almoxarifado', path: '/almoxarifado' },
        { icon: Car, label: 'Feramental', path: '/feramental' },
        { icon: BarChart3, label: 'Diretoria', path: '/diretoria' },
        { icon: TrendingUp, label: 'Relatórios', path: '/relatorios' },
        { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    ];

    // Filtra itens do menu baseado nas permissões do usuário
    const menuItems = useMemo(() => {
        const userRole = profile?.role;
        return allMenuItems.filter(item => hasPermission(userRole, item.path));
    }, [profile?.role]);

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
            {/* MARDISA Premium Dark Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-50 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] transition-all duration-300 shadow-2xl">
                {/* Logo & Branding */}
                <div className="p-6 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-[var(--text-primary)] tracking-tight">
                                Visão 360
                            </h1>
                            <p className="text-xs text-[var(--text-muted)] font-medium tracking-wide">
                                Agro System
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-visao360">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden
                                        ${active
                                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-900/10'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border border-transparent'}
                                    `}
                                >
                                    {/* Active Indicator Line */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    )}

                                    <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${active ? 'text-blue-400' : 'group-hover:text-[var(--text-primary)]'}`} />
                                    <span className="text-sm font-medium flex-1 text-left tracking-wide">{item.label}</span>

                                    {active && <ChevronRight className="w-4 h-4 text-blue-500/50 animate-pulse" />}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-colors duration-200">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                            {(profile?.first_name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                                {(() => {
                                    const first = profile?.first_name || 'Usuário';
                                    const last = profile?.last_name || '';
                                    if (first === 'Usuário' && (last === 'Usuário' || !last)) return 'Usuário';
                                    return `${first} ${last}`;
                                })()}
                            </p>
                            <p className="text-xs capitalize truncate text-[var(--text-muted)]">
                                {profile?.role?.toLowerCase().replace('_', ' ') || 'Usuário'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            await logout();
                            navigate('/login');
                        }}
                        className="
                            w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200
                            text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent
                            group
                        "
                    >
                        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-sm font-medium">Sair do Sistema</span>
                    </button>

                    <div className="mt-2 text-center">
                        <span className="text-[10px] text-[var(--text-muted)] opacity-50 font-mono">
                            v1.2.0 • Pro Max
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto ml-64 bg-[var(--bg-primary)] scrollbar-visao360">
                {children}
            </main>
        </div>
    );
}
