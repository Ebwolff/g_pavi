import { AppLayout } from '@/components/AppLayout';
import { Settings as SettingsIcon, User, Database, Bell, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Configuracoes() {
    const { profile, signOut } = useAuth();

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                            <SettingsIcon className="w-8 h-8 text-indigo-500" />
                            Configurações
                        </h1>
                        <p className="text-[var(--text-muted)] text-lg">
                            Gerencie seu perfil e preferências do sistema.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={signOut}
                        leftIcon={<LogOut className="w-4 h-4" />}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                        Sair da Conta
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Perfil do Usuário */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card-enterprise p-8 rounded-3xl border-indigo-500/20">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                    <User className="w-10 h-10 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                                        {profile?.first_name} {profile?.last_name}
                                    </h2>
                                    <p className="text-[var(--text-muted)] flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                        {profile?.role?.replace('_', ' ') || 'Usuário'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
                                        disabled
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] opacity-70 cursor-not-allowed font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={profile?.username || ''}
                                        disabled
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] opacity-70 cursor-not-allowed font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                                        Permissão
                                    </label>
                                    <div className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] opacity-70 cursor-not-allowed font-medium uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        {profile?.role?.replace('_', ' ') || '-'}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                                        Status da Conta
                                    </label>
                                    <div className={`w-full px-4 py-3 rounded-xl border font-bold text-sm tracking-wide flex items-center gap-2 ${profile?.is_active
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${profile?.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        {profile?.is_active ? 'ATIVO' : 'INATIVO'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Info Banner */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border-white/[0.05] bg-gradient-to-br from-indigo-500/[0.05] to-purple-500/[0.05]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Gestão 360</h3>
                                    <p className="text-[var(--text-muted)] text-sm">Versão 2.0.0 (Enterprise Dark)</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <SettingsIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        {/* Notifications */}
                        <div className="glass-card-enterprise p-6 rounded-2xl border-white/[0.03] hover:border-blue-500/20 transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Bell className="w-5 h-5 text-blue-500" />
                                </div>
                                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">Notificações</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                                Gerencie como e quando você recebe alertas do sistema.
                            </p>
                            <Button variant="secondary" fullWidth disabled className="opacity-50">
                                Em Desenvolvimento
                            </Button>
                        </div>

                        {/* Database Status */}
                        <div className="glass-card-enterprise p-6 rounded-2xl border-white/[0.03] hover:border-emerald-500/20 transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Database className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">Base de Dados</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                                Status da conexão realtime com Supabase Enterprise.
                            </p>
                            <div className="px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Conectado
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
