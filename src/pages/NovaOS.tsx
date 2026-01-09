import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ordemServicoService } from '@/services/ordemServico.service';

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
            alert('OS criada com sucesso!');
            navigate('/os/lista');
        },
        onError: (error: any) => {
            alert(`Erro ao criar OS: ${error.message}`);
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

        if (!numeroOS.trim()) {
            alert('Número da OS é obrigatório');
            return;
        }

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
                                <p className="text-sm text-gray-600">Preencha os dados da nova OS</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                    {/* Identificação */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Identificação</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número da OS <span className="text-red-500">*</span>
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={numeroOS}
                                        onChange={(e) => setNumeroOS(e.target.value)}
                                        required
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="2026-0001"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateNumber}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                                    >
                                        Gerar
                                    </button>
                                </div>
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
                                    <option value="NORMAL">Normal (N) - Pós-Venda</option>
                                    <option value="GARANTIA">Garantia (W)</option>
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
                                    placeholder="Nome completo ou razão social"
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
                                    placeholder="Ex: Trator X500"
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
                                    placeholder="Número do chassi"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descrição do Problema */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Serviço</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descrição do Problema
                            </label>
                            <textarea
                                value={descricaoProblema}
                                onChange={(e) => setDescricaoProblema(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Descreva o problema relatado..."
                            />
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
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createOSMutation.isPending}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createOSMutation.isPending ? 'Salvando...' : 'Criar OS'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
