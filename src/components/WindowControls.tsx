import { X } from 'lucide-react';

export function WindowControls() {
    const handleClose = () => {
        window.close();
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={handleClose}
                className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-700 rounded-lg shadow-lg transition-all duration-200 hover:scale-110"
                title="Fechar Aplicação"
            >
                <X className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
        </div>
    );
}
