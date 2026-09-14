import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { pendenciaService, type PendenciaComOS } from '@/services/pendencia.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import type { TipoPendencia, StatusPendencia } from '@/types/database.types';

interface ModalPendenciaProps {
    isOpen: boolean;
    onClose: () => void;
    /** Quando informada, o modal edita essa pendência em vez de criar uma nova. */
    pendencia?: PendenciaComOS | null;
    onSuccess?: () => void;
}

const TIPOS: { value: TipoPendencia; label: string }[] = [
    { value: 'PECAS', label: 'Peças' },
    { value: 'SERVICO', label: 'Serviço' },
    { value: 'TERCEIROS', label: 'Terceiros' },
    { value: 'GARANTIA', label: 'Garantia' },
    { value: 'CLIENTE', label: 'Cliente' },
    { value: 'OUTROS', label: 'Outros' },
];

const STATUS: { value: StatusPendencia; label: string }[] = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
    { value: 'RESOLVIDO', label: 'Resolvido' },
    { value: 'CANCELADO', label: 'Cancelado' },
];

const selectClass =
    'w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const labelClass =
    'block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 ml-1';

function toDateInput(value: string | null | undefined): string {
    return value ? value.split('T')[0] : '';
}

export function ModalPendencia({ isOpen, onClose, pendencia, onSuccess }: ModalPendenciaProps) {
    const isEdicao = !!pendencia;
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const [osId, setOsId] = useState('');
    const [tipo, setTipo] = useState<TipoPendencia>('PECAS');
    const [status, setStatus] = useState<StatusPendencia>('PENDENTE');
    const [descricao, setDescricao] = useState('');
    const [dataPrevista, setDataPrevista] = useState('');
    const [responsavel, setResponsavel] = useState('');
    const [observacoes, setObservacoes] = useState('');

    // Só carrega a lista de OS quando o modal abre e é criação — na edição a OS é fixa.
    const { data: listaOS } = useQuery({
        queryKey: ['os-para-pendencia'],
        queryFn: () => ordemServicoService.list({}, 1, 100),
        enabled: isOpen && !isEdicao,
    });

    useEffect(() => {
        if (!isOpen) return;
        setErro(null);
        setOsId(pendencia?.os_id ?? '');
        setTipo((pendencia?.tipo_pendencia as TipoPendencia) ?? 'PECAS');
        setStatus((pendencia?.status as StatusPendencia) ?? 'PENDENTE');
        setDescricao(pendencia?.descricao ?? '');
        setDataPrevista(toDateInput(pendencia?.data_prevista));
        setResponsavel(pendencia?.responsavel ?? '');
        setObservacoes(pendencia?.observacoes ?? '');
    }, [isOpen, pendencia]);

    if (!isOpen) return null;

    const podeSalvar = !!osId && descricao.trim().length > 0;

    const handleSubmit = async () => {
        if (!podeSalvar) return;
        setLoading(true);
        setErro(null);
        try {
            const dados = {
                os_id: osId,
                tipo_pendencia: tipo,
                status,
                descricao: descricao.trim(),
                data_prevista: dataPrevista ? new Date(dataPrevista).toISOString() : null,
                responsavel: responsavel.trim() || null,
                observacoes: observacoes.trim() || null,
                // Carimba a resolução quando a pendência é encerrada, e limpa se for reaberta.
                data_resolucao: status === 'RESOLVIDO' ? new Date().toISOString() : null,
            };

            if (isEdicao && pendencia) {
                await pendenciaService.update(pendencia.id, dados);
            } else {
                await pendenciaService.create(dados);
            }

            onSuccess?.();
            onClose();
        } catch (e) {
            setErro(e instanceof Error ? e.message : 'Não foi possível salvar a pendência.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[var(--surface)] p-6 rounded-2xl shadow-2xl border border-[var(--border-subtle)] max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-start justify-between mb-8 border-b border-[var(--border-subtle)] pb-4">
                    <div>
                        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                            {isEdicao ? 'Editar Pendência' : 'Nova Pendência'}
                        </h2>
                        {isEdicao && pendencia?.ordens_servico?.numero_os && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                                    Protocolo OS
                                </span>
                                <span className="text-sm font-black text-blue-500">
                                    #{pendencia.ordens_servico.numero_os}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-xl transition-all"
                        disabled={loading}
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                <div className="space-y-6">
                    {!isEdicao && (
                        <div>
                            <label htmlFor="pendencia-os" className={labelClass}>
                                Ordem de Serviço
                            </label>
                            <select
                                id="pendencia-os"
                                value={osId}
                                onChange={(e) => setOsId(e.target.value)}
                                className={selectClass}
                                disabled={loading}
                            >
                                <option value="">Selecione a OS</option>
                                {(listaOS?.data ?? []).map((os) => (
                                    <option key={os.id} value={os.id}>
                                        #{os.numero_os}
                                        {os.nome_cliente_digitavel ? ` — ${os.nome_cliente_digitavel}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="pendencia-tipo" className={labelClass}>Tipo</label>
                            <select
                                id="pendencia-tipo"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as TipoPendencia)}
                                className={selectClass}
                                disabled={loading}
                            >
                                {TIPOS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="pendencia-status" className={labelClass}>Status</label>
                            <select
                                id="pendencia-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as StatusPendencia)}
                                className={selectClass}
                                disabled={loading}
                            >
                                {STATUS.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Textarea
                        label="Descrição"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        rows={3}
                        disabled={loading}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Previsão"
                            type="date"
                            value={dataPrevista}
                            onChange={(e) => setDataPrevista(e.target.value)}
                            disabled={loading}
                        />
                        <Input
                            label="Responsável"
                            value={responsavel}
                            onChange={(e) => setResponsavel(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <Textarea
                        label="Observações"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows={2}
                        disabled={loading}
                    />

                    {erro && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-rose-400">{erro}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 font-bold py-4 rounded-xl"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        className="flex-1 font-black py-4 rounded-xl shadow-lg shadow-blue-500/20"
                        disabled={loading || !podeSalvar}
                        isLoading={loading}
                        leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    >
                        {loading ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Criar Pendência'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
