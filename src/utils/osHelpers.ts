import { NivelUrgencia } from '../types/database.types';
import { differenceInDays } from 'date-fns';

/**
 * Calcula o número de dias desde a data de abertura da OS
 */
export const calcularDiasEmAberto = (dataAbertura: string | Date): number => {
    const data = typeof dataAbertura === 'string' ? new Date(dataAbertura) : dataAbertura;
    return differenceInDays(new Date(), data);
};

/**
 * Determina o nível de urgência baseado nos dias em aberto
 */
export const determinarNivelUrgencia = (diasEmAberto: number): NivelUrgencia => {
    if (diasEmAberto > 90) return 'CRITICO';
    if (diasEmAberto > 60) return 'ALTO';
    if (diasEmAberto > 30) return 'MEDIO';
    return 'NORMAL';
};

/**
 * Retorna a cor correspondente ao nível de urgência
 */
export const getCoresUrgencia = (nivel: NivelUrgencia) => {
    const cores = {
        CRITICO: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-300',
            badge: 'bg-red-500',
        },
        ALTO: {
            bg: 'bg-orange-100',
            text: 'text-orange-800',
            border: 'border-orange-300',
            badge: 'bg-orange-500',
        },
        MEDIO: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            border: 'border-yellow-300',
            badge: 'bg-yellow-500',
        },
        NORMAL: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-300',
            badge: 'bg-green-500',
        },
    };
    return cores[nivel];
};

/**
 * Formata valor monetário para exibição
 */
export const formatarValor = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor);
};

/**
 * Formata data para exibição
 */
export const formatarData = (data: string | Date): string => {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return new Intl.DateFormat('pt-BR').format(dataObj);
};

/**
 * Formata data e hora para exibição
 */
export const formatarDataHora = (data: string | Date): string => {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return new Intl.DateFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(dataObj);
};

/**
 * Trunca texto longo
 */
export const truncarTexto = (texto: string, maxLength: number = 50): string => {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
};

/**
 * Valida se uma string é um número válido
 */
export const isNumeroValido = (valor: string): boolean => {
    return !isNaN(parseFloat(valor)) && isFinite(Number(valor));
};

/**
 * Valida CPF/CNPJ básico
 */
export const validarCpfCnpj = (valor: string): boolean => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.length === 11 || numeros.length === 14;
};

/**
 * Gera número de OS automático
 */
export const gerarNumeroOS = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `OS${timestamp}${random}`;
};

/**
 * Calcula estatísticas de uma lista de OS
 */
export interface EstatisticasOS {
    total: number;
    emAberto: number;
    concluidas: number;
    valorTotal: number;
    tempoMedioResolucao: number;
}

export const calcularEstatisticas = (
    ordenServico: Array<{
        status_atual: string;
        data_abertura: string;
        data_fechamento?: string | null;
        valor_liquido_total: number;
    }>
): EstatisticasOS => {
    const concluidas = ordenServico.filter((os) =>
        ['CONCLUIDA', 'FATURADA'].includes(os.status_atual)
    );

    const tempoTotal = concluidas.reduce((acc, os) => {
        if (os.data_fechamento) {
            return acc + differenceInDays(new Date(os.data_fechamento), new Date(os.data_abertura));
        }
        return acc;
    }, 0);

    return {
        total: ordenServico.length,
        emAberto: ordenServico.filter((os) =>
            !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(os.status_atual)
        ).length,
        concluidas: concluidas.length,
        valorTotal: ordenServico.reduce((acc, os) => acc + os.valor_liquido_total, 0),
        tempoMedioResolucao: concluidas.length > 0 ? tempoTotal / concluidas.length : 0,
    };
};
