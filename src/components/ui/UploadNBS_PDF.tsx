import React, { useState } from 'react';
import { UploadCloud, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Worker via CDN com fallback para thread principal
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ExtractedNBS {
    numero_os?: string;
    nome_cliente_digitavel?: string;
    modelo_maquina?: string;
    chassi?: string;
    descricao_problema?: string;
    data_abertura?: string;
    tipo_os?: 'NORMAL' | 'GARANTIA';
    valor_mao_de_obra?: string;
    valor_pecas?: string;
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
            let pdf;
            
            try {
                // Tentar com worker CDN
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    useWorkerFetch: false,
                    isEvalSupported: false,
                    useSystemFonts: true,
                });
                pdf = await loadingTask.promise;
            } catch (workerError) {
                // Fallback: desabilitar worker e tentar novamente
                console.warn('[NBS] Worker falhou, tentando sem worker:', workerError);
                pdfjsLib.GlobalWorkerOptions.workerSrc = '';
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    useWorkerFetch: false,
                    isEvalSupported: false,
                    useSystemFonts: true,
                });
                pdf = await loadingTask.promise;
            }

            let extractedTextStr = '';

            // Ler o texto de todas as páginas
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Em vez de só concatenar, vamos manter blocos próximos
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                extractedTextStr += pageText + ' ';
            }

            // Normaliza espaços extras E normaliza Unicode (NFC) para resolver encoding de ç, ã, etc.
            const normalizedText = extractedTextStr.replace(/\s+/g, ' ').trim().normalize('NFC');

            const extraidos: ExtractedNBS = {};



            // ============================================================
            // REGEX CALIBRADA COM BASE NO TEXTO REAL DO PDFjs (debug alert)
            // Texto real começa: "6837 Empresa: MARDISA AGRO..."
            // ============================================================

            // 1. Número da OS
            // O PDFjs coloca o número da OS como PRIMEIRO TOKEN do texto!
            // Ex: "6837 Empresa: MARDISA AGRO..."
            const matchOsInicio = normalizedText.match(/^(\d{3,6})\s/);
            if (matchOsInicio && matchOsInicio[1]) {
                extraidos.numero_os = matchOsInicio[1];
            }

            // 2. Tipo (Normal ou Garantia)
            // Texto real: "IV - Interna Dpto Vendas Tipo: as" ou "W3 - Garantia Trator Tipo:"
            // O texto descritivo vem ANTES de "Tipo:" — procurar "Garantia" antes de "Tipo:"
            const matchTipoArea = normalizedText.match(/(?:Box\/Prisma:?\s*)?(.*?)\s*Tipo:/i);
            if (matchTipoArea && matchTipoArea[1]) {
                extraidos.tipo_os = matchTipoArea[1].toUpperCase().includes('GARANTIA') ? 'GARANTIA' : 'NORMAL';
            }

            // 3. Data de Abertura
            // Texto real: "07/02/2026 Entrada: 09:50" — data ANTES de "Entrada:", hora DEPOIS
            const matchData = normalizedText.match(/(\d{2})\/(\d{2})\/(\d{4})\s*Entrada:?\s*(\d{2}):(\d{2})/i);
            if (matchData) {
                const [_, d, m, y, h, min] = matchData;
                extraidos.data_abertura = `${y}-${m}-${d}T${h}:${min}`;
            }

            // 4. Cliente
            // Texto real: "Cliente Cadastro PAULO RAMOS PEREIRA NETO"
            // O nome vem APÓS "Cadastro" (não entre "Cliente" e "Cadastro")
            const matchCliente = normalizedText.match(/Cadastro\s+([A-Z][A-Z\s]+?)(?:\s+RG:|\s+CPF:|\s+Fone:|\s+Bairro:|\s+R\.|\s+Rua:|\s+CEP:|\s+Celular:|\s+Email:)/i);
            if (matchCliente && matchCliente[1]) {
                extraidos.nome_cliente_digitavel = matchCliente[1].replace(/\s+/g, ' ').trim();
            }

            // 5. Chassi (Nr. Fab)
            // Padrão alfanumérico de 13-25 chars com letras E números
            const candidatosChassi = normalizedText.match(/[A-Z0-9]{13,25}/g);
            if (candidatosChassi) {
                const chassiValido = candidatosChassi.find(c => /[A-Z]/.test(c) && /[0-9]/.test(c));
                if (chassiValido) {
                    extraidos.chassi = chassiValido;
                }
            }

            // 6. Produto / Modelo
            const matchModelo = normalizedText.match(/Produto\/Modelo:?\s*(.*?)(?:\s+Blindado|\s+KM:|\s+Motor:|\s+Hr:|\s+Ano\/Modelo:)/i);
            if (matchModelo && matchModelo[1]) {
                extraidos.modelo_maquina = matchModelo[1].trim();
            }

            // 7. Descrição do Problema
            // Formato 1: "01 CLIENTE ALEGA ROMPIMENTO DA ESTRUTURA..."
            // Formato 2: "01 VERIFICAR FALHA NO SISTEMA DE TRATAMENTO..."
            // Buscar texto entre "01 " e um delimiter de tabela
            const matchDesc1 = normalizedText.match(/\b01\s+(CLIENTE ALEGA\s+[\s\S]*?)(?:\s+It\s+Servi|\s+0\d\s+\d{5,}|\s+Descri|\s+Fechamento|\s+C.digo)/i);
            const matchDesc2 = normalizedText.match(/\b01\s+([A-Z][A-Z\s]{5,200}?)(?:\s+It\s+Servi|\s+0\d\s+\d{5,}|\s+Descri|\s+Fechamento|\s+C.digo)/i);

            if (matchDesc1 && matchDesc1[1]) {
                extraidos.descricao_problema = matchDesc1[1].trim();
            } else if (matchDesc2 && matchDesc2[1]) {
                extraidos.descricao_problema = matchDesc2[1].trim();
            }

            // 8. Composição Estimada (Fechamento)
            // DESCOBERTA via debug: O PDFjs separa LABELS e VALORES em blocos distintos!
            // Texto real: "...Serviços: Fechamento Serviços+Itens: Descontos: Total: 31.657,78 0,00 31.307,78 0,00 31.307,78 350,00 0,00 350,00..."
            // ESTRATÉGIA: Pegar TODOS os valores monetários após "Fechamento" e usar matemática.

            const parseBR = (str: string): number => {
                return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
            };

            const idxFechamento = normalizedText.indexOf('echamento');
            if (idxFechamento > 0) {
                // Pegar o texto após Fechamento e extrair todos os valores monetários
                const textoAposFechamento = normalizedText.substring(idxFechamento);
                const todosValores = textoAposFechamento.match(/\d[\d.]*,\d{2}/g);

                if (todosValores && todosValores.length > 0) {
                    // Converter para números e pegar valores únicos não-zero
                    const parsed = todosValores.map(v => parseBR(v));
                    const unicos = [...new Set(parsed)].filter(v => v > 0).sort((a, b) => a - b);

                    console.log('[NBS] Valores após Fechamento:', parsed);
                    console.log('[NBS] Valores únicos não-zero:', unicos);

                    if (unicos.length >= 2) {
                        // Se há 3 valores: menor=mão de obra, médio=peças, maior=total
                        // Se há 2 valores: o menor pode ser mão de obra ou peças
                        // Verificar se A + B = C (total)
                        const maior = unicos[unicos.length - 1];
                        const menores = unicos.slice(0, -1);
                        const soma = menores.reduce((a, b) => a + b, 0);

                        if (Math.abs(soma - maior) < 0.01) {
                            // A + B = Total! O menor é mão de obra, o segundo é peças
                            extraidos.valor_mao_de_obra = menores[0].toString();
                            if (menores.length > 1) {
                                extraidos.valor_pecas = menores[1].toString();
                            }
                        } else {
                            // Não é soma, pegar os dois menores como MdO e Peças
                            extraidos.valor_mao_de_obra = unicos[0].toString();
                            extraidos.valor_pecas = unicos.length > 1 ? unicos[1].toString() : '0';
                        }
                    } else if (unicos.length === 1) {
                        // Só 1 valor não-zero: provavelmente só mão de obra
                        extraidos.valor_mao_de_obra = unicos[0].toString();
                    }
                }
            }

            console.log('[NBS] Valores finais:', { maoDeObra: extraidos.valor_mao_de_obra, pecas: extraidos.valor_pecas });

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
