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
    Car
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
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            {/* MARDISA Premium Dark Sidebar */}
            <aside
                className="fixed left-0 top-0 h-full w-64 flex flex-col z-50"
                style={{
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-subtle)'
                }}
            >
                {/* Logo & Branding */}
                <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--primary)' }}
                        >
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                Gestão 360
                            </h1>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Agro System
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
                                    style={{
                                        background: active ? 'var(--primary)' : 'transparent',
                                        color: active ? 'white' : 'var(--text-secondary)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'var(--surface)';
                                            e.currentTarget.style.color = 'var(--text-primary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }
                                    }}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                                    {active && <ChevronRight className="w-4 h-4 opacity-70" />}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div
                        className="flex items-center gap-3 p-3 rounded-lg mb-3"
                        style={{ background: 'var(--surface)' }}
                    >
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                            style={{ background: 'var(--primary)', color: 'white' }}
                        >
                            {(profile?.first_name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {(() => {
                                    const first = profile?.first_name || 'Usuário';
                                    const last = profile?.last_name || '';
                                    if (first === 'Usuário' && (last === 'Usuário' || !last)) return 'Usuário';
                                    return `${first} ${last}`;
                                })()}
                            </p>
                            <p
                                className="text-xs capitalize truncate"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {profile?.role?.toLowerCase().replace('_', ' ') || 'Usuário'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            await logout();
                            navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                        style={{
                            color: 'var(--text-secondary)',
                            background: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = 'var(--danger)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sair do Sistema</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className="flex-1 overflow-auto ml-64"
                style={{ background: 'var(--bg-primary)' }}
            >
                {children}
            </main>
        </div>
    );
}
