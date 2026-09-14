import { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { usuarioService } from '@/services/usuario.service';
import { ROLE_LABELS, getPermittedRoutes } from '@/utils/permissions';
import type { UserRole } from '@/types/database.types';

interface ModalCriarUsuarioProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const selectClass =
    'w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50';

const labelClass =
    'block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 ml-1';

/** Mesmas regras da Edge Function criar-usuario, para avisar antes de enviar. */
function validarSenha(senha: string): string | null {
    if (senha.length < 10) return 'A senha deve ter no mínimo 10 caracteres';
    if (!/[A-Z]/.test(senha)) return 'A senha deve conter ao menos uma letra maiúscula';
    if (!/[a-z]/.test(senha)) return 'A senha deve conter ao menos uma letra minúscula';
    if (!/[0-9]/.test(senha)) return 'A senha deve conter ao menos um número';
    return null;
}

export function ModalCriarUsuario({ isOpen, onClose, onSuccess }: ModalCriarUsuarioProps) {
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [role, setRole] = useState<UserRole>('TECNICO');

    useEffect(() => {
        if (!isOpen) return;
        setErro(null);
        setEmail('');
        setSenha('');
        setNome('');
        setSobrenome('');
        setRole('TECNICO');
    }, [isOpen]);

    if (!isOpen) return null;

    const erroSenha = senha ? validarSenha(senha) : null;
    const podeSalvar = !!email && !!nome && !!sobrenome && !!senha && !erroSenha;
    const telasDoPapel = getPermittedRoutes(role);

    const handleSubmit = async () => {
        if (!podeSalvar) return;
        setLoading(true);
        setErro(null);
        try {
            await usuarioService.criar({
                email: email.trim(),
                senha,
                nome: nome.trim(),
                sobrenome: sobrenome.trim(),
                role,
            });
            onSuccess?.();
            onClose();
        } catch (e) {
            setErro(e instanceof Error ? e.message : 'Não foi possível criar o usuário.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[var(--surface)] p-6 rounded-2xl shadow-2xl border border-[var(--border-subtle)] max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-start justify-between mb-8 border-b border-[var(--border-subtle)] pb-4">
                    <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                        Novo Usuário
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-xl transition-all"
                        disabled={loading}
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            disabled={loading}
                        />
                        <Input
                            label="Sobrenome"
                            value={sobrenome}
                            onChange={(e) => setSobrenome(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        error={erroSenha ?? undefined}
                        disabled={loading}
                    />

                    <div>
                        <label htmlFor="usuario-papel" className={labelClass}>Papel</label>
                        <select
                            id="usuario-papel"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            className={selectClass}
                            disabled={loading}
                        >
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                        </select>

                        <div className="mt-3 p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border-subtle)]">
                            <span className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                Telas liberadas para este papel
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {telasDoPapel.map((rota) => (
                                    <span
                                        key={rota}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    >
                                        {rota}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {erro && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-rose-400">{erro}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 font-bold py-4 rounded-xl"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        className="flex-1 font-black py-4 rounded-xl shadow-lg shadow-blue-500/20"
                        disabled={loading || !podeSalvar}
                        isLoading={loading}
                        leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    >
                        {loading ? 'Criando...' : 'Criar Usuário'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
