import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard,
    FileText,
    TrendingUp,
    LogOut,
    PlusCircle,
    List,
    Settings
} from 'lucide-react';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: PlusCircle, label: 'Nova OS', path: '/os/nova' },
        { icon: List, label: 'Lista de OS', path: '/os/lista' },
        { icon: TrendingUp, label: 'Relatórios', path: '/relatorios' },
        { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
            {/* Sidebar Premium Verde */}
            <aside className="sidebar">
                {/* Logo  e Branding */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#16a34a] rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg">MARDISA Agro</h1>
                            <p className="text-white/60 text-xs">Sistema ERP</p>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 py-6">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`sidebar-item w-full ${active ? 'sidebar-item-active' : ''}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-6 border-t border-white/10">
                    <div className="mb-4">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                    {profile?.first_name} {profile?.last_name}
                                </p>
                                <p className="text-white/60 text-xs capitalize">
                                    {profile?.role?.toLowerCase().replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>


                    <button
                        onClick={async () => {
                            await logout();
                            navigate('/login');
                        }}
                        className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/10"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sair do Sistema</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto ml-64">
                {children}
            </main>
        </div>
    );
}
