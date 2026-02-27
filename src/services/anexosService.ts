import { supabase } from '@/lib/supabase';

export interface Anexo {
    id: string;
    ordem_servico_id: string;
    url_anexo: string;
    tipo_anexo: string;
    descricao: string | null;
    usuario_id: string | null;
    created_at: string;
}

class AnexosService {
    /**
     * Busca todos os anexos de uma OS
     */
    async getAnexosByOS(osId: string): Promise<Anexo[]> {
        const { data, error } = await supabase
            .from('anexos_os')
            .select('*')
            .eq('ordem_servico_id', osId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar anexos:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Upload de arquivo para o Storage e registro no banco
     */
    async uploadAnexo(
        osId: string,
        file: File,
        descricao?: string,
        tipo: string = 'IMAGEM'
    ): Promise<Anexo> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');

        // 1. Upload para o Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${osId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `anexos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('anexos_os')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Erro no upload Storage:', uploadError);
            throw uploadError;
        }

        // 2. Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('anexos_os')
            .getPublicUrl(filePath);

        // 3. Registrar no banco de dados
        const { data, error: dbError } = await supabase
            .from('anexos_os' as any)
            .insert({
                ordem_servico_id: osId,
                url_anexo: publicUrl,
                tipo_anexo: tipo,
                descricao: descricao || null,
                usuario_id: userData.user.id
            } as any)
            .select()
            .single();

        if (dbError) {
            console.error('Erro ao registrar anexo no banco:', dbError);
            throw dbError;
        }

        return data;
    }

    /**
     * Exclui um anexo (banco e storage)
     */
    async excluirAnexo(anexo: Anexo): Promise<void> {
        // 1. Extrair path do storage da URL (assumindo que segue o padrão do Supabase)
        // URL: https://.../storage/v1/object/public/anexos_os/anexos/osId/file.ext
        const pathPart = anexo.url_anexo.split('anexos_os/').pop();
        if (pathPart) {
            await supabase.storage
                .from('anexos_os')
                .remove([pathPart]);
        }

        // 2. Remover do banco
        const { error } = await supabase
            .from('anexos_os')
            .delete()
            .eq('id', anexo.id);

        if (error) {
            console.error('Erro ao excluir anexo do banco:', error);
            throw error;
        }
    }
}

export const anexosService = new AnexosService();
