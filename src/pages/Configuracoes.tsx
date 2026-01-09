import { AppLayout } from '@/components/AppLayout';
import { Settings as SettingsIcon, User, Database, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function Configuracoes() {
    const { profile } = useAuth();

    return (
        <AppLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Configurações
                    </h1>
                    <p className="text-gray-600">
                        Gerencie as configurações do sistema e seu perfil
                    </p>
                </div>

                {/* Perfil do Usuário */}
                <div className="premium-card mb-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-[#14532d] rounded-xl">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Perfil do Usuário</h2>
                            <p className="text-sm text-gray-600">Informações da sua conta</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
                                disabled
                                className="premium-input bg-gray-50 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={profile?.username || ''}
                                disabled
                                className="premium-input bg-gray-50 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Função
                            </label>
                            <input
                                type="text"
                                value={profile?.role?.replace('_', ' ') || ''}
                                disabled
                                className="premium-input bg-gray-50 cursor-not-allowed capitalize"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium ${profile?.is_active
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full mr-2 ${profile?.is_active ? 'bg-green-500' : 'bg-red-500'
                                        }`}></span>
                                    {profile?.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outras Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notificações */}
                    <div className="premium-card">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Bell className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Notificações</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Configure suas preferências de notificações
                        </p>
                        <button className="btn-secondary w-full">
                            Em desenvolvimento
                        </button>
                    </div>

                    {/* Banco de Dados */}
                    <div className="premium-card">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Database className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Banco de Dados</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Status da conexão com Supabase
                        </p>
                        <div className="flex items-center text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="text-green-700 font-medium">Conectado</span>
                        </div>
                    </div>
                </div>

                {/* Info do Sistema */}
                <div className="premium-card mt-6 bg-gradient-to-r from-[#14532d] to-[#064e3b] text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold mb-1">MARDISA Agro Desktop</h3>
                            <p className="text-white/80 text-sm">Versão 1.0.0 - Sistema ERP</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <SettingsIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
