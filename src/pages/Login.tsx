import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRoute } from '@/utils/permissions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader2, Tractor, Mail, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);

    const navigate = useNavigate();
    const { login } = useAuth();

    // Hero Animation Logic
    useEffect(() => {
        const totalFrames = 80;
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % totalFrames);
        }, 80); // ~12fps para um visual cinematográfico suave
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);
            const userRole = result.profile?.role;
            const targetRoute = userRole ? getDefaultRoute(userRole) : '/tecnico';

            setTimeout(() => {
                navigate(targetRoute);
            }, 50);

        } catch (err: any) {
            console.error('❌ [Login] Erro:', err);
            let msg = err.message || 'Erro ao realizar login.';
            if (msg.includes('Invalid login credentials')) {
                msg = 'E-mail ou senha incorretos.';
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const frameUrl = `/hero/Cinematic_slowmotion_transformation_the_green_and__512fd9fce1_${String(currentFrame).padStart(3, '0')}.jpg`;

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side - Clean White Login */}
            <div className="w-full lg:w-5/12 flex items-center justify-center p-8 lg:p-16 bg-white z-10">
                <div className="w-full max-w-sm animate-fadeIn">
                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-visao-green rounded-xl flex items-center justify-center shadow-lg shadow-green-900/10">
                                <Tractor className="w-6 h-6 text-green-400" />
                            </div>
                            <h1 className="text-xl font-antigravity text-visao-green tracking-tighter">Visão 360</h1>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Bem-vindo.</h2>
                        <p className="text-slate-500 font-medium">Acesse a plataforma de gestão agrícola</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-shake">
                            <p className="text-sm text-rose-600 font-bold text-center">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            id="email"
                            type="email"
                            label="Email Corporativo"
                            placeholder="ex: joao@mardisa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={Mail}
                            required
                            disabled={isLoading}
                            className="bg-slate-50 border-slate-100"
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
                            className="bg-slate-50 border-slate-100"
                        />

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 text-base font-bold bg-visao-green hover:bg-green-900 text-white rounded-2xl transition-all shadow-xl shadow-green-900/20 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Autenticando...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Entrar no Sistema
                                        <ArrowRight className="w-5 h-5" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-100">
                        <button className="text-sm text-visao-light hover:text-visao-green font-bold transition-colors">
                            Esqueceu sua senha?
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side - Dark Green Hero Branding */}
            <div className="hidden lg:flex lg:w-7/12 relative bg-visao-green overflow-hidden">
                {/* Antigravity Animation Container */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={frameUrl}
                        className="w-full h-full object-cover transition-opacity duration-300 opacity-80 scale-105"
                        alt="Hero Animation"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-visao-green via-visao-green/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-visao-green to-transparent w-32" />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col justify-between p-24 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-0.5 bg-green-500 rounded-full" />
                        <span className="font-antigravity text-xs text-green-400 tracking-[0.4em]">Performance Layer</span>
                    </div>

                    <div className="max-w-xl">
                        <h2 className="text-6xl font-black mb-8 leading-[1.1] tracking-tighter">
                            Potencialize sua <br />
                            <span className="text-green-500 italic">gestão agrícola</span>
                        </h2>

                        <div className="flex gap-12 mt-12 mb-16">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 text-white">
                                    <div className="p-2 bg-green-500/20 rounded-lg"><ShieldCheck className="w-5 h-5 text-green-400" /></div>
                                    <span className="font-antigravity text-sm tracking-widest">Compliance</span>
                                </div>
                                <p className="text-white/40 text-xs font-medium pl-11">Auditoria total</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 text-white">
                                    <div className="p-2 bg-green-500/20 rounded-lg"><Zap className="w-5 h-5 text-green-400" /></div>
                                    <span className="font-antigravity text-sm tracking-widest">Performance</span>
                                </div>
                                <p className="text-white/40 text-xs font-medium pl-11">KPIs em tempo real</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-10">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
                            © 2026 Visão 360 · Antigravity Core
                        </p>
                        <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
