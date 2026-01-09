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
            console.log(`Resultado ${name}:`, result);
            addLog(`✅ Sucesso (${(end - start).toFixed(0)}ms): ${(JSON.stringify(result) || '').slice(0, 100)}...`);
        } catch (error: any) {
            console.error(`Erro ${name}:`, error);
            addLog(`❌ Erro: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-6">🛠️ Debug Service Lab v2 (Stress Test)</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded shadow">
                            <h2 className="font-bold mb-4">1. Isolamento de Tabelas</h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => runTest('Pendencias (Limit 50)', async () => { return await supabase.from('pendencias_os').select('*').limit(50); })}
                                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                                >
                                    Pendências (50)
                                </button>
                                <button
                                    onClick={() => runTest('Alertas (Limit 50)', async () => { return await supabase.from('alertas').select('*').limit(50); })}
                                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                                >
                                    Alertas (50)
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded shadow">
                            <h2 className="font-bold mb-4">2. Teste Progressivo (VIEW)</h2>
                            <p className="text-sm text-gray-500 mb-2">Descobrir onde o AbortError acontece.</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => runTest('VIEW (Limit 5)', async () => { return await supabase.from('vw_os_estatisticas').select('*').limit(5); })}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                >
                                    Limit 5
                                </button>
                                <button
                                    onClick={() => runTest('VIEW (Limit 20)', async () => { return await supabase.from('vw_os_estatisticas').select('*').limit(20); })}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                >
                                    Limit 20
                                </button>
                                <button
                                    onClick={() => runTest('VIEW (Limit 50)', async () => { return await supabase.from('vw_os_estatisticas').select('*').limit(50); })}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                >
                                    Limit 50
                                </button>
                                <button
                                    onClick={() => runTest('VIEW (Limit 100)', async () => { return await supabase.from('vw_os_estatisticas').select('*').limit(100); })}
                                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                                >
                                    Limit 100
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded shadow">
                            <h2 className="font-bold mb-4">3. Teste Serviço Completo</h2>
                            <button
                                onClick={() => runTest('getDashboardStats()', () => statsService.getDashboardStats())}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                            >
                                getDashboardStats (Limit 50 interno)
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-900 text-green-400 p-4 rounded shadow font-mono text-sm h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                            <span>Console Logs</span>
                            <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-white">Limpar</button>
                        </div>
                        {logs.length === 0 && <span className="text-gray-600">Aguardando testes...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1">{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
