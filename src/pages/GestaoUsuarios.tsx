import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ModalCriarUsuario } from '@/components/ui/ModalCriarUsuario';
import { usuarioService, type Usuario } from '@/services/usuario.service';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS, getPermittedRoutes } from '@/utils/permissions';
import type { UserRole } from '@/types/database.types';
import { ArrowLeft, Plus, RefreshCw, ShieldCheck, UserX, UserCheck } from 'lucide-react';

const selectClass =
    'bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export function GestaoUsuarios() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [modalAberto, setModalAberto] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const { data: usuarios, isLoading, refetch } = useQuery({
        queryKey: ['usuarios'],
        queryFn: () => usuarioService.list(),
    });

    const invalidar = () => queryClient.invalidateQueries({ queryKey: ['usuarios'] });

    const mudarPapel = useMutation({
        mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
            usuarioService.alterarPapel(id, role),
        onSuccess: () => { setErro(null); invalidar(); },
        onError: (e: Error) => setErro(e.message),
    });

    const alternarAtivo = useMutation({
        mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
            usuarioService.definirAtivo(id, ativo),
        onSuccess: () => { setErro(null); invalidar(); },
        onError: (e: Error) => setErro(e.message),
    });

    const ehVoce = (u: Usuario) => u.id === user?.id;

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2.5 rounded-xl transition-all border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                            aria-label="Voltar"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestão de Usuários</h1>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5">
                                O papel de cada usuário define a que telas ele tem acesso
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => refetch()}
                            className="bg-[var(--surface-light)] border-[var(--border-subtle)]"
                            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setModalAberto(true)}
                            leftIcon={<Plus className="w-4 h-4" />}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Novo Usuário
                        </Button>
                    </div>
                </div>

                {erro && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
                        {erro}
                    </div>
                )}

                {isLoading ? (
                    <Skeleton className="h-64 w-full rounded-2xl" />
                ) : usuarios && usuarios.length > 0 ? (
                    <div className="glass-card-enterprise rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Usuário</TH>
                                    <TH>Papel</TH>
                                    <TH>Telas liberadas</TH>
                                    <TH>Situação</TH>
                                    <TH className="text-right">Ações</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {usuarios.map((u) => (
                                    <TR key={u.id}>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[var(--text-primary)]">
                                                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-muted)]">{u.username}</span>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) =>
                                                        mudarPapel.mutate({ id: u.id, role: e.target.value as UserRole })
                                                    }
                                                    className={selectClass}
                                                    disabled={ehVoce(u) || mudarPapel.isPending}
                                                    aria-label={`Papel de ${u.username}`}
                                                >
                                                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                                    ))}
                                                </select>
                                                {u.role === 'ADMIN' && (
                                                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                                )}
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                {getPermittedRoutes(u.role).map((rota) => (
                                                    <span
                                                        key={rota}
                                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    >
                                                        {rota}
                                                    </span>
                                                ))}
                                            </div>
                                        </TD>
                                        <TD>
                                            <span className={`text-xs font-bold ${u.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {u.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </TD>
                                        <TD className="text-right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    alternarAtivo.mutate({ id: u.id, ativo: !u.is_active })
                                                }
                                                disabled={ehVoce(u) || alternarAtivo.isPending}
                                                className="h-8 py-0 px-3 bg-white/5 border-white/10 hover:bg-white/10"
                                                leftIcon={
                                                    u.is_active
                                                        ? <UserX className="w-3.5 h-3.5" />
                                                        : <UserCheck className="w-3.5 h-3.5" />
                                                }
                                            >
                                                {u.is_active ? 'Desativar' : 'Ativar'}
                                            </Button>
                                        </TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                ) : (
                    <div className="glass-card-enterprise p-16 rounded-2xl border border-[var(--border-subtle)]">
                        <EmptyState
                            title="Nenhum usuário cadastrado"
                            description="Crie o primeiro usuário para liberar o acesso ao sistema."
                            action={{ label: 'Novo Usuário', onClick: () => setModalAberto(true) }}
                        />
                    </div>
                )}
            </div>

            <ModalCriarUsuario
                isOpen={modalAberto}
                onClose={() => setModalAberto(false)}
                onSuccess={invalidar}
            />
        </AppLayout>
    );
}
