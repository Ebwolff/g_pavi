import { logger } from '@/lib/logger';
import { useState, FormEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Save, X, Wrench, User,
    DollarSign, Activity, Hash, Tag,
    FileText, UserCheck, Settings, Info, Clock, AlertTriangle, Link2, Package, Search
} from 'lucide-react';

import { ordemServicoService } from '@/services/ordemServico.service';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatarValor } from '@/utils/osHelpers';
import { UploadNBS_PDF, ExtractedNBS, ItemOrcamento } from '@/components/ui/UploadNBS_PDF';
import { orcamentoService } from '@/services/orcamento.service';

export function NovaOS() {
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        numero_os: '',
        tipo_os: 'NORMAL' as 'NORMAL' | 'GARANTIA',
        nivel_urgencia: 'NORMAL' as 'NORMAL' | 'MEDIO' | 'ALTO' | 'CRITICO',
        nome_cliente_digitavel: '',
        modelo_maquina: '',
        chassi: '',
        descricao_problema: '',
        valor_mao_de_obra: '0',
        valor_pecas: '0',
        valor_deslocamento: '0',
        data_abertura: new Date().toISOString().substring(0, 16), // datetime-local format
        aol: '',
    });

    const queryClient = useQueryClient();

    const createOSMutation = useMutation({
        mutationFn: (data: any) => ordemServicoService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
            alert('OS criada com sucesso!');
            navigate('/os/lista');
        },
        onError: (error: any) => {
            logger.error('Erro ao criar OS:', error);
            alert(`Erro ao criar OS: ${error.message || 'Ocorreu um erro inesperado'}`);
        },
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateNumber = async () => {
        try {
            const nextNumber = await ordemServicoService.getNextOSNumber();
            handleInputChange('numero_os', nextNumber);
        } catch (error) {
            logger.error('Erro ao gerar número:', error);
        }
    };

    // PDF file para upload ao Storage
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    // Orçamento vinculado
    const [orcamentoVinculado, setOrcamentoVinculado] = useState<any>(null);
    const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>([]);
    const [numOrcamentoInput, setNumOrcamentoInput] = useState('');
    const [buscandoOrc, setBuscandoOrc] = useState(false);
    const [orcNaoEncontrado, setOrcNaoEncontrado] = useState(false);

    const buscarOrcamento = async (numero: string) => {
        if (!numero.trim()) {
            setOrcamentoVinculado(null);
            setOrcNaoEncontrado(false);
            return;
        }
        setBuscandoOrc(true);
        setOrcNaoEncontrado(false);
        const orc = await orcamentoService.findByNumeroNBS(numero.trim());
        if (orc) {
            setOrcamentoVinculado(orc);
            setOrcNaoEncontrado(false);
        } else {
            setOrcamentoVinculado(null);
            setOrcNaoEncontrado(true);
        }
        setBuscandoOrc(false);
    };

    const handleNBSUploadSuccess = async (dados: ExtractedNBS) => {
        // Guardar o PDF original para upload posterior
        if (dados.pdfFile) {
            setPdfFile(dados.pdfFile);
        }

        setFormData(prev => ({
            ...prev,
            ...(dados.numero_os && { numero_os: dados.numero_os }),
            ...(dados.nome_cliente_digitavel && { nome_cliente_digitavel: dados.nome_cliente_digitavel }),
            ...(dados.modelo_maquina && { modelo_maquina: dados.modelo_maquina }),
            ...(dados.chassi && { chassi: dados.chassi }),
            ...(dados.descricao_problema && { descricao_problema: dados.descricao_problema }),
            ...(dados.data_abertura && { data_abertura: dados.data_abertura }),
            ...(dados.tipo_os && { tipo_os: dados.tipo_os }),
            ...(dados.valor_mao_de_obra && { valor_mao_de_obra: dados.valor_mao_de_obra }),
            ...(dados.valor_pecas && { valor_pecas: dados.valor_pecas }),
        }));

        // Guardar itens extraídos do NBS
        if (dados.itens && dados.itens.length > 0) {
            setItensOrcamento(dados.itens);
        }

        // Auto-detectar orçamento vinculado pelo número NBS
        if (dados.numero_os) {
            setNumOrcamentoInput(dados.numero_os);
            const orc = await orcamentoService.findByNumeroNBS(dados.numero_os);
            if (orc) {
                setOrcamentoVinculado(orc);
                logger.log('[OS] Orçamento vinculado encontrado:', orc);
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.numero_os.trim()) return;

        let pdfNbsUrl: string | null = null;

        // Upload do PDF NBS ao Supabase Storage (se houver)
        if (pdfFile) {
            if (pdfFile.type !== 'application/pdf') {
                alert('Apenas arquivos PDF são permitidos para NBS.');
                return;
            }
            if (pdfFile.size > 10 * 1024 * 1024) {
                alert('Arquivo muito grande. O tamanho máximo é 10MB.');
                return;
            }

            try {
                const fileExt = pdfFile.name.split('.').pop() || 'pdf';
                const fileName = `ordens_servico/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('anexos_os')
                    .upload(fileName, pdfFile);

                if (uploadError) {
                    logger.error('Erro upload PDF NBS:', uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('anexos_os')
                        .getPublicUrl(fileName);
                    pdfNbsUrl = publicUrl;
                }
            } catch (err) {
                logger.error('Erro ao enviar PDF NBS:', err);
            }
        }

        createOSMutation.mutate({
            ...formData,
            nome_cliente_digitavel: formData.nome_cliente_digitavel || null,
            modelo_maquina: formData.modelo_maquina || null,
            chassi: formData.chassi || null,
            descricao_problema: formData.descricao_problema || null,
            valor_mao_de_obra: parseFloat(formData.valor_mao_de_obra) || 0,
            valor_pecas: parseFloat(formData.valor_pecas) || 0,
            valor_deslocamento: parseFloat(formData.valor_deslocamento) || 0,
            status_atual: 'AGUARDANDO_ATRIBUICAO',
            nivel_urgencia: formData.nivel_urgencia,
            data_abertura: new Date(formData.data_abertura).toISOString(),
            aol: formData.aol || null,
            orcamento_id: orcamentoVinculado?.id || null,
            itens_orcamento: itensOrcamento.length > 0 ? itensOrcamento : null,
            pdf_nbs_url: pdfNbsUrl,
        });
    };

    const totalCalculado = useMemo(() => {
        return (parseFloat(formData.valor_mao_de_obra) || 0) +
            (parseFloat(formData.valor_pecas) || 0) +
            (parseFloat(formData.valor_deslocamento) || 0);
    }, [formData.valor_mao_de_obra, formData.valor_pecas, formData.valor_deslocamento]);

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-6xl mx-auto space-y-8">
                {/* Modern Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate('/os/lista')}
                            className="p-3 rounded-2xl transition-all border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <FileText className="w-4 h-4 text-blue-400" />
                                </span>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Painel Administrativo</span>
                            </div>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Nova Ordem de Serviço</h1>
                            <p className="text-sm text-[var(--text-muted)]">Configure os detalhes do novo atendimento técnico.</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/os/lista')}
                            leftIcon={<X className="w-4 h-4" />}
                            className="rounded-2xl"
                        >
                            Descartar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            isLoading={createOSMutation.isPending}
                            leftIcon={<Save className="w-4 h-4" />}
                            className="shadow-xl shadow-blue-500/20 rounded-2xl px-8"
                        >
                            Finalizar Abertura
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Form Details */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Seção 0: Importador Automático NBS */}
                        <div className="glass-card-enterprise p-1 rounded-3xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5 relative overflow-hidden group mb-6">
                            <UploadNBS_PDF onUploadSuccess={handleNBSUploadSuccess} />
                        </div>

                        {/* Campo de Vinculação de Orçamento */}
                        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-light)] p-5 mb-6">
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4" />
                                Vincular Orçamento (Opcional)
                            </h4>
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Digite o número do orçamento NBS..."
                                    value={numOrcamentoInput}
                                    onChange={(e) => setNumOrcamentoInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarOrcamento(numOrcamentoInput))}
                                    className="h-10 font-mono flex-1"
                                    icon={Hash}
                                />
                                <button
                                    type="button"
                                    onClick={() => buscarOrcamento(numOrcamentoInput)}
                                    disabled={buscandoOrc || !numOrcamentoInput.trim()}
                                    className="px-4 h-10 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    {buscandoOrc ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>

                            {/* Resultado: Orçamento encontrado */}
                            {orcamentoVinculado && (
                                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 animate-fadeIn">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                            <Link2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-emerald-400">Orçamento Vinculado</h4>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                <span className="font-mono font-bold text-emerald-300">ORC-{orcamentoVinculado.numero_orcamento}</span>
                                                {orcamentoVinculado.nome_cliente_digitavel && (
                                                    <> — {orcamentoVinculado.nome_cliente_digitavel}</>
                                                )}
                                                {' — '}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    orcamentoVinculado.status_orcamento === 'APROVADO' ? 'bg-green-500/20 text-green-300' :
                                                    orcamentoVinculado.status_orcamento === 'ENVIADO_CLIENTE' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {orcamentoVinculado.status_orcamento?.replace(/_/g, ' ')}
                                                </span>
                                                {' — R$ '}
                                                <span className="font-mono font-bold text-emerald-300">
                                                    {(orcamentoVinculado.valor_liquido_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setOrcamentoVinculado(null); setNumOrcamentoInput(''); setOrcNaoEncontrado(false); }}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Resultado: Não encontrado */}
                            {orcNaoEncontrado && (
                                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 animate-fadeIn">
                                    <p className="text-xs text-amber-400 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Nenhum orçamento encontrado com o número <span className="font-mono font-bold">{numOrcamentoInput}</span>. A OS será criada sem vínculo.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Seção 1: Identificação */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/[0.03] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <Activity className="w-32 h-32 text-blue-500" />
                            </div>

                            <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-blue-500/30 rounded-full" />
                                <Settings className="w-4 h-4" />
                                Configuração do Atendimento
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Nº da Ordem de Serviço</label>
                                    <Input
                                        placeholder="XXXX-0000"
                                        value={formData.numero_os}
                                        onChange={(e) => handleInputChange('numero_os', e.target.value)}
                                        icon={Hash}
                                        required
                                    />
                                    <div className="flex justify-end pr-1 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleGenerateNumber}
                                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors"
                                        >
                                            [ Gerar Próximo Disponível ]
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2 relative">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Tipo de Serviço (NBS)</label>
                                    <div className="relative group/select">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within/select:text-blue-400 transition-colors z-10" />
                                        <select
                                            value={formData.tipo_os}
                                            onChange={(e) => handleInputChange('tipo_os', e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--text-primary)] font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="NORMAL" className="bg-[#0b0f14]">Atendimento Normal (N)</option>
                                            <option value="GARANTIA" className="bg-[#0b0f14]">Garantia de Fábrica (W)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Data/Hora de Abertura</label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.data_abertura}
                                        onChange={(e) => handleInputChange('data_abertura', e.target.value)}
                                        icon={Clock}
                                        required
                                    />
                                </div>

                                <div className="space-y-1 relative">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Nível de Urgência</label>
                                    <div className="relative group/select">
                                        <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within/select:text-amber-400 transition-colors z-10" />
                                        <select
                                            value={formData.nivel_urgencia}
                                            onChange={(e) => handleInputChange('nivel_urgencia', e.target.value)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--text-primary)] font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="NORMAL" className="bg-[#0b0f14] text-blue-400">Normal</option>
                                            <option value="MEDIO" className="bg-[#0b0f14] text-yellow-500">Médio</option>
                                            <option value="ALTO" className="bg-[#0b0f14] text-orange-500">Alto</option>
                                            <option value="CRITICO" className="bg-[#0b0f14] text-red-500">Crítico</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 opacity-50 cursor-not-allowed">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Status Inicial</label>
                                    <div className="relative group/select">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] z-10" />
                                        <div className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--text-primary)] font-medium">
                                            Aguardando Atribuição
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Cliente e Equipamento */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/[0.03] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <UserCheck className="w-32 h-32 text-emerald-500" />
                            </div>

                            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-emerald-500/30 rounded-full" />
                                <User className="w-4 h-4" />
                                Proprietário & Equipamento
                            </h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Razão Social / Nome Completo</label>
                                        <Input
                                            placeholder="Digite o nome do cliente..."
                                            value={formData.nome_cliente_digitavel}
                                            onChange={(e) => handleInputChange('nome_cliente_digitavel', e.target.value)}
                                            icon={User}
                                        />
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">ID AOL</label>
                                        <Input
                                            placeholder="AOL #"
                                            value={formData.aol}
                                            onChange={(e) => handleInputChange('aol', e.target.value)}
                                            icon={Info}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Modelo do Ativo</label>
                                        <Input
                                            placeholder="Ex: T250 / 8R 370"
                                            value={formData.modelo_maquina}
                                            onChange={(e) => handleInputChange('modelo_maquina', e.target.value)}
                                            icon={Activity}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Nº Chassi / Série</label>
                                        <Input
                                            placeholder="Identificador Único"
                                            value={formData.chassi}
                                            onChange={(e) => handleInputChange('chassi', e.target.value.toUpperCase())}
                                            icon={Info}
                                            className="uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Escopo Técnico */}
                        <div className="glass-card-enterprise p-0 rounded-3xl border border-white/[0.03] shadow-2xl overflow-hidden group">
                            <div className="p-8 border-b border-white/[0.03] bg-white/[0.01]">
                                <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Wrench className="w-4 h-4 text-amber-400" />
                                    Detalhamento Técnico
                                </h2>
                            </div>
                            <div className="p-8 pb-10">
                                <div className="relative">
                                    <textarea
                                        value={formData.descricao_problema}
                                        onChange={(e) => handleInputChange('descricao_problema', e.target.value)}
                                        rows={6}
                                        placeholder="Descreva detalhadamente a solicitação do cliente e o diagnóstico inicial..."
                                        className="w-full bg-transparent text-[var(--text-primary)] text-lg leading-relaxed placeholder:text-[var(--text-muted)] focus:outline-none resize-none font-medium"
                                    />
                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleInputChange('descricao_problema', (formData.descricao_problema || '') + '[MOTOR] ')}>Motor</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleInputChange('descricao_problema', (formData.descricao_problema || '') + '[TRANSMISSÃO] ')}>Transmissão</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleInputChange('descricao_problema', (formData.descricao_problema || '') + '[ELÉTRICA] ')}>Elétrica</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleInputChange('descricao_problema', (formData.descricao_problema || '') + '[HIDRÁULICA] ')}>Hidráulica</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Financial Sidebar */}
                    <div className="lg:col-span-4 sticky top-8 space-y-6">
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/[0.03] shadow-2xl bg-gradient-to-b from-white/[0.02] to-transparent">
                            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <DollarSign className="w-4 h-4" />
                                Composição Estimada
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest ml-1 mb-1 block">Mão de Obra</label>
                                    <Input
                                        type="number"
                                        value={formData.valor_mao_de_obra}
                                        onChange={(e) => handleInputChange('valor_mao_de_obra', e.target.value)}
                                        className="!bg-emerald-500/[0.02] border-emerald-500/10 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest ml-1 mb-1 block">Peças</label>
                                    <Input
                                        type="number"
                                        value={formData.valor_pecas}
                                        onChange={(e) => handleInputChange('valor_pecas', e.target.value)}
                                        className="!bg-emerald-500/[0.02] border-emerald-500/10 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest ml-1 mb-1 block">Deslocamento</label>
                                    <Input
                                        type="number"
                                        value={formData.valor_deslocamento}
                                        onChange={(e) => handleInputChange('valor_deslocamento', e.target.value)}
                                        className="!bg-emerald-500/[0.02] border-emerald-500/10 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="pt-8 mt-4 border-t border-white/[0.05] space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Total Bruto</span>
                                            <span className="text-3xl font-black text-emerald-400 tracking-tight">
                                                {formatarValor(totalCalculado)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex gap-3 items-start">
                                        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-emerald-500/80 leading-relaxed font-medium capitalize">
                                            Os valores inseridos são apenas uma previsão inicial. Detalhes finais serão gerados no fechamento técnico.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips Box */}
                        <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 border-dashed">
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                Verificação Rápida
                            </h4>
                            <ul className="space-y-2">
                                <li className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 font-medium">
                                    <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                    Número da OS é obrigatório.
                                </li>
                                <li className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 font-medium">
                                    <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                    Verifique o chassi da máquina.
                                </li>
                                <li className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 font-medium">
                                    <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                    Relato detalhado evita erros.
                                </li>
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
