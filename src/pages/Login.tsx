import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { WindowControls } from '@/components/WindowControls';
import { Loader2, Tractor, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

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
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-full max-w-md animate-fadeIn">
                    {/* Logo and Branding */}
                    <div className="text-center mb-10">
                        <div className="relative inline-block">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#14532d] to-[#064e3b] rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
                                <Tractor className="w-12 h-12 text-white" />
                            </div>
                            {/* Sparkle effect */}
                            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse-soft" />
                        </div>
                        <h1 className="text-3xl font-bold text-[#14532d] mb-2">MARDISA AGRO</h1>
                        <p className="text-gray-500 text-sm">Sistema ERP de Gestão Pós-Venda</p>
                    </div>

                    {/* Login Card - Glassmorphism */}
                    <div className="glass-card rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Acessar</h2>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">v2.0</span>
                        </div>

                        {/* Error Message with Animation */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-slideDown">
                                <p className="text-sm text-red-700 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    {error}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field with Icon */}
                            <div className="relative">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-[#16a34a]' : 'text-gray-400'
                                    }`}>
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl focus:outline-none transition-all duration-200 ${focusedField === 'email'
                                            ? 'border-[#16a34a] shadow-[0_0_0_4px_rgba(22,163,74,0.1)]'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    placeholder="seu.email@empresa.com"
                                    disabled={isLoading}
                                />
                                <label
                                    htmlFor="email"
                                    className={`absolute left-12 transition-all duration-200 pointer-events-none ${email || focusedField === 'email'
                                            ? '-top-2.5 text-xs bg-white px-2 text-[#16a34a] font-medium'
                                            : 'top-1/2 -translate-y-1/2 text-gray-400 opacity-0'
                                        }`}
                                >
                                    Email
                                </label>
                            </div>

                            {/* Password Field with Icon */}
                            <div className="relative">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' ? 'text-[#16a34a]' : 'text-gray-400'
                                    }`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl focus:outline-none transition-all duration-200 ${focusedField === 'password'
                                            ? 'border-[#16a34a] shadow-[0_0_0_4px_rgba(22,163,74,0.1)]'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                                <label
                                    htmlFor="password"
                                    className={`absolute left-12 transition-all duration-200 pointer-events-none ${password || focusedField === 'password'
                                            ? '-top-2.5 text-xs bg-white px-2 text-[#16a34a] font-medium'
                                            : 'top-1/2 -translate-y-1/2 text-gray-400 opacity-0'
                                        }`}
                                >
                                    Senha
                                </label>
                            </div>

                            {/* Submit Button with Enhanced Styling */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#14532d] to-[#064e3b] hover:from-[#166534] hover:to-[#14532d] text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>AUTENTICANDO...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>ACESSAR SISTEMA</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Help Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                Problemas para acessar?{' '}
                                <button className="text-[#16a34a] hover:text-[#14532d] font-medium transition-colors hover:underline">
                                    Contate o suporte
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">
                            © 2026 MARDISA Agro · v2.0.0 · Todos os direitos reservados
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Premium Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#14532d] via-[#166534] to-[#064e3b] items-center justify-center p-12 relative overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
                </div>

                {/* Floating Orbs for Visual Interest */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-soft"></div>
                <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#16a34a]/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

                {/* Content */}
                <div className="relative z-10 text-white text-center max-w-lg animate-fadeIn">
                    <div className="inline-flex items-center justify-center w-28 h-28 bg-white/10 rounded-3xl mb-8 backdrop-blur-sm border border-white/20">
                        <Tractor className="w-16 h-16 text-white" />
                    </div>

                    <h2 className="text-4xl font-bold mb-4 leading-tight">
                        Gestão Inteligente<br />
                        <span className="text-[#16a34a]">para o Agronegócio</span>
                    </h2>

                    <p className="text-lg text-white/70 mb-10">
                        Controle completo de Ordens de Serviço, KPIs e performance em tempo real
                    </p>

                    {/* Features List */}
                    <div className="space-y-4 text-left bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-bold">✓</span>
                            </div>
                            <span className="text-white/90">Gestão de OS Normal e Garantia</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-bold">✓</span>
                            </div>
                            <span className="text-white/90">Dashboard com indicadores em tempo real</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-bold">✓</span>
                            </div>
                            <span className="text-white/90">Relatórios financeiros e operacionais</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

