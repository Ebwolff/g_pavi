import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Settings as SettingsIcon, User, Database, Bell, Shield, LogOut, Save, Edit2, X, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore, type Theme } from '@/stores/themeStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/stores/authStore';

export function Configuracoes() {
    const { profile, logout: signOut } = useAuth();
    const { theme, setTheme } = useThemeStore();
    const setProfile = useAuthStore(state => state.setProfile);

    // Estados de edição
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [tempFirstName, setTempFirstName] = useState('');
    const [tempLastName, setTempLastName] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Estados de preferências
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        return localStorage.getItem('notifications_enabled') !== 'false';
    });

    useEffect(() => {
        if (profile) {
            setTempFirstName(profile.first_name || '');
            setTempLastName(profile.last_name || '');
            setTempUsername(profile.username || '');
        }
    }, [profile]);

    const handleSaveProfile = async () => {
        if (!profile?.id) return;

        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Verificar disponibilidade do username se mudou
            if (tempUsername !== profile.username) {
                const isAvailable = await profileService.checkUsernameAvailability(tempUsername, profile.id);
                if (!isAvailable) {
                    throw new Error('Este username já está em uso.');
                }
            }

            const updatedProfile = await profileService.updateProfile(profile.id, {
                first_name: tempFirstName,
                last_name: tempLastName,
                username: tempUsername,
            });

            setProfile(updatedProfile);
            setIsEditing(false);
            setSaveMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });

            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            logger.error('Erro ao salvar perfil:', error);
            setSaveMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao salvar alterações.' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleNotifications = () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        localStorage.setItem('notifications_enabled', String(newValue));
    };

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                <SettingsIcon className="w-8 h-8 text-indigo-500" />
                            </div>
                            Configurações
                        </h1>
                        <p className="text-[var(--text-muted)] text-lg font-medium ml-1">
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
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-6">
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
                                <Button
                                    variant={isEditing ? "ghost" : "primary"}
                                    onClick={() => setIsEditing(!isEditing)}
                                    leftIcon={isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                    size="sm"
                                >
                                    {isEditing ? 'Cancelar' : 'Editar Perfil'}
                                </Button>
                            </div>

                            {saveMessage && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-slideDown ${saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                    {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    <span className="font-bold text-sm">{saveMessage.text}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Nome"
                                    value={isEditing ? tempFirstName : profile?.first_name || ''}
                                    onChange={(e) => setTempFirstName(e.target.value)}
                                    disabled={!isEditing}
                                    className={!isEditing ? "opacity-70" : ""}
                                />

                                <Input
                                    label="Sobrenome"
                                    value={isEditing ? tempLastName : profile?.last_name || ''}
                                    onChange={(e) => setTempLastName(e.target.value)}
                                    disabled={!isEditing}
                                    className={!isEditing ? "opacity-70" : ""}
                                />

                                <Input
                                    label="Username"
                                    value={isEditing ? tempUsername : profile?.username || ''}
                                    onChange={(e) => setTempUsername(e.target.value)}
                                    disabled={!isEditing}
                                    className={!isEditing ? "opacity-70" : ""}
                                />

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
                                        Permissão
                                    </label>
                                    <div className="w-full px-4 py-3.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] opacity-70 cursor-not-allowed font-medium uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        {profile?.role?.replace('_', ' ') || '-'}
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="mt-8 flex justify-end">
                                    <Button
                                        variant="primary"
                                        onClick={handleSaveProfile}
                                        isLoading={isSaving}
                                        leftIcon={<Save className="w-4 h-4" />}
                                    >
                                        Salvar Alterações
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Aparência */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border-purple-500/20">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    <Monitor className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Aparência</h2>
                                    <p className="text-[var(--text-muted)] text-sm">Personalize a experiência visual do sistema.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'light', label: 'Claro', icon: Sun },
                                    { id: 'dark', label: 'Escuro', icon: Moon },
                                    { id: 'system', label: 'Sistema', icon: Monitor },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setTheme(option.id as Theme)}
                                        className={`
                                            flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 gap-3
                                            ${theme === option.id
                                                ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-bold shadow-lg shadow-purple-500/10'
                                                : 'bg-[var(--surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]'}
                                        `}
                                    >
                                        <option.icon className="w-6 h-6" />
                                        <span className="text-sm">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* System Info Banner */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border-white/[0.05] bg-gradient-to-br from-indigo-500/[0.05] to-purple-500/[0.05]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Gestão 360</h3>
                                    <p className="text-[var(--text-muted)] text-sm">Versão 2.1.0 (Enterprise Theme)</p>
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
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Bell className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <h3 className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">Notificações</h3>
                                </div>
                                <button
                                    onClick={toggleNotifications}
                                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-700'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${notificationsEnabled ? 'left-7' : 'left-1'
                                        }`} />
                                </button>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                                {notificationsEnabled
                                    ? 'As notificações estão ativadas para este navegador.'
                                    : 'Você silenciou as notificações deste sistema.'}
                            </p>
                            <div className={`px-4 py-2 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all ${notificationsEnabled
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                }`}>
                                {notificationsEnabled ? 'Sons Ativados' : 'Sons Desativados'}
                            </div>
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
