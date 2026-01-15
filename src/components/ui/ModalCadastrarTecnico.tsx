import { useState } from 'react';
import { X, UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '@/lib/supabase';

interface ModalCadastrarTecnicoProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ModalCadastrarTecnico({ isOpen, onClose, onSuccess }: ModalCadastrarTecnicoProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        nome: '',
        sobrenome: '',
        email: '',
        senha: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validações
            if (!formData.nome || !formData.sobrenome || !formData.email || !formData.senha) {
                throw new Error('Todos os campos são obrigatórios');
            }

            if (formData.senha.length < 8) {
                throw new Error('A senha deve ter no mínimo 8 caracteres');
            }

            // Obter token de autenticação
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            // Chamar Edge Function
            const { data, error: functionError } = await supabase.functions.invoke('criar-tecnico', {
                body: {
                    email: formData.email,
                    senha: formData.senha,
                    nome: formData.nome,
                    sobrenome: formData.sobrenome
                }
            });

            if (functionError) {
                throw new Error(functionError.message);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            // Sucesso
            setFormData({ nome: '', sobrenome: '', email: '', senha: '' });
            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.message || 'Erro ao cadastrar técnico');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({ nome: '', sobrenome: '', email: '', senha: '' });
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="glass-card-enterprise w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10 animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <UserPlus className="w-5 h-5 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Cadastrar Técnico</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Nome
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all disabled:opacity-50 text-[var(--text-primary)]"
                                placeholder="João"
                                required
                            />
                        </div>
                    </div>

                    {/* Sobrenome */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Sobrenome
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={formData.sobrenome}
                                onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all disabled:opacity-50 text-[var(--text-primary)]"
                                placeholder="Silva"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all disabled:opacity-50 text-[var(--text-primary)]"
                                placeholder="joao.silva@mardisa.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Senha */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="password"
                                value={formData.senha}
                                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                disabled={loading}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all disabled:opacity-50 text-[var(--text-primary)]"
                                placeholder="Mínimo 8 caracteres"
                                minLength={8}
                                required
                            />
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Mínimo de 8 caracteres
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="flex-1"
                            leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
