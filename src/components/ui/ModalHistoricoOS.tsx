import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Clock,
    Timer,
    Calendar,
    DollarSign,
    History,
    CheckCircle2,
    Package,
    Wrench,
    AlertCircle,
    FastForward,
    ImageIcon,
    FileText
} from 'lucide-react';
import { ordemServicoService } from '@/services/ordemServico.service';
import { anexosService, Anexo } from '@/services/anexosService';
import { format, differenceInHours, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModalHistoricoOSProps {
    isOpen: boolean;
    onClose: () => void;
    osId: string;
    osNumero: string;
}

interface ItemHistorico {
    id: string;
    status_anterior: string | null;
    status_novo: string;
    created_at: string;
    motivo_mudanca: string | null;
    duracao?: string;
}

export function ModalHistoricoOS({ isOpen, onClose, osId, osNumero }: ModalHistoricoOSProps) {
    const [historico, setHistorico] = useState<ItemHistorico[]>([]);
    const [anexos, setAnexos] = useState<Anexo[]>([]);
    const [os, setOs] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && osId) {
            fetchData();
        }
    }, [isOpen, osId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [histData, anexosData, osData] = await Promise.all([
                ordemServicoService.getHistoricoStatus(osId),
                anexosService.getAnexosByOS(osId),
                ordemServicoService.getById(osId)
            ]);

            // Processar durações (cronologia ASC para cálculo)
            const sortedHist = [...(histData as any[])].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            const histComDuracao = sortedHist.map((item, index) => {
                let duracaoStr = '-';
                if (index < sortedHist.length - 1) {
                    const nextDate = new Date(sortedHist[index + 1].created_at);
                    const currDate = new Date(item.created_at);
                    duracaoStr = calculateDuration(currDate, nextDate);
                } else if (osData.status_atual !== 'FATURADA' && osData.status_atual !== 'CANCELADA') {
                    // Se for o último status e a OS ainda estiver aberta, calculamos até agora
                    duracaoStr = calculateDuration(new Date(item.created_at), new Date());
                }

                return { ...item, duracao: duracaoStr };
            }) as ItemHistorico[];

            setHistorico([...histComDuracao].reverse()); // Exibir mais recente primeiro na lista, mas pipeline é cronológico
            setAnexos(anexosData as Anexo[]);
            setOs(osData);
        } catch (error) {
            logger.error('Erro ao buscar histórico:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = (start: Date, end: Date) => {
        const days = differenceInDays(end, start);
        const hours = differenceInHours(end, start) % 24;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h`;
        return ' < 1h';
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
            'AGUARDANDO_ATRIBUICAO': { color: 'text-slate-400', bg: 'bg-slate-500/10', icon: Clock, label: 'Triagem' },
            'EM_EXECUCAO': { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Wrench, label: 'Execução' },
            'AGUARDANDO_PECAS': { color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Package, label: 'Aguardando Peças' },
            'PAUSADA': { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Timer, label: 'Pausada' },
            'CONCLUIDA': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Concluída' },
            'FATURADA': { color: 'text-emerald-500', bg: 'bg-emerald-600/20', icon: DollarSign, label: 'Faturada' },
            'CANCELADA': { color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle, label: 'Cancelada' },
            'EM_DIAGNOSTICO': { color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: History, label: 'Diagnóstico' }
        };
        return configs[status] || { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Clock, label: status };
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-fadeIn overflow-y-auto">
            <div className="glass-card-enterprise w-full max-w-6xl my-8 rounded-[2rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col animate-slideUp bg-[#0a0c10]">
                {/* Scrollable Container */}
                <div className="overflow-y-auto custom-scrollbar max-h-[90vh]">
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0c10]/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                <History className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">Histórico OS <span className="text-blue-500">#{osNumero}</span></h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest leading-none pt-0.5">
                                            Abertura: {os?.data_abertura ? format(parseISO(os.data_abertura), "dd 'de' MMMM", { locale: ptBR }) : '-'}
                                        </span>
                                    </div>
                                    {os?.status_atual && (
                                        <div className={`px-4 py-1 rounded-full border ${getStatusConfig(os.status_atual).bg} ${getStatusConfig(os.status_atual).color.replace('text-', 'border-')}/30`}>
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${getStatusConfig(os.status_atual).color}`}>
                                                {getStatusConfig(os.status_atual).label}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white border border-transparent hover:border-white/10">
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {loading ? (
                            <div className="lg:col-span-3 py-24 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                <p className="text-sm font-bold text-blue-400 uppercase tracking-[0.2em]">Carregando Histórico...</p>
                            </div>
                        ) : (
                            <>
                                {/* Column 1 & 2: Pipeline & Images */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Visual Pipeline */}
                                    <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5 bg-white/[0.01]">
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                            <FastForward className="w-5 h-5 text-blue-500" />
                                            Fluxo de Atendimento
                                        </h3>

                                        <div className="relative">
                                            {/* Timeline Line */}
                                            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600/40 via-blue-500/10 to-transparent rounded-full" />

                                            <div className="space-y-12">
                                                {historico.length > 0 ? [...historico].reverse().map((item, idx) => {
                                                    const config = getStatusConfig(item.status_novo);
                                                    const Icon = config.icon;
                                                    return (
                                                        <div key={item.id} className="relative pl-16 group">
                                                            {/* Node */}
                                                            <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl ${config.bg} border border-white/10 flex items-center justify-center z-10 transition-transform group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]`}>
                                                                <Icon className={`w-6 h-6 ${config.color}`} />
                                                            </div>

                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                <div>
                                                                    <p className={`text-lg font-black tracking-tight ${config.color}`}>{config.label}</p>
                                                                    <div className="flex items-center gap-3 mt-1 text-white/40">
                                                                        <span className="text-xs font-bold">{format(parseISO(item.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                                                                        {item.motivo_mudanca && (
                                                                            <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] italic">"{item.motivo_mudanca}"</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {item.duracao && (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">Tempo de Permanência</span>
                                                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-xl border border-white/10 mt-1">
                                                                            <Timer className="w-3.5 h-3.5 text-blue-400" />
                                                                            <span className="text-sm font-black text-white font-mono">{item.duracao}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Images for this Segment */}
                                                            <div className="mt-6 flex flex-wrap gap-3">
                                                                {anexos.filter(anexo => {
                                                                    if (anexo.tipo_anexo === 'COMPROVANTE') return false;
                                                                    const anexoDate = new Date(anexo.created_at).getTime();
                                                                    const statusDate = new Date(item.created_at).getTime();
                                                                    const nextStatus = [...historico].reverse()[idx + 1];
                                                                    if (!nextStatus) return anexoDate >= statusDate;
                                                                    return anexoDate >= statusDate && anexoDate < new Date(nextStatus.created_at).getTime();
                                                                }).map(relevantAnexo => (
                                                                    <a
                                                                        key={relevantAnexo.id}
                                                                        href={relevantAnexo.url_anexo}
                                                                        target="_blank"
                                                                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all hover:scale-105 active:scale-95 shadow-lg group/img"
                                                                    >
                                                                        <img src={relevantAnexo.url_anexo} alt="Anexo" className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div className="py-12 flex flex-col items-center justify-center opacity-20">
                                                        <History className="w-16 h-16 mb-4" />
                                                        <p className="font-bold uppercase tracking-[0.3em]">Sem registros de histórico</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Stats & Financials */}
                                <div className="space-y-8">
                                    {/* Summary Card */}
                                    <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent">
                                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Resumo Financeiro</h3>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-500" /></div>
                                                    <span className="text-sm font-bold text-white/60">Mão de Obra</span>
                                                </div>
                                                <span className="text-lg font-black text-white">{os?.valor_mao_de_obra?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Package className="w-4 h-4 text-blue-500" /></div>
                                                    <span className="text-sm font-bold text-white/60">Peças & Materiais</span>
                                                </div>
                                                <span className="text-lg font-black text-white">{os?.valor_pecas?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2 text-center">Valor Líquido Total</span>
                                                <span className="text-3xl font-black text-white block text-center tracking-tighter">
                                                    {os?.valor_liquido_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Box */}
                                    <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5">
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6">Informações da OS</h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Técnico Responsável</span>
                                                <span className="text-sm font-bold text-white">{os?.tecnico?.nome_completo || 'Não atribuído'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Modelo da Máquina</span>
                                                <span className="text-sm font-bold text-white">{os?.modelo_maquina || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Consultor</span>
                                                <span className="text-sm font-bold text-white">{os?.consultor?.first_name || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tech Gallery */}
                                    <div className="glass-card-enterprise p-8 rounded-3xl border border-white/5">
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                            Fotos do Serviço ({anexos.filter(a => a.tipo_anexo !== 'COMPROVANTE').length})
                                            <ImageIcon className="w-4 h-4" />
                                        </h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {anexos.filter(a => a.tipo_anexo !== 'COMPROVANTE').slice(0, 8).map(anexo => (
                                                <a
                                                    key={anexo.id}
                                                    href={anexo.url_anexo}
                                                    target="_blank"
                                                    className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-white/5 hover:border-blue-500/30 transition-all"
                                                >
                                                    <img src={anexo.url_anexo} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
                                                </a>
                                            ))}
                                            {anexos.filter(a => a.tipo_anexo !== 'COMPROVANTE').length > 8 && (
                                                <div className="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                                    <span className="text-xs font-black text-white/40">+{anexos.filter(a => a.tipo_anexo !== 'COMPROVANTE').length - 8}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expenditure Gallery */}
                                    <div className="glass-card-enterprise p-8 rounded-3xl border border-rose-500/10 bg-rose-500/[0.02]">
                                        <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                            Comprovantes de Despesa ({anexos.filter(a => a.tipo_anexo === 'COMPROVANTE').length})
                                            <FileText className="w-4 h-4" />
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {anexos.filter(a => a.tipo_anexo === 'COMPROVANTE').map(anexo => (
                                                <a
                                                    key={anexo.id}
                                                    href={anexo.url_anexo}
                                                    target="_blank"
                                                    className="group/receipt relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-rose-500/50 transition-all"
                                                >
                                                    <img src={anexo.url_anexo} className="w-full h-full object-cover opacity-40 group-hover/receipt:opacity-100 transition-all" />
                                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm border-t border-white/10 translate-y-full group-hover/receipt:translate-y-0 transition-transform">
                                                        <p className="text-[9px] font-bold text-white truncate">{anexo.descricao || 'Recibo'}</p>
                                                    </div>
                                                    <div className="absolute top-2 right-2 p-1.5 bg-rose-600 rounded-lg shadow-lg opacity-0 group-hover/receipt:opacity-100 transition-opacity">
                                                        <FileText className="w-3 h-3 text-white" />
                                                    </div>
                                                </a>
                                            ))}
                                            {anexos.filter(a => a.tipo_anexo === 'COMPROVANTE').length === 0 && (
                                                <div className="col-span-2 py-8 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl opacity-20">
                                                    <FileText className="w-8 h-8 mb-2" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Nenhum comprovante</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
