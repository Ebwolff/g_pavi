import { logger } from '@/lib/logger';
import { useState, FormEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Save, X, FileText, Upload, RefreshCw, Package
} from 'lucide-react';

import { orcamentoService } from '@/services/orcamento.service';
import type { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UploadNBS_PDF, ExtractedNBS, ItemOrcamento } from '@/components/ui/UploadNBS_PDF';

export function OrcamentoForm() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    // Form State
    const [formData, setFormData] = useState({
        numero_orcamento: '',
        nome_cliente_digitavel: '',
        modelo_maquina: '',
        chassi: '',
        descricao_problema: '',
        valor_mao_de_obra: '0',
        valor_pecas: '0',
        valor_deslocamento: '0',
        tipo_diagnostico: '',
        observacoes: ''
    });

    // PDF file para upload ao Storage
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    // Itens/Peças extraídos do NBS
    const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>([]);

    const createMutation = useMutation({
        mutationFn: (data: Database['public']['Tables']['orcamentos_servico']['Insert']) => orcamentoService.create(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
            alert('Orçamento criado com sucesso!');
            navigate(`/orcamentos/${data.id}`);
        },
        onError: (error: Error) => {
            logger.error('Erro ao criar Orçamento:', error);
            alert(`Erro ao criar Orçamento: ${error.message || 'Ocorreu um erro'}`);
        },
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNBSUploadSuccess = (dados: ExtractedNBS) => {
        // Guardar o PDF original para upload posterior
        if (dados.pdfFile) {
            setPdfFile(dados.pdfFile);
        }
        // Guardar itens extraídos
        if (dados.itens && dados.itens.length > 0) {
            setItensOrcamento(dados.itens);
        }
        setFormData(prev => ({
            ...prev,
            ...(dados.numero_os && { numero_orcamento: dados.numero_os }),
            ...(dados.nome_cliente_digitavel && { nome_cliente_digitavel: dados.nome_cliente_digitavel }),
            ...(dados.modelo_maquina && { modelo_maquina: dados.modelo_maquina }),
            ...(dados.chassi && { chassi: dados.chassi }),
            ...(dados.descricao_problema && { descricao_problema: dados.descricao_problema }),
            ...(dados.valor_mao_de_obra && { valor_mao_de_obra: dados.valor_mao_de_obra }),
            ...(dados.valor_pecas && { valor_pecas: dados.valor_pecas }),
        }));
    };

    const totalCalculado = useMemo(() => {
        return (parseFloat(formData.valor_mao_de_obra) || 0) +
            (parseFloat(formData.valor_pecas) || 0) +
            (parseFloat(formData.valor_deslocamento) || 0);
    }, [formData.valor_mao_de_obra, formData.valor_pecas, formData.valor_deslocamento]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        let pdfNbsUrl: string | null = null;

        // Upload do PDF NBS ao Supabase Storage (se houver)
        if (pdfFile) {
            // Validação de segurança
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
                const fileName = `orcamentos/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

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
        
        createMutation.mutate({
            numero_orcamento: formData.numero_orcamento || undefined,
            nome_cliente_digitavel: formData.nome_cliente_digitavel || null,
            modelo_maquina: formData.modelo_maquina || null,
            chassi: formData.chassi || null,
            descricao_problema: formData.descricao_problema || null,
            valor_mao_de_obra: parseFloat(formData.valor_mao_de_obra) || 0,
            valor_pecas: parseFloat(formData.valor_pecas) || 0,
            valor_deslocamento: parseFloat(formData.valor_deslocamento) || 0,
            tipo_diagnostico: formData.tipo_diagnostico || null,
            observacoes: formData.observacoes || null,
            status_orcamento: 'EM_ELABORACAO',
            consultor_id: profile?.id,
            pdf_nbs_url: pdfNbsUrl,
            itens_orcamento: itensOrcamento.length > 0 ? (itensOrcamento as unknown as Database['public']['Tables']['orcamentos_servico']['Insert']['itens_orcamento']) : null
        });
    };

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate('/orcamentos')}
                            className="p-3 rounded-2xl transition-all border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <FileText className="w-4 h-4 text-blue-400" />
                                </span>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Painel Consultor</span>
                            </div>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Novo Orçamento</h1>
                            <p className="text-sm text-[var(--text-muted)]">Crie uma nova estimativa prévia de serviços e peças.</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/orcamentos')}
                            leftIcon={<X className="w-4 h-4" />}
                            className="rounded-2xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={createMutation.isPending}
                            leftIcon={createMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            className="rounded-2xl shadow-lg shadow-blue-500/20"
                        >
                            {createMutation.isPending ? 'Salvando...' : 'Salvar Orçamento'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Coluna Esquerda: Dados Principais */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Automação de NBS */}
                        <div className="bg-[var(--surface-light)] rounded-3xl p-6 border border-[var(--border-subtle)] shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[var(--text-primary)]">Preenchimento Automático (NBS)</h3>
                                        <p className="text-sm text-[var(--text-muted)]">Faça o upload do PDF NBS para preencher a maioria dos campos abaixo</p>
                                    </div>
                                </div>
                                <UploadNBS_PDF onUploadSuccess={handleNBSUploadSuccess} />
                            </div>
                        </div>

                        {/* Informações do Cliente & Máquina */}
                        <div className="bg-[var(--surface-light)] rounded-3xl border border-[var(--border-subtle)] shadow-sm p-6">
                            <h3 className="text-base font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                Informações Principais
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Número do Orçamento (Opcional)</label>
                                    <Input
                                        placeholder="Ex: ORC-24-001 (Deixe vazio para autom. no BD)"
                                        value={formData.numero_orcamento}
                                        onChange={(e) => handleInputChange('numero_orcamento', e.target.value)}
                                        className="h-12 bg-[var(--surface-hover)] border-transparent focus:bg-[var(--bg-primary)] transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Nome do Cliente</label>
                                    <Input
                                        placeholder="Digite o nome..."
                                        value={formData.nome_cliente_digitavel}
                                        onChange={(e) => handleInputChange('nome_cliente_digitavel', e.target.value)}
                                        className="h-12"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Modelo da Máquina</label>
                                    <Input
                                        placeholder="Ex: JD 7J, STS 9750..."
                                        value={formData.modelo_maquina}
                                        onChange={(e) => handleInputChange('modelo_maquina', e.target.value)}
                                        className="h-12"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Chassi do Equipamento</label>
                                    <Input
                                        placeholder="Digite o chassi..."
                                        value={formData.chassi}
                                        onChange={(e) => handleInputChange('chassi', e.target.value)}
                                        className="h-12 font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 space-y-1">
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Relato do Cliente / Diagnóstico Inicial</label>
                                <textarea
                                    className="w-full min-h-[120px] p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                                    placeholder="Descreva detalhadamente o problema relatado..."
                                    value={formData.descricao_problema}
                                    onChange={(e) => handleInputChange('descricao_problema', e.target.value)}
                                />
                            </div>

                            {/* Relação de Peças extraída do NBS */}
                            {itensOrcamento.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-blue-400" />
                                        Relação de Peças ({itensOrcamento.length} {itensOrcamento.length === 1 ? 'item' : 'itens'})
                                    </h3>
                                    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-[var(--surface-hover)]">
                                                    <th className="text-left px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Código</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Descrição</th>
                                                    <th className="text-center px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Qtde</th>
                                                    <th className="text-right px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Valor Unit.</th>
                                                    <th className="text-right px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Valor Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itensOrcamento.map((item, idx) => (
                                                    <tr key={idx} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                                                        <td className="px-4 py-3 font-mono text-xs text-blue-400">{item.codigo}</td>
                                                        <td className="px-4 py-3 text-[var(--text-primary)]">{item.descricao}</td>
                                                        <td className="px-4 py-3 text-center font-mono">{item.qtde}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                                                            {item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-[var(--text-primary)]">
                                                            {item.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna Direita: Financeiro e Salvar */}
                    <div className="space-y-6">
                        <div className="bg-[var(--surface-light)] rounded-3xl border border-[var(--border-subtle)] shadow-sm p-6 sticky top-6">
                            <h3 className="text-base font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">R$</span>
                                Estimativa Financeira
                            </h3>

                            <div className="space-y-5">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
                                        Peças (Estimado)
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.valor_pecas}
                                        onChange={(e) => handleInputChange('valor_pecas', e.target.value)}
                                        className="h-12 font-mono text-lg group-hover:border-blue-300 transition-colors bg-[var(--bg-primary)]"
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
                                        Mão de Obra
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.valor_mao_de_obra}
                                        onChange={(e) => handleInputChange('valor_mao_de_obra', e.target.value)}
                                        className="h-12 font-mono text-lg group-hover:border-blue-300 transition-colors bg-[var(--bg-primary)]"
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
                                        Deslocamento
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.valor_deslocamento}
                                        onChange={(e) => handleInputChange('valor_deslocamento', e.target.value)}
                                        className="h-12 font-mono text-lg group-hover:border-blue-300 transition-colors bg-[var(--bg-primary)]"
                                    />
                                </div>

                                <div className="pt-6 mt-6 border-t border-[var(--border-subtle)]">
                                    <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 flex items-center justify-between">
                                        <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                            Valor Líquido <br/>Estimado
                                        </span>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-gray-900 tracking-tight">
                                                R$ {totalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
