import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ordemServicoService } from '@/services/ordemServico.service';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, X, Wrench, User, DollarSign, Activity } from 'lucide-react';

export function NovaOS() {
    const navigate = useNavigate();
    const [numeroOS, setNumeroOS] = useState('');
    const [tipoOS, setTipoOS] = useState<'NORMAL' | 'GARANTIA'>('NORMAL');
    const [nomeCliente, setNomeCliente] = useState('');
    const [modeloMaquina, setModeloMaquina] = useState('');
    const [chassi, setChassi] = useState('');
    const [descricaoProblema, setDescricaoProblema] = useState('');
    const [valorMaoDeObra, setValorMaoDeObra] = useState('0');
    const [valorPecas, setValorPecas] = useState('0');
    const [valorDeslocamento, setValorDeslocamento] = useState('0');

    const createOSMutation = useMutation({
        mutationFn: (data: any) => ordemServicoService.create(data),
        onSuccess: () => {
            navigate('/os/lista');
        },
        onError: (error: any) => {
            console.error('Erro ao criar OS:', error);
        },
    });

    const handleGenerateNumber = async () => {
        try {
            const nextNumber = await ordemServicoService.getNextOSNumber();
            setNumeroOS(nextNumber);
        } catch (error) {
            console.error('Erro ao gerar número:', error);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!numeroOS.trim()) return;

        const data = {
            numero_os: numeroOS,
            tipo_os: tipoOS,
            nome_cliente_digitavel: nomeCliente || null,
            modelo_maquina: modeloMaquina || null,
            chassi: chassi || null,
            descricao_problema: descricaoProblema || null,
            valor_mao_de_obra: parseFloat(valorMaoDeObra) || 0,
            valor_pecas: parseFloat(valorPecas) || 0,
            valor_deslocamento: parseFloat(valorDeslocamento) || 0,
            status_atual: 'EM_EXECUCAO' as const,
        };

        createOSMutation.mutate(data);
    };

    const valorTotal =
        (parseFloat(valorMaoDeObra) || 0) +
        (parseFloat(valorPecas) || 0) +
        (parseFloat(valorDeslocamento) || 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

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
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Nova Ordem de Serviço</h1>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5">Abertura de novo registro técnico</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/os/lista')}
                            leftIcon={<X className="w-4 h-4" />}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            isLoading={createOSMutation.isPending}
                            leftIcon={<Save className="w-4 h-4" />}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Criar OS
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
                                    Identificação Geral
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Número da OS <span className="text-rose-500">*</span></label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={numeroOS}
                                                onChange={(e) => setNumeroOS(e.target.value)}
                                                required
                                                placeholder="2026-XXXX"
                                                className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium"
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleGenerateNumber}
                                                className="px-6"
                                            >
                                                Gerar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Tipo de Serviço</label>
                                        <select
                                            value={tipoOS}
                                            onChange={(e) => setTipoOS(e.target.value as any)}
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium appearance-none cursor-pointer"
                                        >
                                            <option value="NORMAL" className="bg-[#0f172a]">Normal (N) - Pós-Venda</option>
                                            <option value="GARANTIA" className="bg-[#0f172a]">Garantia (W)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Cliente e Máquina */}
                            <div className="glass-card-enterprise p-6 rounded-2xl">
                                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" />
                                    Dados do Cliente & Equipamento
                                </h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Proprietário / Cliente</label>
                                        <input
                                            type="text"
                                            value={nomeCliente}
                                            onChange={(e) => setNomeCliente(e.target.value)}
                                            placeholder="Nome completo ou Razão Social"
                                            className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Modelo da Máquina</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={modeloMaquina}
                                                    onChange={(e) => setModeloMaquina(e.target.value)}
                                                    placeholder="Ex: Trator X500"
                                                    className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Chassi / Identificador</label>
                                            <input
                                                type="text"
                                                value={chassi}
                                                onChange={(e) => setChassi(e.target.value)}
                                                placeholder="Número do chassi"
                                                className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Descrição */}
                            <div className="glass-card-enterprise p-6 rounded-2xl">
                                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-blue-500" />
                                    Escopo do Problema / Serviço
                                </h2>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Relato Técnico / Problema</label>
                                    <textarea
                                        value={descricaoProblema}
                                        onChange={(e) => setDescricaoProblema(e.target.value)}
                                        rows={6}
                                        placeholder="Descreva detalhadamente o problema relatado pelo cliente ou identificado pelo técnico..."
                                        className="w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Totais */}
                        <div className="space-y-6">
                            <div className="glass-card-enterprise p-6 rounded-2xl sticky top-8">
                                <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    Composição de Valores
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
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-[var(--text-muted)]">Valor Total</span>
                                            <span className="text-2xl font-black text-emerald-400">
                                                {formatCurrency(valorTotal)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-[var(--text-muted)] leading-tight text-center mt-4">
                                            Certifique-se de que todos os valores estão corretos antes de salvar a Ordem de Serviço.
                                        </p>
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
