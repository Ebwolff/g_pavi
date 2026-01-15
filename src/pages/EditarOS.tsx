import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ordemServicoService } from '@/services/ordemServico.service';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnchoredValue } from '@/components/cognitive-bias';
import {
    ArrowLeft,
    Save,
    Trash2,
    Activity,
    User,
    Wrench,
    DollarSign,
    CheckCircle2,
    Clock
} from 'lucide-react';

export function EditarOS() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [numeroOS, setNumeroOS] = useState('');
    const [tipoOS, setTipoOS] = useState<'NORMAL' | 'GARANTIA'>('NORMAL');
    const [statusOS, setStatusOS] = useState('EM_EXECUCAO');
    const [nomeCliente, setNomeCliente] = useState('');
    const [modeloMaquina, setModeloMaquina] = useState('');
    const [chassi, setChassi] = useState('');
    const [descricaoProblema, setDescricaoProblema] = useState('');
    const [solucaoAplicada, setSolucaoAplicada] = useState('');
    const [valorMaoDeObra, setValorMaoDeObra] = useState('0');
    const [valorPecas, setValorPecas] = useState('0');
    const [valorDeslocamento, setValorDeslocamento] = useState('0');

    const { data: os, isLoading } = useQuery({
        queryKey: ['ordem-servico', id],
        queryFn: () => ordemServicoService.getById(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (os) {
            setNumeroOS(os.numero_os);
            setTipoOS(os.tipo_os);
            setStatusOS(os.status_atual);
            setNomeCliente(os.nome_cliente_digitavel || '');
            setModeloMaquina(os.modelo_maquina || '');
            setChassi(os.chassi || '');
            setDescricaoProblema(os.descricao_problema || '');
            setSolucaoAplicada(os.solucao_aplicada || '');
            setValorMaoDeObra(String(os.valor_mao_de_obra));
            setValorPecas(String(os.valor_pecas));
            setValorDeslocamento(String(os.valor_deslocamento));
        }
    }, [os]);

    const updateOSMutation = useMutation({
        mutationFn: (data: any) => ordemServicoService.update(id!, data),
        onSuccess: () => {
            navigate('/os/lista');
        },
        onError: (error: any) => {
            console.error('Erro ao atualizar OS:', error);
        },
    });

    const deleteOSMutation = useMutation({
        mutationFn: () => ordemServicoService.delete(id!),
        onSuccess: () => {
            navigate('/os/lista');
        },
        onError: (error: any) => {
            console.error('Erro ao deletar OS:', error);
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const data = {
            tipo_os: tipoOS,
            status_atual: statusOS as any,
            nome_cliente_digitavel: nomeCliente || null,
            modelo_maquina: modeloMaquina || null,
            chassi: chassi || null,
            descricao_problema: descricaoProblema || null,
            solucao_aplicada: solucaoAplicada || null,
            valor_mao_de_obra: parseFloat(valorMaoDeObra) || 0,
            valor_pecas: parseFloat(valorPecas) || 0,
            valor_deslocamento: parseFloat(valorDeslocamento) || 0,
        };

        updateOSMutation.mutate(data);
    };

    const handleDelete = () => {
        if (window.confirm('Tem certeza que deseja deletar esta OS? Esta ação não pode ser desfeita.')) {
            deleteOSMutation.mutate();
        }
    };

    const valorTotal =
        (parseFloat(valorMaoDeObra) || 0) +
        (parseFloat(valorPecas) || 0) +
        (parseFloat(valorDeslocamento) || 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="p-8 animate-fadeIn max-w-5xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <Skeleton width={40} height={40} className="rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton width={200} height={24} />
                                <Skeleton width={150} height={16} />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton height={200} className="rounded-2xl" />
                            <Skeleton height={300} className="rounded-2xl" />
                        </div>
                        <Skeleton height={400} className="rounded-2xl" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/os/lista')}
                            className="p-2.5 rounded-xl transition-all border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Editar OS #{numeroOS}</h1>
                                <StatusBadge status={statusOS as any} />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5">Gerenciamento técnico e financeiro do registro</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="hover:bg-rose-500/10 hover:text-rose-500 bg-transparent border-rose-500/50"
                        >
                            Excluir
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            isLoading={updateOSMutation.isPending}
                            leftIcon={<Save className="w-4 h-4" />}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Card: Identificação */}
                            <div className="glass-card-enterprise p-6 rounded-2xl">
                                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    Estado do Serviço
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Status Atual</label>
                                        <select
                                            value={statusOS}
                                            onChange={(e) => setStatusOS(e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium appearance-none cursor-pointer"
                                        >
                                            <option value="EM_EXECUCAO" className="bg-[#0f172a]">Em Execução</option>
                                            <option value="AGUARDANDO_PECAS" className="bg-[#0f172a]">Aguardando Peças</option>
                                            <option value="PAUSADA" className="bg-[#0f172a]">Pausada</option>
                                            <option value="CONCLUIDA" className="bg-[#0f172a]">Concluída</option>
                                            <option value="FATURADA" className="bg-[#0f172a]">Faturada</option>
                                            <option value="CANCELADA" className="bg-[#0f172a]">Cancelada</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Modalidade</label>
                                        <select
                                            value={tipoOS}
                                            onChange={(e) => setTipoOS(e.target.value as any)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium appearance-none cursor-pointer"
                                        >
                                            <option value="NORMAL" className="bg-[#0f172a]">Normal (N)</option>
                                            <option value="GARANTIA" className="bg-[#0f172a]">Garantia (W)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Cliente e Máquina */}
                            <div className="glass-card-enterprise p-6 rounded-2xl">
                                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" />
                                    Proprietário & Equipamento
                                </h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Nome do Cliente</label>
                                        <input
                                            type="text"
                                            value={nomeCliente}
                                            onChange={(e) => setNomeCliente(e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Modelo Comercial</label>
                                            <input
                                                type="text"
                                                value={modeloMaquina}
                                                onChange={(e) => setModeloMaquina(e.target.value)}
                                                className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Chassi / Serial</label>
                                            <input
                                                type="text"
                                                value={chassi}
                                                onChange={(e) => setChassi(e.target.value)}
                                                className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Serviço */}
                            <div className="glass-card-enterprise p-6 rounded-2xl">
                                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-blue-500" />
                                    Registro Técnico
                                </h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Problema Relatado</label>
                                        <textarea
                                            value={descricaoProblema}
                                            onChange={(e) => setDescricaoProblema(e.target.value)}
                                            rows={3}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1 flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            Solução Aplicada
                                        </label>
                                        <textarea
                                            value={solucaoAplicada}
                                            onChange={(e) => setSolucaoAplicada(e.target.value)}
                                            rows={3}
                                            placeholder="Descreva a solução técnica realizada..."
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Totais */}
                        <div className="space-y-6">
                            <div className="glass-card-enterprise p-6 rounded-2xl sticky top-8">
                                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    Detalhamento de Custos
                                </h2>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase ml-1">Mão de Obra</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={valorMaoDeObra}
                                            onChange={(e) => setValorMaoDeObra(e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase ml-1">Peças</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={valorPecas}
                                            onChange={(e) => setValorPecas(e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase ml-1">Deslocamento</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={valorDeslocamento}
                                            onChange={(e) => setValorDeslocamento(e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold"
                                        />
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-[var(--border-subtle)]">
                                        {/* Valor Total com Ancoragem Cognitiva */}
                                        <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-blue-500/10 mb-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Valor Consolidado</span>
                                                <span className="text-xl font-black text-emerald-400">
                                                    {formatCurrency(valorTotal)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium">
                                                <Clock className="w-3 h-3" />
                                                <span>Abertura em {os?.data_abertura ? new Intl.DateTimeFormat('pt-BR').format(new Date(os.data_abertura)) : '-'}</span>
                                            </div>
                                        </div>

                                        <AnchoredValue
                                            mainValue={valorTotal}
                                            currency={true}
                                            comparison={valorTotal > 5000 ? "Valor acima da média regional" : "Valor dentro da faixa esperada"}
                                            label="Insight Financeiro"
                                            className="bg-transparent border-none p-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
