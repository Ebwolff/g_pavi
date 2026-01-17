/**
 * Painel do Departamento Feramental
 * Gestão de frota de veículos e alocação para técnicos
 */

import { useState, useEffect } from 'react';
import {
    Car,
    Plus,
    RefreshCw,
    UserPlus,
    UserMinus,
    Edit,
    Trash2,
    Wrench,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/cognitive-bias/MetricCard';
import { ModalCadastrarVeiculo } from '@/components/ui/ModalCadastrarVeiculo';
import { ModalAlocarVeiculo } from '@/components/ui/ModalAlocarVeiculo';
import { frotaService, Veiculo, StatusVeiculo } from '@/services/frotaService';

const statusConfig: Record<StatusVeiculo, { label: string; color: string; bg: string }> = {
    'DISPONIVEL': { label: 'Disponível', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    'EM_USO': { label: 'Em Uso', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    'MANUTENCAO': { label: 'Manutenção', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    'INATIVO': { label: 'Inativo', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export default function PainelFeramental() {
    const [loading, setLoading] = useState(true);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [estatisticas, setEstatisticas] = useState({
        total: 0,
        disponiveis: 0,
        emUso: 0,
        manutencao: 0,
        inativos: 0,
    });

    // Modais
    const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
    const [modalAlocacaoOpen, setModalAlocacaoOpen] = useState(false);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
    const [filtroStatus, setFiltroStatus] = useState<StatusVeiculo | 'TODOS'>('TODOS');

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [veiculosData, stats] = await Promise.all([
                frotaService.getVeiculos(),
                frotaService.getEstatisticas(),
            ]);
            setVeiculos(veiculosData);
            setEstatisticas(stats);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleCadastrar = () => {
        setVeiculoSelecionado(null);
        setModalCadastroOpen(true);
    };

    const handleEditar = (veiculo: Veiculo) => {
        setVeiculoSelecionado(veiculo);
        setModalCadastroOpen(true);
    };

    const handleAlocar = (veiculo: Veiculo) => {
        setVeiculoSelecionado(veiculo);
        setModalAlocacaoOpen(true);
    };

    const handleDesalocar = async (veiculo: Veiculo) => {
        if (!confirm(`Deseja desalocar o veículo ${veiculo.placa} do técnico ${veiculo.tecnico?.nome_completo}?`)) return;

        try {
            await frotaService.desalocarVeiculo(veiculo.id);
            await carregarDados();
        } catch (error) {
            console.error('Erro ao desalocar:', error);
            alert('Erro ao desalocar veículo.');
        }
    };

    const handleExcluir = async (veiculo: Veiculo) => {
        if (!confirm(`Tem certeza que deseja excluir o veículo ${veiculo.placa}? Esta ação não pode ser desfeita.`)) return;

        try {
            await frotaService.excluirVeiculo(veiculo.id);
            await carregarDados();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir veículo.');
        }
    };

    const handleAlterarStatus = async (veiculo: Veiculo, novoStatus: StatusVeiculo) => {
        try {
            await frotaService.atualizarVeiculo(veiculo.id, { status: novoStatus });
            await carregarDados();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status.');
        }
    };

    const veiculosFiltrados = filtroStatus === 'TODOS'
        ? veiculos
        : veiculos.filter(v => v.status === filtroStatus);

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <Car className="w-8 h-8 text-indigo-500" />
                            </div>
                            Gestão de Frota
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">
                            Departamento Feramental - Controle de veículos e alocações
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="primary"
                            onClick={handleCadastrar}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            Cadastrar Veículo
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={carregarDados}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard
                        label="Total de Veículos"
                        value={estatisticas.total}
                        trend="stable"
                    />
                    <MetricCard
                        label="Disponíveis"
                        value={estatisticas.disponiveis}
                        trend={estatisticas.disponiveis > 0 ? 'up' : 'stable'}
                    />
                    <MetricCard
                        label="Em Uso"
                        value={estatisticas.emUso}
                        trend="stable"
                    />
                    <MetricCard
                        label="Em Manutenção"
                        value={estatisticas.manutencao}
                        trend={estatisticas.manutencao > 0 ? 'down' : 'stable'}
                    />
                    <MetricCard
                        label="Inativos"
                        value={estatisticas.inativos}
                        trend={estatisticas.inativos > 0 ? 'down' : 'stable'}
                    />
                </div>

                {/* Filtros */}
                <div className="flex gap-2 flex-wrap">
                    {['TODOS', 'DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'INATIVO'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFiltroStatus(status as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filtroStatus === status
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10'
                                }`}
                        >
                            {status === 'TODOS' ? 'Todos' : statusConfig[status as StatusVeiculo]?.label || status}
                        </button>
                    ))}
                </div>

                {/* Lista de Veículos */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2">
                        Veículos ({veiculosFiltrados.length})
                    </h3>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} height={200} className="rounded-2xl" />
                            ))}
                        </div>
                    ) : veiculosFiltrados.length === 0 ? (
                        <EmptyState
                            icon={Car}
                            title="Nenhum veículo encontrado"
                            description={filtroStatus === 'TODOS' ? 'Cadastre o primeiro veículo da frota.' : 'Nenhum veículo com este status.'}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {veiculosFiltrados.map((veiculo) => {
                                const statusInfo = statusConfig[veiculo.status];
                                return (
                                    <div
                                        key={veiculo.id}
                                        className="glass-card-enterprise p-5 rounded-2xl border border-white/[0.03] hover:bg-white/[0.04] transition-all"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <span className="text-lg font-mono font-black text-white bg-white/10 px-3 py-1 rounded">
                                                    {veiculo.placa}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${statusInfo.bg} ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        {/* Info do Veículo */}
                                        <div className="space-y-2 mb-4">
                                            <h4 className="text-base font-bold text-[var(--text-primary)]">
                                                {veiculo.marca} {veiculo.modelo}
                                            </h4>
                                            <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                                                {veiculo.ano && <span>Ano: {veiculo.ano}</span>}
                                                {veiculo.cor && <span>Cor: {veiculo.cor}</span>}
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-[var(--text-muted)]">Km: </span>
                                                <span className="font-bold text-[var(--text-primary)]">
                                                    {veiculo.km_atual?.toLocaleString('pt-BR')} km
                                                </span>
                                            </div>
                                        </div>

                                        {/* Técnico Alocado */}
                                        {veiculo.tecnico ? (
                                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-4">
                                                <p className="text-xs text-blue-400 mb-1">Técnico Alocado</p>
                                                <p className="text-sm font-bold text-white">
                                                    {veiculo.tecnico.nome_completo}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 mb-4">
                                                <p className="text-xs text-[var(--text-muted)]">Sem técnico alocado</p>
                                            </div>
                                        )}

                                        {/* Ações */}
                                        <div className="flex gap-2 flex-wrap">
                                            {veiculo.status === 'DISPONIVEL' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                                    onClick={() => handleAlocar(veiculo)}
                                                >
                                                    Alocar
                                                </Button>
                                            )}
                                            {veiculo.status === 'EM_USO' && veiculo.tecnico && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    leftIcon={<UserMinus className="w-3.5 h-3.5" />}
                                                    onClick={() => handleDesalocar(veiculo)}
                                                >
                                                    Desalocar
                                                </Button>
                                            )}
                                            {veiculo.status !== 'MANUTENCAO' && veiculo.status !== 'EM_USO' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    leftIcon={<Wrench className="w-3.5 h-3.5" />}
                                                    onClick={() => handleAlterarStatus(veiculo, 'MANUTENCAO')}
                                                >
                                                    Manutenção
                                                </Button>
                                            )}
                                            {veiculo.status === 'MANUTENCAO' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                                                    onClick={() => handleAlterarStatus(veiculo, 'DISPONIVEL')}
                                                >
                                                    Liberar
                                                </Button>
                                            )}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<Edit className="w-3.5 h-3.5" />}
                                                onClick={() => handleEditar(veiculo)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                                onClick={() => handleExcluir(veiculo)}
                                                className="hover:bg-rose-500/10"
                                            >
                                                Excluir
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modais */}
            <ModalCadastrarVeiculo
                isOpen={modalCadastroOpen}
                onClose={() => {
                    setModalCadastroOpen(false);
                    setVeiculoSelecionado(null);
                }}
                veiculo={veiculoSelecionado}
                onSuccess={carregarDados}
            />

            <ModalAlocarVeiculo
                isOpen={modalAlocacaoOpen}
                onClose={() => {
                    setModalAlocacaoOpen(false);
                    setVeiculoSelecionado(null);
                }}
                veiculo={veiculoSelecionado}
                onSuccess={carregarDados}
            />
        </AppLayout>
    );
}
