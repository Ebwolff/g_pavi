import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { UploadCloud, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do pdfjs-dist para rodar no Vite
// A versão importada abaixo é apenas para fins de configuração do GlobalWorkerOptions
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedPeca {
    codigo: string;
    nome: string;
    quantidade: number;
}

interface UploadOrcamentoPDFProps {
    onUploadSuccess: (pecas: ExtractedPeca[]) => void;
}

export function UploadOrcamentoPDF({ onUploadSuccess }: UploadOrcamentoPDFProps) {
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

            let extractedText = '';

            // Ler o texto de todas as páginas
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                extractedText += pageText + '\n';
            }

            // O formato na imagem do cliente é em tabela com estas colunas (e os textos viram uma "tripa" via PDFjs):
            // "Número da Peça | Quantidade | Descrição | Preço | ..."
            // Exemplos visuais: "X548895001000 2 ANEL-O", "F931941100020 1 ANEL-O"

            // Regex heurística baseada no padrão comum do PDFjs após achatar a tabela
            // Padrão Geral: [Código Típicamente Alfanumérico c/ >5 caracteres] espaço/quebra [Qtd Numérica] espaço/quebra [Descrição em Maiúsculas]

            const matches: ExtractedPeca[] = [];

            // Separar o texto extraído em "palavras/blocos" usando regex e varrer linearmente para tentar formar os trios
            // Devido a complexidade de quebras de tabela em pdf, uma heurística tokenizada funciona melhor
            const tokens = extractedText.split(/\s+/).filter(t => t.trim().length > 0);

            for (let i = 0; i < tokens.length - 2; i++) {
                const current = tokens[i];
                const next1 = tokens[i + 1];

                // Heurística de Código de Peça: pelo menos 6 caracteres alfanuméricos contendo números, com possível traço
                const isCodigo = /^[A-Z0-9-]{6,25}$/i.test(current) && /\d/.test(current);

                // Heurística de Qtd: número curto (1 a 4 digitos)
                const isQtd = /^\d{1,4}$/.test(next1);

                if (isCodigo && isQtd) {
                    // Achou um "Código" seguido de "Qtd"
                    // A descrição começa em next2 e pode ir até encontrar um Preço, a palavra ATIVO, etc.
                    let descricaoParts = [];
                    let j = i + 2;
                    let finishedDesc = false;

                    while (j < tokens.length && !finishedDesc) {
                        const word = tokens[j];
                        // Parar de acumular a descrição se bater em termos como ATIVO, NÃO, DISPONÍVEL, R$, ou um novo código
                        if (
                            word === 'ATIVO' ||
                            word === 'NÃO' ||
                            word.startsWith('R$') ||
                            word === 'TOTAL' ||
                            (/^[A-Z0-9-]{6,25}$/i.test(word) && /\d/.test(word)) // Achou o próximo código
                        ) {
                            finishedDesc = true;
                        } else {
                            descricaoParts.push(word);
                            j++;
                        }
                    }

                    const nomeStr = descricaoParts.join(' ').trim();
                    if (nomeStr.length > 2) {
                        matches.push({
                            codigo: current,
                            quantidade: parseInt(next1, 10),
                            nome: nomeStr
                        });

                        // Avança o i pois processamos um bloco
                        i = j - 1;
                    }
                }
            }

            if (matches.length === 0) {
                setError("Não foi possível encontrar peças compatíveis no PDF. O formato pode ter mudado.");
            } else {
                onUploadSuccess(matches);
            }

        } catch (err: any) {
            logger.error("Erro processando PDF:", err);
            setError("Ocorreu um erro ao ler o PDF: " + (err.message || 'Erro desconhecido'));
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
                setError("Por favor, envie um arquivo PDF.");
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                processPDF(file);
            } else {
                setError("Por favor, selecione um arquivo PDF.");
            }
        }
    };

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer group ${isDragging
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] hover:border-blue-500/50'
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
                    <div className="flex flex-col items-center gap-4 animate-fadeIn">
                        <div className="p-4 rounded-full bg-blue-500/10 text-blue-500">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-500 tracking-wide uppercase">Lendo PDF Inteligente</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">Extraindo códigos e quantidades...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 transition-transform group-hover:-translate-y-1">
                        <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-500 text-white' : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] shadow-inner'} transition-colors`}>
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-[var(--text-primary)]">
                                Importador de Orçamento PDF
                            </p>
                            <p className="text-sm text-[var(--text-muted)] max-w-[280px] mt-2">
                                Arraste o PDF do orçamento aqui ou clique para selecionar o arquivo.
                            </p>
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-2">
                            <UploadCloud className="w-3 h-3" />
                            Auto-Processamento
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fadeIn">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-400 leading-snug">{error}</p>
                </div>
            )}
        </div>
    );
}
