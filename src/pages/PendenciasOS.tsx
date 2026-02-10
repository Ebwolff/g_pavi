import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { pendenciaService } from '@/services/pendencia.service';
import { formatarData } from '@/utils/osHelpers';
import {
    AlertCircle,
    Clock,
    CheckCircle,
    Plus,
    Search,
    Filter,
    ArrowLeft,
    RefreshCw,
    ExternalLink
} from 'lucide-react';

export function PendenciasOS() {
    const navigate = useNavigate();
    const [uiFilters, setUiFilters] = useState({
        busca: '',
        tipo: 'TODOS',
        status: 'TODOS'
    });

    const { data: pendencias, isLoading, refetch } = useQuery({
        queryKey: ['pendencias', uiFilters],
        queryFn: () => pendenciaService.list({
            search: uiFilters.busca || undefined,
            tipo: uiFilters.tipo === 'TODOS' ? undefined : uiFilters.tipo,
            status: uiFilters.status === 'TODOS' ? undefined : uiFilters.status
        })
    });

    const stats = useMemo(() => {
        if (!pendencias) return { total: 0, pendentes: 0, emAndamento: 0, resolvidas: 0 };
        return {
            total: pendencias.length,
            pendentes: pendencias.filter(p => p.status === 'PENDENTE').length,
            emAndamento: pendencias.filter(p => p.status === 'EM_ANDAMENTO').length,
            resolvidas: pendencias.filter(p => p.status === 'RESOLVIDO').length,
        };
    }, [pendencias]);

    const getIconeTipo = (tipo: string) => {
        const colors: Record<string, string> = {
            PECAS: 'text-amber-400',
            SERVICO: 'text-blue-400',
            TERCEIROS: 'text-purple-400',
            GARANTIA: 'text-rose-400',
            CLIENTE: 'text-emerald-400',
            OUTROS: 'text-slate-400',
        };
        return <AlertCircle className={`h-4 w-4 ${colors[tipo] || 'text-slate-400'}`} />;
    };

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn space-y-8">
                {/* Header Page */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2.5 rounded-xl transition-all border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestão de Pendências</h1>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5">Controle de gargalos e pendências técnicas/comerciais</p>
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
                            onClick={() => navigate('/pendencias/nova')}
                            leftIcon={<Plus className="w-4 h-4" />}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Nova Pendência
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        title="Total de Pendências"
                        value={stats.total}
                        icon={AlertCircle}
                        subtitle="Volume total registrado"
                    />
                    <Card
                        title="Pendentes"
                        value={stats.pendentes}
                        icon={Clock}
                        color="amber"
                        trend={{ value: 12, label: 'vs mês anterior', isPositive: false }}
                        subtitle="Aguardando início"
                    />
                    <Card
                        title="Em Andamento"
                        value={stats.emAndamento}
                        icon={RefreshCw}
                        color="blue"
                        subtitle="Em execução técnica"
                    />
                    <Card
                        title="Resolvidas"
                        value={stats.resolvidas}
                        icon={CheckCircle}
                        color="emerald"
                        subtitle="Ciclo finalizado"
                    />
                </div>

                {/* Filter Bar */}
                <div className="glass-card-enterprise p-6 rounded-2xl border border-[var(--border-subtle)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase ml-1 flex items-center gap-2">
                                <Search className="w-3 h-3" /> Buscar
                            </label>
                            <input
                                type="text"
                                value={uiFilters.busca}
                                onChange={(e) => setUiFilters(prev => ({ ...prev, busca: e.target.value }))}
                                placeholder="Descrição ou OS..."
                                className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase ml-1 flex items-center gap-2">
                                <Filter className="w-3 h-3" /> Tipo
                            </label>
                            <select
                                value={uiFilters.tipo}
                                onChange={(e) => setUiFilters(prev => ({ ...prev, tipo: e.target.value }))}
                                className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="TODOS">Todos os Tipos</option>
                                <option value="PECAS">Peças</option>
                                <option value="SERVICO">Serviço</option>
                                <option value="TERCEIROS">Terceiros</option>
                                <option value="GARANTIA">Garantia</option>
                                <option value="CLIENTE">Cliente</option>
                                <option value="OUTROS">Outros</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase ml-1 flex items-center gap-2">
                                <Filter className="w-3 h-3" /> Status
                            </label>
                            <select
                                value={uiFilters.status}
                                onChange={(e) => setUiFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="TODOS">Todos os Status</option>
                                <option value="PENDENTE">Pendente</option>
                                <option value="EM_ANDAMENTO">Em Andamento</option>
                                <option value="RESOLVIDO">Resolvido</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                {isLoading ? (
                    <div className="glass-card-enterprise rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-10 w-full rounded-lg" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg opacity-20" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    </div>
                ) : pendencias && pendencias.length > 0 ? (
                    <div className="glass-card-enterprise rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Tipo</TH>
                                    <TH>Descrição / Responsável</TH>
                                    <TH>Ordem de Serviço</TH>
                                    <TH>Datas</TH>
                                    <TH>Status</TH>
                                    <TH className="text-right">Ações</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {pendencias.map((pendencia) => (
                                    <TR key={pendencia.id}>
                                        <TD>
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                                                    {getIconeTipo(pendencia.tipo_pendencia)}
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-primary)] tracking-tight">
                                                    {pendencia.tipo_pendencia}
                                                </span>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="space-y-1">
                                                <p className="text-sm text-white font-medium leading-tight">{pendencia.descricao}</p>
                                                {pendencia.responsavel && (
                                                    <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                                                        Resp: {pendencia.responsavel}
                                                    </p>
                                                )}
                                            </div>
                                        </TD>
                                        <TD>
                                            <div
                                                className="group flex flex-col cursor-pointer"
                                                onClick={() => navigate(`/os/editar/${pendencia.os_id}`)}
                                            >
                                                <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 transition-colors">
                                                    <span className="text-sm font-bold tracking-wider">
                                                        {pendencia.ordens_servico?.numero_os || '-'}
                                                    </span>
                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                {pendencia.ordens_servico?.nome_cliente_digitavel && (
                                                    <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 max-w-[150px]">
                                                        {pendencia.ordens_servico.nome_cliente_digitavel}
                                                    </span>
                                                )}
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="text-[var(--text-muted)] w-8">Início:</span>
                                                    <span className="text-[var(--text-secondary)] font-medium">{formatarData(pendencia.data_inicio)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="text-[var(--text-muted)] w-8">Prev:</span>
                                                    <span className={pendencia.data_prevista ? "text-amber-400 font-medium" : "text-[var(--text-muted)]"}>
                                                        {pendencia.data_prevista ? formatarData(pendencia.data_prevista) : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TD>
                                        <TD>
                                            <StatusBadge status={pendencia.status as any} />
                                        </TD>
                                        <TD className="text-right">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => navigate(`/pendencias/editar/${pendencia.id}`)}
                                                className="h-8 py-0 px-3 bg-white/5 border-white/10 hover:bg-white/10"
                                            >
                                                Ver Detalhes
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
                            title="Nenhuma pendência localizada"
                            description={uiFilters.busca ? "Não encontramos resultados para sua busca. Tente termos menos específicos." : "Parece que você está em dia! Nenhuma pendência registrada no momento."}
                            action={{
                                label: uiFilters.busca || uiFilters.tipo !== 'TODOS' || uiFilters.status !== 'TODOS' ? "Limpar Filtros" : "Criar Nova Pendência",
                                onClick: () => {
                                    if (uiFilters.busca || uiFilters.tipo !== 'TODOS' || uiFilters.status !== 'TODOS') {
                                        setUiFilters({ busca: '', tipo: 'TODOS', status: 'TODOS' });
                                    } else {
                                        navigate('/pendencias/nova');
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
