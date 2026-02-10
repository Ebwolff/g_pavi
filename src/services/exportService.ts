/**
 * Serviço de Exportação para Relatórios
 * Suporta PDF (básico com window.print) e CSV
 */

export interface RelatorioDados {
  titulo: string;
  subtitulo?: string;
  colunas: string[];
  linhas: any[][];
  totalizadores?: Record<string, string | number>;
}

export const exportService = {
  /**
   * Exportar para CSV
   */
  exportarCSV(dados: RelatorioDados, nomeArquivo: string = 'relatorio') {
    const { colunas, linhas } = dados;

    // Criar cabeçalho
    let csvContent = colunas.join(';') + '\n';

    // Adicionar linhas
    linhas.forEach((linha) => {
      csvContent += linha.map((celula) => {
        // Escapar vírgulas e aspas
        const valor = celula?.toString() || '';
        if (valor.includes(';') || valor.includes('"') || valor.includes('\n')) {
          return `"${valor.replace(/"/g, '""')}"`;
        }
        return valor;
      }).join(';') + '\n';
    });

    // Criar blob e download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Exportar para Excel (formato CSV mas com extensão .xls)
   */
  exportarExcel(dados: RelatorioDados, nomeArquivo: string = 'relatorio') {
    this.exportarCSV(dados, nomeArquivo);
  },

  /**
   * Gerar HTML para impressão/PDF
   */
  gerarHTMLImpressao(dados: RelatorioDados): string {
    const { titulo, subtitulo, colunas, linhas, totalizadores } = dados;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .header h1 {
            font-size: 18pt;
            margin: 0 0 5px 0;
            color: #1f2937;
          }
          
          .header p {
            margin: 0;
            color: #6b7280;
            font-size: 10pt;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background-color: #f3f4f6;
            color: #1f2937;
            font-weight: bold;
            padding: 8px;
            text-align: left;
            border: 1px solid  #d1d5db;
            font-size: 9pt;
          }
          
          td {
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
            font-size: 9pt;
          }
          
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          .totalizadores {
            margin-top: 10px;
            padding: 10px;
            background-color: #f3f4f6;
            border-radius: 4px;
          }
          
          .totalizadores p {
            margin: 5px 0;
            font-weight: bold;
          }
          
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8pt;
            color: #9ca3af;
          }
          
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          ${subtitulo ? `<p>${subtitulo}</p>` : ''}
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              ${colunas.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${linhas.map(linha => `
              <tr>
                ${linha.map(celula => `<td>${celula || '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${totalizadores ? `
          <div class="totalizadores">
            ${Object.entries(totalizadores).map(([chave, valor]) => `
              <p>${chave}: ${valor}</p>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Gestão 360 - Sistema de Gestão Pós-Venda</p>
        </div>
      </body>
      </html>
    `;

    return html;
  },

  /**
   * Imprimir relatório (abre janela de impressão)
   */
  imprimirRelatorio(dados: RelatorioDados) {
    const html = this.gerarHTMLImpressao(dados);

    const janela = window.open('', '_blank', 'width=900,height=700');
    if (janela) {
      janela.document.write(html);
      janela.document.close();

      // Aguardar carregamento e imprimir
      janela.onload = () => {
        janela.focus();
        setTimeout(() => {
          janela.print();
        }, 250);
      };
    }
  },

  /**
   * Salvar como PDF (via impressão do navegador)
   */
  salvarPDF(dados: RelatorioDados) {
    // Mesmo que imprimir, mas o usuário escolhe "Salvar como PDF"
    this.imprimirRelatorio(dados);
  },
};

/**
 * Formatar valor monetário
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Formatar data
 */
export const formatarData = (data: string | Date): string => {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  return new Intl.DateTimeFormat('pt-BR').format(dataObj);
};

/**
 * Formatar porcentagem
 */
export const formatarPorcentagem = (valor: number, casasDecimais: number = 1): string => {
  return `${valor.toFixed(casasDecimais)}%`;
};
