import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { statsService } from '../services/statsService';

export function DebugService() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runTest = async (name: string, fn: () => Promise<any>) => {
        setLoading(true);
        addLog(`🔄 Iniciando teste: ${name}...`);
        try {
            const start = performance.now();
            const result = await fn();
            const end = performance.now();

            // Check for Supabase error object that isn't thrown
            if (result && result.error) {
                console.error(`Erro retornado por ${name}:`, result.error);
                addLog(`❌ Erro Retornado (${(end - start).toFixed(0)}ms): ${result.error.message || JSON.stringify(result.error)}`);
            } else {
                console.log(`Resultado ${name}:`, result);
                const dataPreview = result.data ? `Linhas: ${result.data.length}` : JSON.stringify(result)?.slice(0, 50);
                addLog(`✅ Sucesso (${(end - start).toFixed(0)}ms): ${dataPreview}`);
            }
        } catch (error: any) {
            console.error(`Erro ${name}:`, error);
            addLog(`❌ Erro Exception: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-6">🛠️ Debug Service Lab v3 (Isolation)</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded shadow border-l-4 border-green-500">
                            <h2 className="font-bold mb-4">1. Grupo de Controle (Deve Funcionar)</h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => runTest('Tabela Clientes (Simples)', async () => supabase.from('clientes').select('id, nome_cliente').limit(5))}
                                    className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                                >
                                    Clientes (5)
                                </button>
                                <button
                                    onClick={() => runTest('Tabela OS (Simples)', async () => supabase.from('ordens_servico').select('id, numero_os').limit(5))}
                                    className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                                >
                                    Ordens Serviço (5)
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded shadow border-l-4 border-yellow-500">
                            <h2 className="font-bold mb-4">2. Teste da View (Isolando Colunas)</h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => runTest('View (Apenas ID)', async () => supabase.from('vw_os_estatisticas').select('id').limit(5))}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                >
                                    Apenas ID
                                </button>
                                <button
                                    onClick={() => runTest('View (ID + Numero)', async () => supabase.from('vw_os_estatisticas').select('id, numero_os').limit(5))}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                >
                                    ID + Numero
                                </button>
                                <button
                                    onClick={() => runTest('View (Completa)', async () => supabase.from('vw_os_estatisticas').select('*').limit(5))}
                                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                                >
                                    Completa (*)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 text-green-400 p-4 rounded shadow font-mono text-sm h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                            <span>Console Logs</span>
                            <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-white">Limpar</button>
                        </div>
                        {logs.length === 0 && <span className="text-gray-600">Aguardando testes...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes('❌') ? 'text-red-400' : ''}`}>{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
