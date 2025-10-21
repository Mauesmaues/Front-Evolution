const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');
const multer = require('multer');
const path = require('path');

// Configurar multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas (JPEG, PNG, SVG, WebP)'));
        }
    }
});

/**
 * Salvar ou atualizar configurações visuais de uma empresa
 */
async function salvarVisual(req, res) {
    try {
        // Verificar se há usuário logado
        if (!req.session || !req.session.user) {
            return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
        }

        const { corObjetosFlutuantes, corFundoPainelEsquerdo, empresaId } = req.body;
        const logo = req.file;
        const usuarioId = req.session.user.id;
        const permissao = req.session.user.permissao;

        console.log('📥 Recebendo dados do visual:', {
            corObjetosFlutuantes,
            corFundoPainelEsquerdo,
            empresaId,
            temLogo: !!logo,
            usuarioId,
            permissao
        });

        let empresaIdFinal;

        // Se empresaId foi fornecido no body (novo comportamento)
        if (empresaId) {
            empresaIdFinal = parseInt(empresaId);
            
            // Verificar se o usuário tem permissão para essa empresa
            const { data: empresasUsuario, error: errorEmpresas } = await supabase
                .from('usuario_empresa')
                .select('empresa_id')
                .eq('usuario_id', usuarioId)
                .eq('empresa_id', empresaIdFinal);

            if (errorEmpresas) {
                console.error('Erro ao verificar permissão:', errorEmpresas);
                return res.status(500).json(responseFormatter.error('Erro ao verificar permissão'));
            }

            // Se não é ADMIN/GESTOR e não tem permissão para esta empresa
            if (permissao !== 'ADMIN' && permissao !== 'GESTOR' && (!empresasUsuario || empresasUsuario.length === 0)) {
                return res.status(403).json(responseFormatter.error('Você não tem permissão para editar o visual desta empresa'));
            }
        } else {
            // Comportamento antigo - buscar primeira empresa do usuário
            const { data: empresasUsuario, error: errorEmpresas } = await supabase
                .from('usuario_empresa')
                .select('empresa_id')
                .eq('usuario_id', usuarioId);

            if (errorEmpresas) {
                console.error('Erro ao buscar empresas do usuário:', errorEmpresas);
                return res.status(500).json(responseFormatter.error('Erro ao buscar empresas do usuário'));
            }

            if (!empresasUsuario || empresasUsuario.length === 0) {
                return res.status(403).json(responseFormatter.error('Usuário não está vinculado a nenhuma empresa'));
            }

            empresaIdFinal = empresasUsuario[0].empresa_id;
        }

        console.log('🏢 Salvando visual para empresa ID:', empresaIdFinal);

        let logoUrl = null;

        // Se há logo para fazer upload
        if (logo) {
            try {
                // Gerar nome único para o arquivo
                const timestamp = Date.now();
                const extension = path.extname(logo.originalname);
                const fileName = `logo-empresa-${empresaId}-${timestamp}${extension}`;
                const filePath = `logos/${fileName}`;

                console.log('📤 Fazendo upload do logo:', filePath);

                // Upload para Supabase Storage (usa o mesmo bucket 'arquivos-propostas')
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('arquivos-propostas')
                    .upload(filePath, logo.buffer, {
                        contentType: logo.mimetype,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Erro ao fazer upload do logo:', uploadError);
                    throw uploadError;
                }

                // Obter URL pública do arquivo
                const { data: publicUrlData } = supabase.storage
                    .from('arquivos-propostas')
                    .getPublicUrl(filePath);

                logoUrl = publicUrlData.publicUrl;
                console.log('✅ Logo enviado com sucesso:', logoUrl);

            } catch (uploadError) {
                console.error('Erro no upload do logo:', uploadError);
                return res.status(500).json(responseFormatter.error('Erro ao fazer upload do logo'));
            }
        }

        // Verificar se já existe configuração visual para esta empresa
        const { data: visualExistente, error: errorBusca } = await supabase
            .from('visual_proposta')
            .select('*')
            .eq('empresa_id', empresaIdFinal)
            .single();

        if (errorBusca && errorBusca.code !== 'PGRST116') { // PGRST116 = não encontrado
            console.error('Erro ao buscar visual existente:', errorBusca);
            return res.status(500).json(responseFormatter.error('Erro ao buscar configuração visual'));
        }

        let resultado;

        // Preparar dados para salvar
        const dadosVisual = {
            empresa_id: empresaIdFinal,
            updated_at: new Date().toISOString()
        };

        if (corObjetosFlutuantes) {
            dadosVisual.cor_objetos_flutuantes = corObjetosFlutuantes;
        }

        if (corFundoPainelEsquerdo) {
            dadosVisual.cor_fundo_painel_esquerdo = corFundoPainelEsquerdo;
        }

        if (logoUrl) {
            dadosVisual.logo_url = logoUrl;
        }

        if (visualExistente) {
            // Atualizar visual existente
            console.log('🔄 Atualizando visual existente');
            const { data, error } = await supabase
                .from('visual_proposta')
                .update(dadosVisual)
                .eq('empresa_id', empresaIdFinal)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar visual:', error);
                return res.status(500).json(responseFormatter.error('Erro ao atualizar configuração visual'));
            }

            resultado = data;
        } else {
            // Criar novo visual
            console.log('➕ Criando novo visual');
            const { data, error } = await supabase
                .from('visual_proposta')
                .insert([dadosVisual])
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar visual:', error);
                return res.status(500).json(responseFormatter.error('Erro ao criar configuração visual'));
            }

            resultado = data;
        }

        console.log('✅ Visual salvo com sucesso:', resultado);

        return res.status(200).json(responseFormatter.success(resultado));

    } catch (error) {
        console.error('Erro ao salvar visual:', error);
        return res.status(500).json(responseFormatter.error(error.message || 'Erro ao salvar configuração visual'));
    }
}

/**
 * Buscar configuração visual por empresa
 */
async function buscarVisualPorEmpresa(req, res) {
    try {
        const { empresaId } = req.params;

        console.log('🔍 Buscando visual da empresa ID:', empresaId);

        if (!empresaId) {
            return res.status(400).json(responseFormatter.error('ID da empresa não fornecido'));
        }

        const { data, error } = await supabase
            .from('visual_proposta')
            .select('*')
            .eq('empresa_id', empresaId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Não encontrado - retornar configuração padrão
                console.log('⚠️ Visual não encontrado, retornando padrão');
                return res.status(200).json(responseFormatter.success( {
                    empresa_id: empresaId,
                    logo_url: null,
                    cor_objetos_flutuantes: '#00bcd4',
                    cor_fundo_painel_esquerdo: '#070707'
                }, 'Configuração visual padrão'));
            }

            console.error('Erro ao buscar visual:', error);
            return res.status(500).json(responseFormatter.error('Erro ao buscar configuração visual'));
        }

        console.log('✅ Visual encontrado:', data);

        return res.status(200).json(responseFormatter.success(data));

    } catch (error) {
        console.error('Erro ao buscar visual:', error);
        return res.status(500).json(responseFormatter.error(error.message || 'Erro ao buscar configuração visual'));
    }
}

/**
 * Buscar configuração visual do usuário atual (primeira empresa vinculada)
 */
async function buscarVisualUsuarioAtual(req, res) {
    try {
        // Verificar se há usuário logado
        if (!req.session || !req.session.user) {
            return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
        }

        const usuarioId = req.session.user.id;

        console.log('🔍 Buscando visual do usuário ID:', usuarioId);

        // Buscar primeira empresa do usuário
        const { data: empresasUsuario, error: errorEmpresas } = await supabase
            .from('usuario_empresa')
            .select('empresa_id')
            .eq('usuario_id', usuarioId)
            .limit(1)
            .single();

        if (errorEmpresas || !empresasUsuario) {
            console.log('⚠️ Usuário sem empresa vinculada, retornando padrão');
            return res.status(200).json(responseFormatter.success( {
                logo_url: null,
                cor_objetos_flutuantes: '#00bcd4',
                cor_fundo_painel_esquerdo: '#070707'
            }, 'Configuração visual padrão'));
        }

        const empresaId = empresasUsuario.empresa_id;

        // Buscar visual da empresa
        const { data, error } = await supabase
            .from('visual_proposta')
            .select('*')
            .eq('empresa_id', empresaId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Não encontrado - retornar configuração padrão
                console.log('⚠️ Visual não encontrado, retornando padrão');
                return res.status(200).json(responseFormatter.success( {
                    empresa_id: empresaId,
                    logo_url: null,
                    cor_objetos_flutuantes: '#00bcd4',
                    cor_fundo_painel_esquerdo: '#070707'
                }, 'Configuração visual padrão'));
            }

            console.error('Erro ao buscar visual:', error);
            return res.status(500).json(responseFormatter.error('Erro ao buscar configuração visual'));
        }

        console.log('✅ Visual encontrado:', data);

        return res.status(200).json(responseFormatter.success(data));

    } catch (error) {
        console.error('Erro ao buscar visual:', error);
        return res.status(500).json(responseFormatter.error(error.message || 'Erro ao buscar configuração visual'));
    }
}

module.exports = {
    salvarVisual,
    buscarVisualPorEmpresa,
    buscarVisualUsuarioAtual,
    upload
};
