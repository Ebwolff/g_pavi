import '@testing-library/jest-dom';

// jsdom não implementa DOMMatrix; pdfjs-dist referencia `new DOMMatrix()` em nível de módulo
// (src/display/canvas.js), então qualquer componente que importe pdfjs-dist quebra a importação
// nos testes sem este stub, mesmo sem nenhuma renderização de PDF de fato ocorrer.
if (typeof globalThis.DOMMatrix === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).DOMMatrix = class DOMMatrix { };
}
