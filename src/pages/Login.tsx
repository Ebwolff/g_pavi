import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRoute } from '@/utils/permissions';
import { WindowControls } from '@/components/WindowControls';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader2, Tractor, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);

            const userRole = result.profile?.role;
            const targetRoute = userRole ? getDefaultRoute(userRole) : '/tecnico';

            // Pequeno delay para garantir sincronia do authState
            setTimeout(() => {
                navigate(targetRoute);
            }, 50);

        } catch (err: any) {
            console.error('❌ [Login] Erro:', err);
            let msg = err.message || 'Erro ao realizar login.';

            if (msg.includes('Invalid login credentials')) {
                msg = 'E-mail ou senha incorretos.';
            } else if (msg.includes('Email not confirmed')) {
                msg = 'E-mail não confirmado. Verifique sua caixa de entrada.';
            }

            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Window Controls */}
            <WindowControls />

            {/* Left Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-sm animate-fadeIn">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-2xl mb-6 text-[#14532d]">
                            <Tractor className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#14532d] mb-2 tracking-tight">Visão 360</h1>
                        <p className="text-gray-500 text-sm">Acesse sua conta para continuar</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl animate-fadeIn">
                            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            id="email"
                            type="email"
                            label="Email Corporativo"
                            placeholder="seu.email@visao360.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={Mail}
                            required
                            disabled={isLoading}
                        />

                        <Input
                            id="password"
                            type="password"
                            label="Senha"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={Lock}
                            required
                            disabled={isLoading}
                        />
                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 text-base shadow-lg shadow-green-900/10 hover:shadow-green-900/20"
                                style={{
                                    background: '#14532d', // Brand specific override for Login only
                                    color: 'white'
                                }}
                            >
                                <div className="flex items-center justify-center notranslate">
                                    {isLoading ? (
                                        <span key="loading" className="flex items-center">
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Autenticando...
                                        </span>
                                    ) : (
                                        <span key="idle" className="flex items-center">
                                            Acessar Sistema
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </span>
                                    )}
                                </div>
                            </Button>
                        </div>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-8 text-center space-y-4">
                        <button className="text-sm text-[#16a34a] hover:text-[#14532d] font-medium transition-colors">
                            Esqueceu sua senha?
                        </button>

                        <div className="pt-8 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                © 2026 Visão 360 · Todos os direitos reservados
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Branding (Cleaned Up) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A2F1C]">
                {/* Background Image/Pattern - Subtle */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-500 via-[#0A2F1C] to-[#0A2F1C]" />

                <div className="relative z-10 w-full h-full flex flex-col justify-between p-20 text-white">
                    <div className="flex items-center gap-3 opacity-80">
                        <div className="w-8 h-1 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium tracking-widest uppercase">Visão 360 Agro</span>
                    </div>

                    <div className="max-w-lg">
                        <h2 className="text-5xl font-bold mb-6 leading-tight">
                            Potencialize sua <br />
                            <span className="text-green-400">gestão agrícola</span>
                        </h2>
                        <p className="text-lg text-gray-300 leading-relaxed max-w-md">
                            Controle total sobre ordens de serviço, indicadores de performance e gestão financeira em uma única plataforma.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-semibold">Compliance</span>
                            </div>
                            <p className="text-sm text-gray-400">Processos auditáveis e seguros</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-semibold">Performance</span>
                            </div>
                            <p className="text-sm text-gray-400">KPIs atualizados em tempo real</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
