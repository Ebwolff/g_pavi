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
    data_abertura?: string;
    tipo_os?: 'NORMAL' | 'GARANTIA';
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

            // DEBUG: logar o texto cru extraído para calibrar regex
            console.log('[NBS Extractor] Texto extraído:', normalizedText.substring(0, 500));

            // 1. Número da OS
            // PROBLEMA: O PDFjs lê colunas fora de ordem, então datas (2026), CEPs (65962000),
            // e outros números podem aparecer ANTES do Nº real da OS.
            // SOLUÇÃO: Varrer todos os candidatos e filtrar por eliminação.

            // Estratégia: buscar todos os números de 3-6 dígitos que NÃO sejam:
            //   - Anos (2020-2030)
            //   - Parte de datas (dd/mm/aaaa ou dd/mm/aa)
            //   - Parte de horários (hh:mm)
            //   - CEPs (8 dígitos)
            //   - Parte de CPF/CNPJ

            // Primeiro, tentar a forma mais direta: "Nº 6855" com qualquer variante Unicode
            const matchNrDireto = normalizedText.match(/N[°ºo⁰˚]\.?\s*(\d{3,6})(?!\d)/);

            if (matchNrDireto && matchNrDireto[1] && !matchNrDireto[1].match(/^20[2-3]\d$/)) {
                extraidos.numero_os = matchNrDireto[1];
            } else {
                // Fallback: pegar todos os números curtos do texto e filtrar
                const todosNumeros = [...normalizedText.matchAll(/(?<!\d[\/.-])(\d{3,6})(?![\/.-]\d)(?!\d)/g)];

                for (const match of todosNumeros) {
                    const num = match[1];
                    // Rejeitar anos (2020-2030)
                    if (/^20[2-3]\d$/.test(num)) continue;
                    // Rejeitar se está dentro de uma data (olhar contexto)
                    const idx = match.index!;
                    const contexto = normalizedText.substring(Math.max(0, idx - 5), idx + num.length + 5);
                    if (/\d{2}\/\d{2}\//.test(contexto) || /\/\d{4}/.test(contexto)) continue;
                    // Rejeitar se está dentro de horário
                    if (/\d{2}:\d{2}/.test(contexto)) continue;

                    // O primeiro número "limpo" é provavelmente o Nº da OS
                    extraidos.numero_os = num;
                    break;
                }
            }

            console.log('[NBS Extractor] Nº OS capturado:', extraidos.numero_os);

            // 2. Tipo (Normal ou Garantia)
            const matchTipo = normalizedText.match(/Tipo:\s*(.*?)(?:Box|Prisma|Entrada)/i);
            if (matchTipo && matchTipo[1]) {
                const tipoStr = matchTipo[1].toUpperCase();
                if (tipoStr.includes('GARANTIA')) {
                    extraidos.tipo_os = 'GARANTIA';
                } else {
                    extraidos.tipo_os = 'NORMAL';
                }
            }

            // 3. Data de Abertura (Entrada)
            // Formato visual: "Entrada: 13/02/2026 as 11:48"
            const matchEntrada = normalizedText.match(/Entrada:\s*(\d{2})\/(\d{2})\/(\d{4})\s*as\s*(\d{2}):(\d{2})/i);
            if (matchEntrada) {
                const [_, d, m, y, h, min] = matchEntrada;
                extraidos.data_abertura = `${y}-${m}-${d}T${h}:${min}`;
            } else {
                const matchEntrada2 = normalizedText.match(/Entrada:\s*(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2})/i);
                if (matchEntrada2) {
                    const [_, d, m, y, h, min] = matchEntrada2;
                    extraidos.data_abertura = `${y}-${m}-${d}T${h}:${min}`;
                }
            }

            // 4. Cliente
            // Devido a problemas de colunas, capturamos após Cliente até um Checkbox ou Dado conhecido.
            const matchCliente = normalizedText.match(/Cliente\s+([\s\S]+?)\s+(?:Cadastro|RG:|CPF:|Bairro:|R\.|Rua:|CEP:|Fone:|Celular:|\u2611|✓)/i);
            if (matchCliente && matchCliente[1]) {
                // Remove quebras e limpa excesso de espaços no nome
                extraidos.nome_cliente_digitavel = matchCliente[1].replace(/\s+/g, ' ').trim();
            }

            // 5. Chassi (Nr. Fab)
            // Como o layout é colunar "Nr.Fab Cor Motor Motorista 9AGT... AMARELO", pegamos pelo padrão puramente alfanumérico!
            // String de 13 a 20 caracteres que possua letras e números.
            const canditadosChassi = normalizedText.match(/[A-Z0-9]{13,25}/g);
            if (canditadosChassi) {
                // O chassi geralmente é a primeira string longa alfanumérica que não seja tudo número
                const chassiValido = canditadosChassi.find(c => /[A-Z]/.test(c) && /[0-9]/.test(c));
                if (chassiValido) {
                    extraidos.chassi = chassiValido;
                }
            }

            // 6. Produto / Modelo
            const matchModelo = normalizedText.match(/Produto\/Modelo:\s*(.*?)(?:\s+Blindado|\s+KM:|\s+Motor:|\s+Hr:|\s+Ano\/Modelo:)/i);
            if (matchModelo && matchModelo[1]) {
                extraidos.modelo_maquina = matchModelo[1].trim();
            }

            // 7. Descrição do Problema
            // "CLIENTE ALEGA ..."
            const matchDescricao = normalizedText.match(/(?:(?:[0-9]{2}\s+)|^)CLIENTE ALEGA\s+([\s\S]*?)\s+(?:It\s+Serviço|0\d\s+Serviço|Descrição do Serviço|Fechamento)/i);
            if (matchDescricao && matchDescricao[1]) {
                extraidos.descricao_problema = `CLIENTE ALEGA ${matchDescricao[1].trim()}`;
            } else {
                // Caso falhe com CLIENTE ALEGA, tenta varrer algo antes de "It Serviço" e após Concessionária
                const fallbackDesc = normalizedText.match(/Concessionária Vendedora[\s\S]*?(?:Bairro:|CEP:[\sA-Z-]+)?\s+([A-Z0-9\s.,;-]{10,200}?)\s+(?:It\s+Serviço|0\d\s+Serviço|Descrição do Serviço)/i);
                if (fallbackDesc && fallbackDesc[1]) {
                    extraidos.descricao_problema = fallbackDesc[1].trim();
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
