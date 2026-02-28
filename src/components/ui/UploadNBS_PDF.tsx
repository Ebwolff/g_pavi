import React, { useState } from 'react';
import { UploadCloud, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do pdfjs-dist para rodar no Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedNBS {
    numero_os?: string;
    nome_cliente_digitavel?: string;
    modelo_maquina?: string;
    chassi?: string;
}

interface UploadNBS_PDFProps {
    onUploadSuccess: (dados: ExtractedNBS) => void;
}

export function UploadNBS_PDF({ onUploadSuccess }: UploadNBS_PDFProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processPDF = async (file: File) => {
        setIsProcessing(true);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let extractedTextStr = '';

            // Ler o texto de todas as páginas
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Em vez de só concatenar, vamos manter blocos próximos
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                extractedTextStr += pageText + ' ';
            }

            // Normaliza espaços extras
            const normalizedText = extractedTextStr.replace(/\s+/g, ' ').trim();

            const extraidos: ExtractedNBS = {};

            // 1. Extração do Nº da OS
            // O texto geralmente contém "ORDEM DE SERVIÇO Nº 12345" ou "ORDEM DE SERVIÇO N° 12345"
            // Buscamos a palavra ORDEM DE SERVIÇO e pegamos a proxima string numéica
            const matchOS = normalizedText.match(/ORDEM DE SERVIÇO\s*.*?N[°ºo]?\s*(\d{2,10})/i);
            if (matchOS && matchOS[1]) {
                extraidos.numero_os = matchOS[1];
            }

            // 2. Extração do Cliente
            // Texto do NBS costuma ter: "Cliente: FULANO DE TAL ... RG:" ou "Cliente FULANO DE TAL ... R. " 
            // Uma Regex segura pega o que vem APÓS a palavra "Cliente" até um marcador forte como "Endereço", "Bairro", "RG", "CPF"
            const matchCliente = normalizedText.match(/Cliente:?\s*([A-Z\s]+?)\s*(?:RG:|CPF:|Bairro:|R\.|Rua:|CEP:|Cadastro)/i);
            if (matchCliente && matchCliente[1]) {
                extraidos.nome_cliente_digitavel = matchCliente[1].trim();
            }

            // 3. Extração do Produto/Modelo
            // Texto: "Veículo Produto/Modelo: VALTRA / TRATOR / ... " ou "Produto/Modelo: VALTRA..."
            const matchModelo = normalizedText.match(/Produto\/Modelo:\s*(.*?)(?:\s+Motor:|\s+Blindado|\s+KM:)/i);
            if (matchModelo && matchModelo[1]) {
                extraidos.modelo_maquina = matchModelo[1].trim();
            }

            // 4. Extração do Chassi (Nr. Fab)
            // Texto: "Nr. Fab: 9AGT20... " 
            const matchChassi = normalizedText.match(/Nr\.?\s*Fab:?\s*([A-Z0-9]+)/i);
            if (matchChassi && matchChassi[1]) {
                extraidos.chassi = matchChassi[1].trim();
            }

            // Se achou ao menos um dado, considera sucesso
            if (Object.keys(extraidos).length === 0) {
                setError("Não foi possível extrair dados estruturados deste PDF (formato NBS não detectado).");
            } else {
                onUploadSuccess(extraidos);
            }

        } catch (err: any) {
            console.error("Erro processando PDF do NBS:", err);
            setError("Falha ao ler o PDF: " + (err.message || 'Verifique se o arquivo não está corrompido.'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                processPDF(file);
            } else {
                setError("O arquivo precisa ser um PDF do sistema NBS.");
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                processPDF(file);
            } else {
                setError("O arquivo precisa ser um PDF do sistema NBS.");
            }
        }
    };

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer group ${isDragging
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                    }`}
            >
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isProcessing}
                />

                {isProcessing ? (
                    <div className="flex flex-col items-center gap-3 animate-fadeIn">
                        <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-500">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-500 tracking-wide uppercase">Lendo Ordem NBS</p>
                            <p className="text-[10px] text-emerald-500/70 mt-1">Minerando Cliente, Modelo, Chassi...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 transition-transform group-hover:-translate-y-1">
                        <div className={`p-4 rounded-full ${isDragging ? 'bg-emerald-500 text-white' : 'bg-[#0b0f14] text-emerald-500 border border-emerald-500/30 shadow-inner'} transition-colors`}>
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                                Auto-Preenchimento via PDF (NBS)
                            </p>
                            <p className="text-xs text-[var(--text-muted)] max-w-[280px] mt-1">
                                Anexe a via da "Ordem de Serviço" gerada pelo NBS aqui.
                            </p>
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-2">
                            <UploadCloud className="w-3 h-3" />
                            Drag & Drop
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-red-400 leading-snug">{error}</p>
                </div>
            )}
        </div>
    );
}
