import { useState, FormEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    ArrowLeft, Save, X, Wrench, User,
    DollarSign, Activity, Hash, Tag,
    FileText, UserCheck, Settings, Info
} from 'lucide-react';

import { ordemServicoService } from '@/services/ordemServico.service';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatarValor } from '@/utils/osHelpers';

export function NovaOS() {
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        numero_os: '',
        tipo_os: 'NORMAL' as 'NORMAL' | 'GARANTIA',
        nome_cliente_digitavel: '',
        modelo_maquina: '',
        chassi: '',
        descricao_problema: '',
        valor_mao_de_obra: '0',
        valor_pecas: '0',
        valor_deslocamento: '0',
    });

    const createOSMutation = useMutation({
        mutationFn: (data: any) => ordemServicoService.create(data),
        onSuccess: () => navigate('/os/lista'),
        onError: (error: any) => console.error('Erro ao criar OS:', error),
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateNumber = async () => {
        try {
            const nextNumber = await ordemServicoService.getNextOSNumber();
            handleInputChange('numero_os', nextNumber);
        } catch (error) {
            console.error('Erro ao gerar número:', error);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.numero_os.trim()) return;

        createOSMutation.mutate({
            ...formData,
            nome_cliente_digitavel: formData.nome_cliente_digitavel || null,
            modelo_maquina: formData.modelo_maquina || null,
            chassi: formData.chassi || null,
            descricao_problema: formData.descricao_problema || null,
            valor_mao_de_obra: parseFloat(formData.valor_mao_de_obra) || 0,
            valor_pecas: parseFloat(formData.valor_pecas) || 0,
            valor_deslocamento: parseFloat(formData.valor_deslocamento) || 0,
            status_atual: 'EM_EXECUCAO' as const,
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
                        {/* Seção 1: Identificação */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/[0.03] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <Activity className="w-32 h-32 text-blue-500" />
                            </div>

                            <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-blue-500/30 rounded-full" />
                                <Settings className="w-4 h-4" />
                                Parâmetros Técnicos
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                <div className="md:col-span-3 space-y-2">
                                    <Input
                                        label="Número da OS"
                                        placeholder="EX: 2026-0001"
                                        value={formData.numero_os}
                                        onChange={(e) => handleInputChange('numero_os', e.target.value)}
                                        icon={Hash}
                                        required
                                    />
                                    <div className="flex justify-end pr-1">
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
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">Tipo de Serviço</label>
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
                        </div>

                        {/* Seção 2: Cliente e Equipamento */}
                        <div className="glass-card-enterprise p-8 rounded-3xl border border-white/[0.03] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <UserCheck className="w-32 h-32 text-emerald-500" />
                            </div>

                            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-emerald-500/30 rounded-full" />
                                <User className="w-4 h-4" />
                                Cliente & Ativo
                            </h2>

                            <div className="space-y-6">
                                <Input
                                    label="Cliente / Proprietário"
                                    placeholder="Razão Social ou Nome Completo"
                                    value={formData.nome_cliente_digitavel}
                                    onChange={(e) => handleInputChange('nome_cliente_digitavel', e.target.value)}
                                    icon={User}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Modelo da Máquina"
                                        placeholder="Ex: Trator Valtra T250"
                                        value={formData.modelo_maquina}
                                        onChange={(e) => handleInputChange('modelo_maquina', e.target.value)}
                                        icon={Activity}
                                    />
                                    <Input
                                        label="Nº Chassi / Série"
                                        placeholder="Identificador Único"
                                        value={formData.chassi}
                                        onChange={(e) => handleInputChange('chassi', e.target.value.toUpperCase())}
                                        icon={Info}
                                        className="uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Escopo Técnico */}
                        <div className="glass-card-enterprise p-0 rounded-3xl border border-white/[0.03] shadow-2xl overflow-hidden group">
                            <div className="p-8 border-b border-white/[0.03] bg-white/[0.01]">
                                <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Wrench className="w-4 h-4 text-amber-400" />
                                    Relato Técnico Inicial
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
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5">Motor</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5">Transmissão</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5">Elétrica</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border border-white/5">Hidráulica</span>
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
                                <div className="space-y-1 group">
                                    <Input
                                        type="number"
                                        label="Mão de Obra (R$)"
                                        value={formData.valor_mao_de_obra}
                                        onChange={(e) => handleInputChange('valor_mao_de_obra', e.target.value)}
                                        className="!bg-emerald-500/[0.02] border-emerald-500/10 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Input
                                        type="number"
                                        label="Peças & Insumos (R$)"
                                        value={formData.valor_pecas}
                                        onChange={(e) => handleInputChange('valor_pecas', e.target.value)}
                                        className="!bg-emerald-500/[0.02] border-emerald-500/10 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Input
                                        type="number"
                                        label="Deslocamento (R$)"
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
