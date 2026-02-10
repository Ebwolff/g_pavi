import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ordemServicoService } from '@/services/ordemServico.service';
import { despesasService, DespesaOS, TipoDespesa } from '@/services/despesasService';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnchoredValue } from '@/components/cognitive-bias';
import { ModalLancarDespesa } from '@/components/ui/ModalLancarDespesa';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
    ArrowLeft,
    Save,
    Trash2,
    Activity,
    User,
    Wrench,
    DollarSign,
    CheckCircle2,
    Clock,
    Car,
    Fuel,
    Utensils,
    Hotel,
    CircleDollarSign,
    Plus,
    MoreHorizontal,
    ClipboardList,
    Hash,
    Settings,
    Briefcase
} from 'lucide-react';

export function EditarOS() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        numeroOS: '',
        tipoOS: 'NORMAL' as 'NORMAL' | 'GARANTIA',
        statusOS: 'EM_EXECUCAO',
        nomeCliente: '',
        modeloMaquina: '',
        chassi: '',
        descricaoProblema: '',
        solucaoAplicada: '',
        valorMaoDeObra: '0',
        valorPecas: '0',
        valorDeslocamento: '0',
    });

    const [despesas, setDespesas] = useState<DespesaOS[]>([]);
    const [modalDespesaOpen, setModalDespesaOpen] = useState(false);
    const [loadingDespesas, setLoadingDespesas] = useState(false);

    const { data: os, isLoading } = useQuery({
        queryKey: ['ordem-servico', id],
        queryFn: () => ordemServicoService.getById(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (os) {
            setFormData({
                numeroOS: os.numero_os,
                tipoOS: os.tipo_os,
                statusOS: os.status_atual,
                nomeCliente: os.nome_cliente_digitavel || '',
                modeloMaquina: os.modelo_maquina || '',
                chassi: os.chassi || '',
                descricaoProblema: os.descricao_problema || '',
                solucaoAplicada: os.solucao_aplicada || '',
                valorMaoDeObra: String(os.valor_mao_de_obra),
                valorPecas: String(os.valor_pecas),
                valorDeslocamento: String(os.valor_deslocamento),
            });
            carregarDespesas();
        }
    }, [os]);

    const carregarDespesas = async () => {
        if (!id) return;
        setLoadingDespesas(true);
        try {
            const data = await despesasService.getDespesasPorOS(id);
            setDespesas(data);
        } catch (error) {
            console.error('Erro ao carregar despesas:', error);
        } finally {
            setLoadingDespesas(false);
        }
    };

    const handleExcluirDespesa = async (despesaId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
        try {
            await despesasService.excluirDespesa(despesaId);
            await carregarDespesas();
        } catch (error) {
            console.error('Erro ao excluir despesa:', error);
        }
    };

    const tiposDespesaIcons: Record<TipoDespesa, { icon: any; color: string }> = {
        'KM': { icon: Car, color: 'text-blue-400 bg-blue-500/10' },
        'ABASTECIMENTO': { icon: Fuel, color: 'text-amber-400 bg-amber-500/10' },
        'ALIMENTACAO': { icon: Utensils, color: 'text-emerald-400 bg-emerald-500/10' },
        'HOSPEDAGEM': { icon: Hotel, color: 'text-purple-400 bg-purple-500/10' },
        'PEDAGIO': { icon: CircleDollarSign, color: 'text-rose-400 bg-rose-500/10' },
        'OUTROS': { icon: MoreHorizontal, color: 'text-slate-400 bg-slate-500/10' },
    };

    const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor_total || 0), 0);

    const updateOSMutation = useMutation({
        mutationFn: (data: any) => ordemServicoService.update(id!, data),
        onSuccess: () => navigate('/os/lista'),
        onError: (error: any) => console.error('Erro ao atualizar OS:', error),
    });

    const deleteOSMutation = useMutation({
        mutationFn: () => ordemServicoService.delete(id!),
        onSuccess: () => navigate('/os/lista'),
        onError: (error: any) => console.error('Erro ao deletar OS:', error),
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        const data = {
            tipo_os: formData.tipoOS,
            status_atual: formData.statusOS as any,
            nome_cliente_digitavel: formData.nomeCliente || null,
            modelo_maquina: formData.modeloMaquina || null,
            chassi: formData.chassi || null,
            descricao_problema: formData.descricaoProblema || null,
            solucao_aplicada: formData.solucaoAplicada || null,
            valor_mao_de_obra: parseFloat(formData.valorMaoDeObra) || 0,
            valor_pecas: parseFloat(formData.valorPecas) || 0,
            valor_deslocamento: parseFloat(formData.valorDeslocamento) || 0,
        };
        updateOSMutation.mutate(data);
    };

    const handleDelete = () => {
        if (window.confirm('Tem certeza que deseja deletar esta OS? Esta ação não pode ser desfeita.')) {
            deleteOSMutation.mutate();
        }
    };

    const valorTotal =
        (parseFloat(formData.valorMaoDeObra) || 0) +
        (parseFloat(formData.valorPecas) || 0) +
        (parseFloat(formData.valorDeslocamento) || 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="p-8 animate-fadeIn max-w-6xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <Skeleton className="w-12 h-12 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="w-64 h-8 rounded-lg" />
                                <Skeleton className="w-48 h-4 rounded-lg" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Skeleton className="h-64 w-full rounded-2xl opacity-40" />
                            <Skeleton className="h-96 w-full rounded-2xl opacity-40" />
                        </div>
                        <Skeleton className="h-[600px] w-full rounded-2xl opacity-40" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate('/os/lista')}
                            className="p-3 rounded-2xl transition-all border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-white tracking-tight">Editar OS #{formData.numeroOS}</h1>
                                <StatusBadge status={formData.statusOS as any} />
                            </div>
                            <p className="text-[var(--text-muted)] font-medium mt-1">Gerenciamento técnico e financeiro do registro</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                        >
                            Excluir Registro
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            isLoading={updateOSMutation.isPending}
                            leftIcon={<Save className="w-4 h-4" />}
                            className="shadow-xl shadow-blue-500/20 px-8"
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status e Tipo */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5 shadow-2xl">
                            <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <Settings className="w-4 h-4" />
                                Configurações do Fluxo
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Status do Atendimento</label>
                                    <div className="relative group">
                                        <select
                                            value={formData.statusOS}
                                            onChange={(e) => handleInputChange('statusOS', e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl px-5 py-4 text-white font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="EM_EXECUCAO">Em Execução</option>
                                            <option value="AGUARDANDO_PECAS">Aguardando Peças</option>
                                            <option value="PAUSADA">Pausada</option>
                                            <option value="CONCLUIDA">Concluída</option>
                                            <option value="FATURADA">Faturada</option>
                                            <option value="CANCELADA">Cancelada</option>
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                                            <Settings className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Modalidade de Faturamento</label>
                                    <div className="relative">
                                        <select
                                            value={formData.tipoOS}
                                            onChange={(e) => handleInputChange('tipoOS', e.target.value as any)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl px-5 py-4 text-white font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="NORMAL">Normal (N)</option>
                                            <option value="GARANTIA">Garantia (G)</option>
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                                            <ClipboardList className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dados de Identificação */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5 shadow-2xl">
                            <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <User className="w-4 h-4" />
                                Proprietário & Equipamento
                            </h2>
                            <div className="space-y-8">
                                <Input
                                    label="Cliente"
                                    icon={User}
                                    value={formData.nomeCliente}
                                    onChange={(e) => handleInputChange('nomeCliente', e.target.value)}
                                    placeholder="Nome completo do proprietário"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Input
                                        label="Modelo Comercial"
                                        icon={Briefcase}
                                        value={formData.modeloMaquina}
                                        onChange={(e) => handleInputChange('modeloMaquina', e.target.value)}
                                        placeholder="Ex: T250, A950"
                                    />
                                    <Input
                                        label="Número de Série / Chassi"
                                        icon={Hash}
                                        value={formData.chassi}
                                        onChange={(e) => handleInputChange('chassi', e.target.value)}
                                        placeholder="Identificação única"
                                        className="uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Detalhamento Técnico */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5 shadow-2xl">
                            <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <Wrench className="w-4 h-4" />
                                Laudo Técnico
                            </h2>
                            <div className="space-y-8">
                                <Textarea
                                    label="Sintomas e Reclamação"
                                    icon={Activity}
                                    value={formData.descricaoProblema}
                                    onChange={(e) => handleInputChange('descricaoProblema', e.target.value)}
                                    placeholder="Descreva o problema relatado..."
                                />
                                <Textarea
                                    label="Intervenção Realizada"
                                    icon={CheckCircle2}
                                    value={formData.solucaoAplicada}
                                    onChange={(e) => handleInputChange('solucaoAplicada', e.target.value)}
                                    placeholder="Descreva a solução técnica aplicada..."
                                    className="border-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Gestão de Despesas de Viagem */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Car className="w-4 h-4" />
                                    Custos de Deslocamento
                                </h2>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setModalDespesaOpen(true)}
                                    leftIcon={<Plus className="w-4 h-4" />}
                                    className="bg-white/5 border-white/10"
                                >
                                    Lançar Despesa
                                </Button>
                            </div>

                            {loadingDespesas ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-16 w-full rounded-2xl opacity-20" />
                                    <Skeleton className="h-16 w-full rounded-2xl opacity-10" />
                                </div>
                            ) : despesas.length === 0 ? (
                                <div className="text-center py-12 rounded-2xl bg-white/[0.01] border border-dashed border-white/5">
                                    <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Car className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
                                    </div>
                                    <p className="text-sm font-bold text-white">Sem pendências de despesa</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[200px] mx-auto">Lance quilometragem, alimentação ou combustíveis para compor o custo inicial.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {despesas.map((despesa) => {
                                            const tipoInfo = tiposDespesaIcons[despesa.tipo];
                                            const Icon = tipoInfo?.icon || MoreHorizontal;
                                            return (
                                                <div
                                                    key={despesa.id}
                                                    className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 group hover:bg-white/[0.04] transition-all"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`p-3 rounded-xl ${tipoInfo?.color || 'bg-slate-500/10'}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white leading-none mb-1.5">
                                                                {despesa.descricao || despesa.tipo}
                                                            </p>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-bold text-[var(--text-muted)] border-r border-white/10 pr-3">
                                                                    {new Date(despesa.data_despesa).toLocaleDateString('pt-BR')}
                                                                </span>
                                                                {despesa.tipo === 'KM' && (
                                                                    <span className="text-[10px] font-black text-blue-400">
                                                                        {despesa.quantidade} KM Percorridos
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-5">
                                                        <span className="text-lg font-black text-emerald-400">
                                                            {formatCurrency(despesa.valor_total)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleExcluirDespesa(despesa.id);
                                                            }}
                                                            className="p-2.5 rounded-xl opacity-0 group-hover:opacity-100 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/5 flex justify-between items-end px-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Base de Reembolso</span>
                                            <p className="text-xs text-[var(--text-muted)]">Custos operacionais de viagem aprovados</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-[var(--text-muted)] mr-2">Subtotal:</span>
                                            <span className="text-2xl font-black text-white">{formatCurrency(totalDespesas)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Financeira */}
                    <div className="space-y-8 sticky top-8">
                        {/* Composição Financeira */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[80px] pointer-events-none" />
                            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <DollarSign className="w-4 h-4" />
                                Visão Financeira
                            </h2>

                            <div className="space-y-8">
                                <Input
                                    label="Mão de Obra (MO)"
                                    type="number"
                                    step="0.01"
                                    value={formData.valorMaoDeObra}
                                    onChange={(e) => handleInputChange('valorMaoDeObra', e.target.value)}
                                    icon={Wrench}
                                />
                                <Input
                                    label="Peças Aplicadas"
                                    type="number"
                                    step="0.01"
                                    value={formData.valorPecas}
                                    onChange={(e) => handleInputChange('valorPecas', e.target.value)}
                                    icon={Settings}
                                />
                                <Input
                                    label="Taxa de Deslocamento"
                                    type="number"
                                    step="0.01"
                                    value={formData.valorDeslocamento}
                                    onChange={(e) => handleInputChange('valorDeslocamento', e.target.value)}
                                    icon={Car}
                                />

                                <div className="pt-8 mt-8 border-t border-white/5">
                                    <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 mb-6 relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-500" />
                                        <div className="flex justify-between items-center mb-2 relative z-10">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">Valor Total Líquido</span>
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-emerald-400 uppercase">Calculado</span>
                                            </div>
                                        </div>
                                        <div className="text-4xl font-black text-white tracking-tighter relative z-10">
                                            {formatCurrency(valorTotal)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 text-[10px] text-[var(--text-muted)] font-bold uppercase relative z-10">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Iniciada em {os?.data_abertura ? new Intl.DateTimeFormat('pt-BR').format(new Date(os.data_abertura)) : '-'}</span>
                                        </div>
                                    </div>

                                    <AnchoredValue
                                        mainValue={valorTotal}
                                        currency={true}
                                        comparison={valorTotal > 5000 ? "Score de rentabilidade alto" : "Valor comercial equilibrado"}
                                        label="Análise de Desempenho"
                                        className="bg-transparent border-none p-0 !gap-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Informações Extras / Metadados */}
                        <div className="glass-card-enterprise p-6 rounded-2xl border border-white/5 text-[var(--text-muted)] space-y-4">
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-50">
                                <Activity className="w-3.5 h-3.5" />
                                Log do Registro
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span>Criado em</span>
                                    <span className="text-white">{os?.created_at ? formatarData(os.created_at) : '-'}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-medium">
                                    <span>Última Edição</span>
                                    <span className="text-white">{os?.updated_at ? formatarData(os.updated_at) : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal de Lançar Despesa */}
                <ModalLancarDespesa
                    isOpen={modalDespesaOpen}
                    onClose={() => setModalDespesaOpen(false)}
                    osId={id || ''}
                    osNumero={formData.numeroOS}
                    onSuccess={carregarDespesas}
                />
            </div>
        </AppLayout>
    );
}

const formatarData = (data: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(data));
};
