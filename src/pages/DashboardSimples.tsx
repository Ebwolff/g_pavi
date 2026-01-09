import { AppLayout } from '../components/AppLayout';

export function DashboardSimples() {
    console.log('✅ DashboardSimples RENDERIZOU!');

    return (
        <AppLayout>
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', color: '#333', marginBottom: '20px' }}>
                    ✅ Dashboard Simples Funcionando!
                </h1>
                <p style={{ fontSize: '18px', color: '#666' }}>
                    Se você está vendo isso, o AppLayout funciona.
                </p>
                <p style={{ fontSize: '14px', color: '#999', marginTop: '20px' }}>
                    O problema pode estar nos services (statsService, charts, etc)
                </p>
            </div>
        </AppLayout>
    );
}
