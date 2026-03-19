import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { alertasService } from '@/services/alertasService';

/**
 * Helper to create workflow-handoff alerts that trigger push notifications.
 * Each function creates a record in the `alertas` table, which the
 * pushNotificationService Realtime listener picks up and shows as a native notification.
 */

// Lookup: find user IDs by role (same tenant)
async function getUserIdsByRole(role: string): Promise<string[]> {
    const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', role);
    return (data || []).map((p: { id: string }) => p.id);
}

// Lookup: find the user_id of a tecnico by tecnico.id
async function getTecnicoUserId(tecnicoId: string): Promise<string | null> {
    const { data } = await supabase
        .from('tecnicos')
        .select('user_id')
        .eq('id', tecnicoId)
        .maybeSingle();
    return (data as { user_id: string } | null)?.user_id || null;
}

// Lookup: find the consultor (creator) of an OS
async function getOSConsultorId(osId: string): Promise<string | null> {
    const { data } = await supabase
        .from('ordens_servico')
        .select('created_by')
        .eq('id', osId)
        .maybeSingle();
    return (data as { created_by: string } | null)?.created_by || null;
}

// Get OS numero for display
async function getOSNumero(osId: string): Promise<string> {
    const { data } = await supabase
        .from('ordens_servico')
        .select('numero_os')
        .eq('id', osId)
        .maybeSingle();
    return (data as { numero_os: string } | null)?.numero_os || 'N/A';
}

/**
 * 1. OS created → notify CHEFE_OFICINA to assign technician
 */
export async function notifyOSCreated(osId: string, numeroOS: string) {
    try {
        const chefeIds = await getUserIdsByRole('CHEFE_OFICINA');
        for (const userId of chefeIds) {
            await alertasService.criarAlerta({
                usuario_id: userId,
                tipo_alerta: 'NOVA_OS',
                titulo: `Nova OS #${numeroOS}`,
                mensagem: `Uma nova ordem de serviço foi criada e precisa de atribuição de técnico.`,
                prioridade: 'ALTA',
                os_id: osId,
                lido: false,
            });
        }
    } catch (err) {
        logger.error('[notificationHelper] Erro ao notificar OS criada:', err);
    }
}

/**
 * 2. OS assigned to technician → notify TECNICO
 */
export async function notifyTecnicoAssigned(osId: string, tecnicoId: string) {
    try {
        const userId = await getTecnicoUserId(tecnicoId);
        if (!userId) return;

        const numero = await getOSNumero(osId);
        await alertasService.criarAlerta({
            usuario_id: userId,
            tipo_alerta: 'OS_ATRIBUIDA',
            titulo: `OS #${numero} atribuída a você`,
            mensagem: `Você recebeu uma nova ordem de serviço para execução.`,
            prioridade: 'ALTA',
            os_id: osId,
            lido: false,
        });
    } catch (err) {
        logger.error('[notificationHelper] Erro ao notificar técnico:', err);
    }
}

/**
 * 3. Technician requests parts (PENDENTE_CONSULTOR) → notify CONSULTOR of the OS
 */
export async function notifyPartsRequested(osId: string, pecaDescricao: string) {
    try {
        const consultorId = await getOSConsultorId(osId);
        if (!consultorId) return;

        const numero = await getOSNumero(osId);
        await alertasService.criarAlerta({
            usuario_id: consultorId,
            tipo_alerta: 'PECAS_SOLICITADAS',
            titulo: `Peça solicitada na OS #${numero}`,
            mensagem: `O técnico solicitou: ${pecaDescricao}. Aguardando sua aprovação.`,
            prioridade: 'NORMAL',
            os_id: osId,
            lido: false,
        });
    } catch (err) {
        logger.error('[notificationHelper] Erro ao notificar consultor sobre peça:', err);
    }
}

/**
 * 4. Consultant approves part → notify ALMOXARIFADO to separate
 */
export async function notifyAlmoxarifado(osId: string, pecaDescricao: string) {
    try {
        const almoxIds = await getUserIdsByRole('ALMOXARIFADO');
        const numero = await getOSNumero(osId);

        for (const userId of almoxIds) {
            await alertasService.criarAlerta({
                usuario_id: userId,
                tipo_alerta: 'PECAS_CHEGANDO',
                titulo: `Peça aprovada para OS #${numero}`,
                mensagem: `A peça "${pecaDescricao}" foi aprovada e precisa ser separada.`,
                prioridade: 'NORMAL',
                os_id: osId,
                lido: false,
            });
        }
    } catch (err) {
        logger.error('[notificationHelper] Erro ao notificar almoxarifado:', err);
    }
}

/**
 * 5. Part needs purchase → notify COMPRAS
 */
export async function notifyCompras(osId: string, pecaDescricao: string) {
    try {
        const comprasIds = await getUserIdsByRole('COMPRAS');
        const numero = await getOSNumero(osId);

        for (const userId of comprasIds) {
            await alertasService.criarAlerta({
                usuario_id: userId,
                tipo_alerta: 'COMPRA_NECESSARIA',
                titulo: `Compra necessária - OS #${numero}`,
                mensagem: `A peça "${pecaDescricao}" precisa ser comprada para a OS #${numero}.`,
                prioridade: 'ALTA',
                os_id: osId,
                lido: false,
            });
        }
    } catch (err) {
        logger.error('[notificationHelper] Erro ao notificar compras:', err);
    }
}

/**
 * 6. OS status changed → notify the CONSULTOR who created it
 */
export async function notifyOSStatusChanged(osId: string, novoStatus: string) {
    try {
        const consultorId = await getOSConsultorId(osId);
        if (!consultorId) return;

        const numero = await getOSNumero(osId);
        const statusLabels: Record<string, string> = {
            'EM_EXECUCAO': 'Em Execução',
            'PAUSADA': 'Pausada',
            'AGUARDANDO_PECAS': 'Aguardando Peças',
            'CONCLUIDA': 'Concluída',
            'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
        };

        const label = statusLabels[novoStatus] || novoStatus;

        await alertasService.criarAlerta({
            usuario_id: consultorId,
            tipo_alerta: 'STATUS_ALTERADO',
            titulo: `OS #${numero} → ${label}`,
            mensagem: `O status da ordem de serviço foi alterado para: ${label}.`,
            prioridade: 'NORMAL',
            os_id: osId,
            lido: false,
        });
    } catch (err) {
        logger.error('[notificationHelper] Erro ao notificar mudança de status:', err);
    }
}
