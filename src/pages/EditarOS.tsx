import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ordemServicoService } from '@/services/ordemServico.service';

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
            alert('OS atualizada com sucesso!');
            navigate('/os/lista');
        },
        onError: (error: any) => {
            alert(`Erro ao atualizar OS: ${error.message}`);
        },
    });

    const deleteOSMutation = useMutation({
        mutationFn: () => ordemServicoService.delete(id!),
        onSuccess: () => {
            alert('OS deletada com sucesso!');
            navigate('/os/lista');
        },
        onError: (error: any) => {
            alert(`Erro ao deletar OS: ${error.message}`);
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/os/lista')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Editar OS #{numeroOS}</h1>
                                <p className="text-sm text-gray-600">Atualize os dados da ordem de serviço</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                            Deletar OS
                        </button>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                    {/* Identificação */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Identificação</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número da OS
                                </label>
                                <input
                                    type="text"
                                    value={numeroOS}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de OS
                                </label>
                                <select
                                    value={tipoOS}
                                    onChange={(e) => setTipoOS(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                    <option value="NORMAL">Normal (N)</option>
                                    <option value="GARANTIA">Garantia (W)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={statusOS}
                                    onChange={(e) => setStatusOS(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                    <option value="EM_EXECUCAO">Em Execução</option>
                                    <option value="AGUARDANDO_PECAS">Aguardando Peças</option>
                                    <option value="PAUSADA">Pausada</option>
                                    <option value="CONCLUIDA">Concluída</option>
                                    <option value="FATURADA">Faturada</option>
                                    <option value="CANCELADA">Cancelada</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Cliente e Máquina */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente e Máquina</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Cliente
                                </label>
                                <input
                                    type="text"
                                    value={nomeCliente}
                                    onChange={(e) => setNomeCliente(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Modelo da Máquina
                                </label>
                                <input
                                    type="text"
                                    value={modeloMaquina}
                                    onChange={(e) => setModeloMaquina(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chassi
                                </label>
                                <input
                                    type="text"
                                    value={chassi}
                                    onChange={(e) => setChassi(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Serviço */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Serviço</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição do Problema
                                </label>
                                <textarea
                                    value={descricaoProblema}
                                    onChange={(e) => setDescricaoProblema(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Solução Aplicada
                                </label>
                                <textarea
                                    value={solucaoAplicada}
                                    onChange={(e) => setSolucaoAplicada(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    placeholder="Descreva a solução aplicada..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Valores */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Valores</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mão de Obra (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valorMaoDeObra}
                                    onChange={(e) => setValorMaoDeObra(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Peças (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valorPecas}
                                    onChange={(e) => setValorPecas(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deslocamento (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valorDeslocamento}
                                    onChange={(e) => setValorDeslocamento(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-indigo-900">Valor Total:</span>
                                <span className="text-2xl font-bold text-indigo-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => navigate('/os/lista')}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={updateOSMutation.isPending}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {updateOSMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
