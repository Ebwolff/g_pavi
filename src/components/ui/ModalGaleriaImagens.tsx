import { useState, useEffect } from 'react';
import { anexosService, Anexo } from '@/services/anexosService';
import { Loader2, Download, ChevronLeft, ChevronRight, X, ImageIcon, AlertTriangle } from 'lucide-react';

interface ModalGaleriaImagensProps {
    isOpen: boolean;
    onClose: () => void;
    osId: string;
    osNumero: string;
}

export function ModalGaleriaImagens({ isOpen, onClose, osId, osNumero }: ModalGaleriaImagensProps) {
    const [anexos, setAnexos] = useState<Anexo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchAnexos = async () => {
            setLoading(true);
            try {
                const data = await anexosService.getAnexosByOS(osId);
                setAnexos(data);
            } catch (err) {
                console.error('Erro ao buscar anexos:', err);
            } finally {
                setLoading(false);
            }
        };

        if (osId && isOpen) fetchAnexos();
    }, [osId, isOpen]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % anexos.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + anexos.length) % anexos.length);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 animate-fadeIn">
            <div className="glass-card-enterprise w-full max-w-5xl h-[80vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-slideUp">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-500/20">
                            <ImageIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Anexos da OS #{osNumero}</h2>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
                                {anexos.length} Arquivo(s) encontrado(s)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-[var(--text-muted)] hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-black/40">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-center flex-col gap-4">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Carregando Galeria...</p>
                        </div>
                    ) : anexos.length === 0 ? (
                        <div className="absolute inset-0 flex flex-center flex-col opacity-30">
                            <ImageIcon className="w-16 h-16 mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">Nenhum anexo encontrado</p>
                        </div>
                    ) : (
                        <>
                            {/* Main Image Display */}
                            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
                                <img
                                    src={anexos[currentIndex].url_anexo}
                                    alt={anexos[currentIndex].descricao || 'Anexo'}
                                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-fadeIn"
                                />

                                {/* Controls */}
                                {anexos.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-6 p-4 rounded-full bg-black/50 border border-white/10 text-white hover:bg-blue-600 transition-all group"
                                        >
                                            <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-6 p-4 rounded-full bg-black/50 border border-white/10 text-white hover:bg-blue-600 transition-all group"
                                        >
                                            <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Info & Footer */}
                            <div className="p-6 bg-white/[0.03] border-t border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white">
                                        {anexos[currentIndex].descricao || `Anexo ${currentIndex + 1}`}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                                        Tipo: {anexos[currentIndex].tipo_anexo}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-[var(--text-muted)]">
                                        {currentIndex + 1} / {anexos.length}
                                    </span>
                                    <a
                                        href={anexos[currentIndex].url_anexo}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        Baixar Original
                                    </a>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
