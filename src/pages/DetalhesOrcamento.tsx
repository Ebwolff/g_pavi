import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ArrowLeft, CheckCircle, 
    Play, DollarSign, User, Wrench, Calendar, FileDown, Package
} from 'lucide-react';

import { orcamentoService } from '@/services/orcamento.service';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { CustomBadge } from '@/components/ui/StatusBadge';
import { formatarValor, formatarData } from '@/utils/osHelpers';

// Tipo helper temporário
type StatusOrcamentoType = 'EM_ELABORACAO' | 'ENVIADO_CLIENTE' | 'APROVADO' | 'REPROVADO' | 'CONVERTIDO_OS';

const statusConfig: Record<StatusOrcamentoType, { label: string, color: 'blue' | 'yellow' | 'green' | 'red' | 'gray' }> = {
    EM_ELABORACAO: { label: 'Em Elaboração', color: 'gray' },
    ENVIADO_CLIENTE: { label: 'Enviado ao Cliente', color: 'blue' },
    APROVADO: { label: 'Aprovado', color: 'green' },
    REPROVADO: { label: 'Reprovado', color: 'red' },
    CONVERTIDO_OS: { label: 'Convertido em OS', color: 'yellow' }
};

export function DetalhesOrcamento() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isConverting, setIsConverting] = useState(false);

    const { data: orcamento, isLoading } = useQuery({
        queryKey: ['orcamento', id],
        queryFn: () => orcamentoService.getById(id!),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: (novoStatus: string) => orcamentoService.updateStatus(id!, novoStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orcamento', id] });
            queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
        }
    });

    const converterMutation = useMutation({
        mutationFn: () => {
            if (!orcamento) throw new Error("Sem orcamento");
            return orcamentoService.converterParaOS(id!, {
                // Passa os dados basicos que faltam se precisar
                nivel_urgencia: 'NORMAL' // Pode abrir modal no futuro para escolher urgência
            })
        },
        onSuccess: (novaOS) => {
            queryClient.invalidateQueries({ queryKey: ['orcamento', id] });
            queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
            queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
            alert('Orçamento convertido com sucesso! Redirecionando para a nova O.S.');
            navigate(`/os/editar/${novaOS.id}`);
        },
        onError: (e: any) => {
            logger.error('Erro ao converter:', e);
            alert(`Erro ao converter: ${e.message}`);
        }
    });

    const handleConverterOS = () => {
        if (!confirm('Deseja realmente gerar a Ordem de Serviço a partir deste orçamento? Todos os dados financeiros serão migrados internamente.')) return;
        setIsConverting(true);
        converterMutation.mutate(undefined, {
            onSettled: () => setIsConverting(false)
        });
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                        <span className="text-gray-500 font-medium">Carregando detalhes do orçamento...</span>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!orcamento) return null;

    const stat = statusConfig[orcamento.status_orcamento as StatusOrcamentoType] || { label: orcamento.status_orcamento, color: 'gray' };

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-5xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/orcamentos')}
                            className="p-3 rounded-2xl transition-all border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                                    {orcamento.numero_orcamento}
                                </h1>
                                <CustomBadge 
                                    label={stat.label} 
                                    variant={stat.color as any} 
                                />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatarData(orcamento.data_criacao).split(' ')[0]}
                                {orcamento.consultor && (
                                    <>
                                        <span className="mx-2 line-through opacity-30"></span>
                                        <User className="w-4 h-4" />
                                        {orcamento.consultor.first_name} {orcamento.consultor.last_name}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Ações de Status */}
                        {orcamento.status_orcamento === 'EM_ELABORACAO' && (
                            <Button 
                                variant="secondary" 
                                onClick={() => statusMutation.mutate('ENVIADO_CLIENTE')}
                            >
                                Marcar como Enviado
                            </Button>
                        )}
                        {orcamento.status_orcamento === 'ENVIADO_CLIENTE' && (
                            <>
                                <Button 
                                    variant="secondary"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => statusMutation.mutate('REPROVADO')}
                                >
                                    Reprovado
                                </Button>
                                <Button 
                                    variant="secondary"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                    onClick={() => statusMutation.mutate('APROVADO')}
                                >
                                    Aprovado pelo Cliente
                                </Button>
                            </>
                        )}
                        
                        {/* AÇÃO PRINCIPAL DA ARQUITETURA */}
                        {orcamento.status_orcamento === 'APROVADO' && (
                            <Button
                                variant="primary"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 border-none shadow-xl shadow-blue-500/30"
                                leftIcon={<Play className="w-5 h-5 fill-current" />}
                                onClick={handleConverterOS}
                                disabled={isConverting}
                            >
                                {isConverting ? 'Convertendo...' : 'Gerar Ordem de Serviço'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column (Info) */}
                    <div className="md:col-span-2 space-y-6">
                        <section className="bg-[var(--surface-light)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Dados do Cliente
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Nome / Razão Social</p>
                                    <p className="font-semibold text-[var(--text-primary)]">
                                        {orcamento.nome_cliente_digitavel || orcamento.cliente?.nome_cliente || 'Não informado'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-[var(--surface-light)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Wrench className="w-4 h-4" />
                                Máquina e Diagnóstico
                            </h3>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Modelo</p>
                                    <p className="font-semibold text-[var(--text-primary)]">{orcamento.modelo_maquina || 'N/I'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Chassi</p>
                                    <p className="font-mono text-[var(--text-primary)]">{orcamento.chassi || 'N/I'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)] mb-2">Relato do Cliente / Problema</p>
                                <div className="bg-[var(--bg-primary)] p-4 rounded-xl text-sm border border-[var(--border-subtle)] whitespace-pre-wrap">
                                    {orcamento.descricao_problema || 'Nenhum problema relatado.'}
                                </div>
                            </div>
                            
                            {orcamento.observacoes && (
                                <div className="mt-4">
                                    <p className="text-xs text-[var(--text-muted)] mb-2">Observações Internas</p>
                                    <div className="bg-yellow-50/50 p-4 rounded-xl text-sm border border-yellow-100 text-yellow-800">
                                        {orcamento.observacoes}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Relação de Peças */}
                        {(orcamento as any).itens_orcamento && (orcamento as any).itens_orcamento.length > 0 && (
                            <section className="bg-[var(--surface-light)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Relação de Peças ({(orcamento as any).itens_orcamento.length} {(orcamento as any).itens_orcamento.length === 1 ? 'item' : 'itens'})
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
                                            {(orcamento as any).itens_orcamento.map((item: any, idx: number) => (
                                                <tr key={idx} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{item.codigo}</td>
                                                    <td className="px-4 py-3 text-[var(--text-primary)]">{item.descricao}</td>
                                                    <td className="px-4 py-3 text-center font-mono">{item.qtde}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                                                        {Number(item.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--text-primary)]">
                                                        {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {/* PDF NBS Anexado */}
                        {(orcamento as any).pdf_nbs_url && (
                            <section className="bg-[var(--surface-light)] rounded-2xl p-6 border border-[var(--border-subtle)]">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileDown className="w-4 h-4" />
                                    PDF NBS Anexado
                                </h3>
                                <a
                                    href={(orcamento as any).pdf_nbs_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all group"
                                >
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <FileDown className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold group-hover:underline">Visualizar PDF do NBS</p>
                                        <p className="text-xs text-blue-400/60">Clique para abrir o documento original</p>
                                    </div>
                                </a>
                            </section>
                        )}
                    </div>

                    {/* Right Column (Financial) */}
                    <div>
                        <section className="bg-[var(--surface-light)] rounded-2xl p-6 border border-[var(--border-subtle)] sticky top-6">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Resumo Financeiro
                            </h3>

                            <div className="space-y-4 font-mono">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-muted)]">Mão de Obra</span>
                                    <span className="font-semibold text-[var(--text-primary)]">{formatarValor(orcamento.valor_mao_de_obra || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-muted)]">Peças e Insumos</span>
                                    <span className="font-semibold text-[var(--text-primary)]">{formatarValor(orcamento.valor_pecas || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-muted)]">Deslocamento (Rota)</span>
                                    <span className="font-semibold text-[var(--text-primary)]">{formatarValor(orcamento.valor_deslocamento || 0)}</span>
                                </div>

                                <div className="pt-4 mt-4 border-t border-dashed border-[var(--border-subtle)]">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-[var(--text-secondary)] uppercase">Líquido Estimado</span>
                                        <span className="text-xl font-black text-[var(--text-primary)]">
                                            {formatarValor(orcamento.valor_liquido_total || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {orcamento.status_orcamento === 'CONVERTIDO_OS' && (
                                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-bold mb-1">Orçamento Faturado</p>
                                        <p className="opacity-80">Este orçamento já foi transformado em Ordem de Serviço na Oficina. Não é possível editá-lo.</p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
