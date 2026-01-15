import { useState, useEffect } from 'react';
import {
    Package,
    CheckCircle,
    ShoppingCart,
    RefreshCw,
    AlertTriangle,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/cognitive-bias/MetricCard';

interface PecaSolicitada {
    item_id: string;
    ordem_servico_id: string;
    numero_os: string;
    cliente: string;
    codigo_peca: string | null;
    descricao: string;
    quantidade: number;
    unidade: string;
    status_separacao: string;
    estoque_disponivel: number | null;
    disponibilidade: 'DISPONIVEL' | 'PARCIAL' | 'INDISPONIVEL';
    tecnico_responsavel: string;
    data_solicitacao: string;
}

const disponibilidadeColors = {
    'DISPONIVEL': 'bg-emerald-500',
    'PARCIAL': 'bg-amber-500',
    'INDISPONIVEL': 'bg-rose-500'
};

export default function PainelAlmoxarifado() {
    const [loading, setLoading] = useState(true);
    const [pecas, setPecas] = useState<PecaSolicitada[]>([]);
    const [filtroDisponibilidade, setFiltroDisponibilidade] = useState<string>('');

    const [estatisticas, setEstatisticas] = useState({
        totalPendentes: 0,
        disponiveis: 0,
        indisponiveis: 0,
        separadas: 0
    });

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Buscar peças pendentes da view
            const { data, error } = await supabase
                .from('vw_pecas_pendentes_separacao')
                .select('*');

            if (error) throw error;

            const pecasFormatadas = (data || []).map((p: any) => ({
                item_id: p.item_id,
                ordem_servico_id: p.ordem_servico_id,
                numero_os: p.numero_os,
                cliente: p.cliente,
                codigo_peca: p.codigo_peca,
                descricao: p.descricao,
                quantidade: p.quantidade,
                unidade: p.unidade,
                status_separacao: p.status_separacao,
                estoque_disponivel: p.estoque_disponivel,
                disponibilidade: p.disponibilidade,
                tecnico_responsavel: p.tecnico_responsavel,
                data_solicitacao: p.data_solicitacao
            }));

            setPecas(pecasFormatadas);

            // Calcular estatísticas
            setEstatisticas({
                totalPendentes: pecasFormatadas.filter((p: any) => p.status_separacao === 'PENDENTE').length,
                disponiveis: pecasFormatadas.filter((p: any) => p.disponibilidade === 'DISPONIVEL').length,
                indisponiveis: pecasFormatadas.filter((p: any) => p.disponibilidade === 'INDISPONIVEL').length,
                separadas: 0 // Será implementado quando buscarmos histórico
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleSepararPeca = async (itemId: string, codigoPeca: string, quantidade: number) => {
        try {
            // Chamar função de dar baixa no estoque
            const { error: baixaError } = await supabase.rpc('dar_baixa_estoque', {
                p_codigo_peca: codigoPeca,
                p_quantidade: quantidade
            });

            if (baixaError) throw baixaError;

            // Atualizar status do item
            const { error: updateError } = await supabase
                .from('itens_os')
                .update({ status_separacao: 'SEPARADO' })
                .eq('id', itemId);

            if (updateError) throw updateError;

            alert('Peça separada com sucesso!');
            carregarDados();
        } catch (error: any) {
            console.error('Erro ao separar peça:', error);
            alert(error.message || 'Erro ao separar peça');
        }
    };

    const handleSolicitarCompra = async (peca: PecaSolicitada) => {
        try {
            // Criar solicitação de compra
            const { data: solicitacao, error: solicitacaoError } = await supabase
                .from('solicitacoes_compra')
                .insert({
                    ordem_servico_id: peca.ordem_servico_id,
                    codigo_peca: peca.codigo_peca,
                    descricao_peca: peca.descricao,
                    quantidade: peca.quantidade,
                    unidade: peca.unidade,
                    urgencia: 'ALTA',
                    status: 'PENDENTE'
                })
                .select()
                .single();

            if (solicitacaoError) throw solicitacaoError;

            // Atualizar item da OS
            const { error: updateError } = await supabase
                .from('itens_os')
                .update({
                    status_separacao: 'AGUARDANDO_COMPRA',
                    solicitacao_compra_id: solicitacao.id
                })
                .eq('id', peca.item_id);

            if (updateError) throw updateError;

            alert('Solicitação de compra criada com sucesso!');
            carregarDados();
        } catch (error: any) {
            console.error('Erro ao solicitar compra:', error);
            alert(error.message || 'Erro ao criar solicitação');
        }
    };

    const pecasFiltradas = pecas.filter(p => {
        if (!filtroDisponibilidade) return true;
        return p.disponibilidade === filtroDisponibilidade;
    });

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Package className="w-8 h-8 text-purple-500" />
                            </div>
                            Almoxarifado
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">
                            Separação de peças e gestão de estoque
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={carregarDados}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                    >
                        Atualizar
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="Pendentes"
                        value={estatisticas.totalPendentes}
                        icon={Package}
                        trend={estatisticas.totalPendentes > 5 ? 'down' : 'stable'}
                    />
                    <MetricCard
                        label="Disponíveis"
                        value={estatisticas.disponiveis}
                        icon={CheckCircle}
                        trend="up"
                    />
                    <MetricCard
                        label="Indisponíveis"
                        value={estatisticas.indisponiveis}
                        icon={AlertTriangle}
                        trend={estatisticas.indisponiveis > 0 ? 'down' : 'stable'}
                    />
                    <MetricCard
                        label="Separadas Hoje"
                        value={estatisticas.separadas}
                        icon={TrendingUp}
                        trend="stable"
                    />
                </div>

                {/* Filtro */}
                <div className="glass-card-enterprise p-4 rounded-2xl border border-white/[0.03]">
                    <select
                        value={filtroDisponibilidade}
                        onChange={(e) => setFiltroDisponibilidade(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        <option value="">Todas as Disponibilidades</option>
                        <option value="DISPONIVEL">Disponível em Estoque</option>
                        <option value="PARCIAL">Parcialmente Disponível</option>
                        <option value="INDISPONIVEL">Indisponível</option>
                    </select>
                </div>

                {/* Lista de Peças */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2">
                        Peças Solicitadas ({pecasFiltradas.length})
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} height={120} className="rounded-2xl" />
                            ))}
                        </div>
                    ) : pecasFiltradas.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="Nenhuma peça pendente"
                            description="Não há peças aguardando separação no momento."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pecasFiltradas.map((peca) => (
                                <div
                                    key={peca.item_id}
                                    className="glass-card-enterprise p-6 rounded-2xl border border-white/[0.03] hover:bg-white/[0.04] transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-xs font-mono font-bold text-white bg-purple-500/20 px-2 py-1 rounded">
                                                    OS: {peca.numero_os}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${disponibilidadeColors[peca.disponibilidade]}`}>
                                                    {peca.disponibilidade}
                                                </span>
                                                {peca.codigo_peca && (
                                                    <span className="text-xs font-mono text-[var(--text-muted)]">
                                                        {peca.codigo_peca}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Descrição */}
                                            <div>
                                                <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
                                                    {peca.descricao}
                                                </h4>
                                                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                                    <span>
                                                        Qtd: <strong className="text-[var(--text-secondary)]">{peca.quantidade} {peca.unidade}</strong>
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        Estoque: <strong className={peca.estoque_disponivel && peca.estoque_disponivel >= peca.quantidade ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {peca.estoque_disponivel || 0} {peca.unidade}
                                                        </strong>
                                                    </span>
                                                    <span>•</span>
                                                    <span>Cliente: <strong className="text-[var(--text-secondary)]">{peca.cliente}</strong></span>
                                                </div>
                                            </div>

                                            {/* Técnico */}
                                            <div className="text-xs text-[var(--text-muted)]">
                                                Técnico: <span className="text-[var(--text-secondary)]">{peca.tecnico_responsavel}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            {peca.disponibilidade === 'DISPONIVEL' && peca.status_separacao === 'PENDENTE' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                                                    onClick={() => handleSepararPeca(peca.item_id, peca.codigo_peca!, peca.quantidade)}
                                                >
                                                    Separar
                                                </Button>
                                            )}
                                            {(peca.disponibilidade === 'INDISPONIVEL' || peca.disponibilidade === 'PARCIAL') && peca.status_separacao === 'PENDENTE' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                                                    onClick={() => handleSolicitarCompra(peca)}
                                                >
                                                    Solicitar Compra
                                                </Button>
                                            )}
                                            {peca.status_separacao === 'AGUARDANDO_COMPRA' && (
                                                <div className="flex items-center gap-1 text-xs text-amber-400">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Aguardando Compra
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
