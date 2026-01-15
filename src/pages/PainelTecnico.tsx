import { useState, useEffect } from 'react';
import {
    Wrench,
    Package,
    Plus,
    RefreshCw,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/cognitive-bias/MetricCard';
import { ModalAdicionarPeca } from '@/components/ui/ModalAdicionarPeca';

interface OSAtribuida {
    id: string;
    numero_os: string;
    nome_cliente_digitavel: string;
    modelo_maquina: string;
    status: string;
    data_abertura: string;
    descricao_problema: string;
    pecas_lancadas: number;
}

interface ItemOS {
    id: string;
    codigo_peca: string;
    descricao: string;
    quantidade: number;
    status_separacao: string;
}

export default function PainelTecnico() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [osAtribuidas, setOsAtribuidas] = useState<OSAtribuida[]>([]);
    const [selectedOS, setSelectedOS] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [estatisticas, setEstatisticas] = useState({
        totalOS: 0,
        emAndamento: 0,
        aguardandoPecas: 0,
        concluidas: 0
    });

    const carregarDados = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Buscar OS atribuídas ao técnico
            const { data: osData, error: osError } = await supabase
                .from('ordens_servico')
                .select(`
                    id,
                    numero_os,
                    nome_cliente_digitavel,
                    modelo_maquina,
                    status,
                    data_abertura,
                    descricao_problema,
                    itens_os (count)
                `)
                .eq('tecnico_id', user.id)
                .order('data_abertura', { ascending: false });

            if (osError) throw osError;

            const osFormatadas = (osData || []).map((os: any) => ({
                id: os.id,
                numero_os: os.numero_os,
                nome_cliente_digitavel: os.nome_cliente_digitavel,
                modelo_maquina: os.modelo_maquina,
                status: os.status,
                data_abertura: os.data_abertura,
                descricao_problema: os.descricao_problema,
                pecas_lancadas: os.itens_os?.[0]?.count || 0
            }));

            setOsAtribuidas(osFormatadas);

            // Calcular estatísticas
            setEstatisticas({
                totalOS: osFormatadas.length,
                emAndamento: osFormatadas.filter((os: any) => os.status === 'EM_ANDAMENTO').length,
                aguardandoPecas: osFormatadas.filter((os: any) => os.status === 'AGUARDANDO_PECAS').length,
                concluidas: osFormatadas.filter((os: any) => os.status === 'CONCLUIDA').length
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [user]);

    const handleAdicionarPecas = (osId: string) => {
        setSelectedOS(osId);
        setModalOpen(true);
    };

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Wrench className="w-8 h-8 text-blue-500" />
                            </div>
                            Painel do Técnico
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">
                            Suas ordens de serviço atribuídas
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
                        label="Total de OS"
                        value={estatisticas.totalOS}
                        icon={Wrench}
                        trend="stable"
                    />
                    <MetricCard
                        label="Em Andamento"
                        value={estatisticas.emAndamento}
                        icon={Clock}
                        trend="stable"
                    />
                    <MetricCard
                        label="Aguardando Peças"
                        value={estatisticas.aguardandoPecas}
                        icon={Package}
                        trend={estatisticas.aguardandoPecas > 0 ? 'down' : 'stable'}
                    />
                    <MetricCard
                        label="Concluídas"
                        value={estatisticas.concluidas}
                        icon={CheckCircle}
                        trend="up"
                    />
                </div>

                {/* Lista de OS */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2">
                        Ordens de Serviço ({osAtribuidas.length})
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} height={150} className="rounded-2xl" />
                            ))}
                        </div>
                    ) : osAtribuidas.length === 0 ? (
                        <EmptyState
                            icon={Wrench}
                            title="Nenhuma OS atribuída"
                            description="Você não possui ordens de serviço atribuídas no momento."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {osAtribuidas.map((os) => (
                                <div
                                    key={os.id}
                                    className="glass-card-enterprise p-6 rounded-2xl border border-white/[0.03] hover:bg-white/[0.04] transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-xs font-mono font-bold text-white bg-blue-500/20 px-2 py-1 rounded">
                                                    {os.numero_os}
                                                </span>
                                                <StatusBadge status={os.status as any} />
                                                {os.pecas_lancadas > 0 && (
                                                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                        <Package className="w-3 h-3" />
                                                        {os.pecas_lancadas} peça(s)
                                                    </span>
                                                )}
                                            </div>

                                            {/* Cliente e Máquina */}
                                            <div>
                                                <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
                                                    {os.nome_cliente_digitavel}
                                                </h4>
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    {os.modelo_maquina}
                                                </p>
                                            </div>

                                            {/* Descrição do Problema */}
                                            {os.descricao_problema && (
                                                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                    <p className="text-xs text-[var(--text-muted)] mb-1 font-semibold">
                                                        Problema Relatado:
                                                    </p>
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        {os.descricao_problema}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Data */}
                                            <div className="text-xs text-[var(--text-muted)]">
                                                Aberta em: {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                leftIcon={<Plus className="w-3.5 h-3.5" />}
                                                onClick={() => handleAdicionarPecas(os.id)}
                                            >
                                                Lançar Peças
                                            </Button>
                                            {os.status === 'AGUARDANDO_PECAS' && (
                                                <div className="flex items-center gap-1 text-xs text-amber-400">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Aguardando
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal de Adicionar Peças */}
                <ModalAdicionarPeca
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedOS(null);
                    }}
                    osId={selectedOS || ''}
                    onSuccess={carregarDados}
                />
            </div>
        </AppLayout>
    );
}
