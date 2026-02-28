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
    descricao_problema?: string;
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
            // O texto contém a palavra "ORDEM DE SERVIÇO" seguida por "Nº 6855" (com espaço) ou "Nº6855"
            // Capturamos a string numérica que vem depois.
            const matchOS = normalizedText.match(/N[°ºo]?\s?(\d{3,10})/i);
            if (matchOS && matchOS[1]) {
                extraidos.numero_os = matchOS[1];
            }

            // 2. Extração do Cliente
            // Texto do NBS no PDF costuma ter "Cliente FRANCISCO CRUZ DE ASSIS Cadastro RG:" 
            // Uma Regex segura pega tudo APÓS a palavra "Cliente " (sem dois pontos) até a palavra "Cadastro" ou "RG:" ou "CPF:"
            const matchCliente = normalizedText.match(/Cliente\s+([\s\S]+?)\s+(?:Cadastro|RG:|CPF:|Bairro:|R\.|Rua:|CEP:)/i);
            if (matchCliente && matchCliente[1]) {
                // Remove quebras e limpa excesso de espaços no nome
                extraidos.nome_cliente_digitavel = matchCliente[1].replace(/\s+/g, ' ').trim();
            }

            // 3. Extração do Produto/Modelo
            // Texto no PDF da imagem: "Produto/Modelo: VALTRA / TRATOR / TRATOR AGRICOLA A800R 4X4 Blindado"
            // A palavra "Blindado" ou "KM:" marca o fim do nome do modelo
            const matchModelo = normalizedText.match(/Produto\/Modelo:\s*(.*?)(?:\s+Blindado|\s+KM:|\s+Motor:|\s+Hr:)/i);
            if (matchModelo && matchModelo[1]) {
                extraidos.modelo_maquina = matchModelo[1].trim();
            }

            // 4. Extração do Chassi (Nr. Fab)
            // Texto no PDF da imagem: "Nr.Fab 9AGT2006HRC022026 Motor: RMD482039"
            const matchChassi = normalizedText.match(/Nr\.?\s*Fab:?\s*([A-Z0-9]+)/i);
            if (matchChassi && matchChassi[1]) {
                extraidos.chassi = matchChassi[1].trim();
            }

            // 5. Tratamento Especial de OS: às vezes o PDF quebra os dois IDs:
            // "ORDEM DE SERVIÇO Nº 6855" ... vamos olhar pela palavra chave exata
            if (!extraidos.numero_os) {
                const fallbackOS = normalizedText.match(/ORDEM DE SERVIÇO\s*.*?(\d{3,10})/i);
                if (fallbackOS && fallbackOS[1]) extraidos.numero_os = fallbackOS[1];
            }

            // 6. Extração da Descrição do Problema
            // Na imagem, aparece algo como: "01 CLIENTE ALEGA ROMPIMENTO DA ESTRUTURA DA CABINE 01 Serviço ..." 
            // Cuidado: capturar até encontrar a tabela de Serviços ("It Serviço Descrição do Serviço")
            const matchDescricao = normalizedText.match(/CLIENTE ALEGA\s+(.*?)\s+(?:01\s+Serviço|Serviço\s+Descrição|It\s+Serviço|Fechamento)/i);

            if (matchDescricao && matchDescricao[1]) {
                extraidos.descricao_problema = matchDescricao[1].trim();
            } else {
                // Tenta capturar qualquer frase no meio que pareça um relato antes da tabela de Serviços
                const fallbackDesc = normalizedText.match(/(?:Bairro:[\sA-Z-]+|\d{2}\/\d{2}\/\d{4})\s*(\d{2}\s+[A-Z\s]+?)\s+(?:It\s+Serviço|Fechamento)/i);
                if (fallbackDesc && fallbackDesc[1]) {
                    extraidos.descricao_problema = fallbackDesc[1].replace(/^\d{2}\s+/, '').trim();
                }
            }
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
