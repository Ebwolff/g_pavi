import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { WindowControls } from '@/components/WindowControls';
import { Loader2, Tractor } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Credenciais inválidas. Verifique seu email e senha.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Window Controls */}
            <WindowControls />
            {/* Left Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8fafc]">
                <div className="w-full max-w-md">
                    {/* Logo and Branding */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#14532d] rounded-2xl mb-4">
                            <Tractor className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-[#14532d] mb-2">MARDISA AGRO</h1>
                        <p className="text-gray-600">Sistema de Gestão Pós-Venda</p>
                    </div>

                    {/* Login Card */}
                    <div className="premium-card">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="premium-input"
                                    placeholder="nagilla.silva"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Senha
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="premium-input"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>ACESSAR</span>
                                    </>
                                ) : (
                                    <span>ACESSAR</span>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button className="text-sm text-[#16a34a] hover:text-[#14532d] font-medium transition-colors">
                                Esqueceu sua senha? Entre em contato com o administrador.
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            © 2026 MARDISA. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Branding Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#14532d] to-[#064e3b] items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
                </div>

                <div className="relative z-10 text-white text-center max-w-lg">
                    <Tractor className="w-24 h-24 mx-auto mb-8 text-white/90" />
                    <h2 className="text-4xl font-bold mb-4">
                        Gestão Inteligente para o Agronegócio
                    </h2>
                    <p className="text-xl text-white/80 mb-8">
                        Controle completo de Ordens de Serviço, KPIs e performance em tempo real
                    </p>
                    <div className="flex flex-col space-y-3 text-left">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-[#16a34a] rounded-full"></div>
                            <span className="text-white/90">Gestão de OS (Normal e Garantia)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-[#16a34a] rounded-full"></div>
                            <span className="text-white/90">Dashboard com indicadores em tempo real</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-[#16a34a] rounded-full"></div>
                            <span className="text-white/90">Relatórios financeiros e operacionais</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
