const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');

class PropostaController {
    // Criar nova proposta
    static async criarProposta(req, res) {
        try {
            const { nome, pedirWhatsapp, tipo, linkCanva, arquivo, empresas } = req.body;
            
            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const usuario = req.session.user;

            // Validação básica
            if (!nome || !tipo) {
                return res.status(400).json(responseFormatter.error('Nome e tipo da proposta são obrigatórios'));
            }

            if (tipo === 'canva' && !linkCanva) {
                return res.status(400).json(responseFormatter.error('Link do Canva é obrigatório para propostas do tipo Canva'));
            }

            // Validação da empresa
            if (!empresas || empresas.length === 0) {
                return res.status(400).json(responseFormatter.error('É obrigatório selecionar uma empresa para a proposta'));
            }

            const empresaId = empresas[0]; // Pegar a primeira empresa (agora só permite uma)

            // Verificar permissões: USER só pode criar para suas empresas
            if (usuario.permissao === 'USER') {
                // Buscar empresas que o usuário tem acesso
                const { data: empresasUsuario, error: errorEmpresas } = await supabase
                    .from('usuario_empresa')
                    .select('empresa_id')
                    .eq('usuario_id', usuario.id);

                if (errorEmpresas) throw errorEmpresas;

                const empresasUsuarioIds = empresasUsuario.map(e => e.empresa_id);
                if (!empresasUsuarioIds.includes(empresaId)) {
                    return res.status(403).json(responseFormatter.error('Você não tem permissão para criar propostas para esta empresa'));
                }
            }

            // Criar a proposta
            const { data: proposta, error: errorProposta } = await supabase
                .from('propostas')
                .insert({
                    nome,
                    pedir_whatsapp: pedirWhatsapp || false,
                    tipo,
                    link_canva: tipo === 'canva' ? linkCanva : null,
                    arquivo: tipo === 'arquivo' ? arquivo : null,
                    data_criacao: new Date().toISOString(),
                    status: 'Não aberta',
                    visualizacoes: 0,
                    empresa_id: empresaId
                })
                .select()
                .single();

            if (errorProposta) throw errorProposta;

            res.status(201).json(responseFormatter.success(proposta));

        } catch (error) {
            console.error('Erro ao criar proposta:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Buscar proposta específica para visualização pública
    static async buscarPropostaPorId(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json(responseFormatter.error('ID da proposta é obrigatório'));
            }

            // Buscar a proposta com dados da empresa
            const { data: proposta, error } = await supabase
                .from('propostas')
                .select(`
                    *,
                    empresa:empresas!empresa_id(id, nome)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erro ao buscar proposta:', error);
                return res.status(404).json(responseFormatter.error('Proposta não encontrada'));
            }

            if (!proposta) {
                return res.status(404).json(responseFormatter.error('Proposta não encontrada'));
            }

            console.log('✅ Proposta encontrada e retornada:', {
                id: proposta.id,
                nome: proposta.nome,
                tipo: proposta.tipo,
                pedir_whatsapp: proposta.pedir_whatsapp,
                arquivo: proposta.arquivo ? 'Presente' : 'Ausente'
            });

            return res.status(200).json(responseFormatter.success(proposta));

        } catch (error) {
            console.error('Erro interno ao buscar proposta:', error);
            return res.status(500).json(responseFormatter.error('Erro interno do servidor'));
        }
    }

    // Listar propostas do usuário
    static async listarPropostas(req, res) {
        try {
            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const usuario = req.session.user;
            let propostas = [];

            if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
                // ADMIN e GESTOR: acesso a todas as propostas
                const { data, error } = await supabase
                    .from('propostas')
                    .select(`
                        *,
                        empresas:empresa_id (
                            id,
                            nome
                        )
                    `)
                    .order('data_criacao', { ascending: false });

                if (error) throw error;
                propostas = data;

            } else if (usuario.permissao === 'USER') {
                // USER: apenas propostas das empresas vinculadas
                const { data: empresasUsuario, error: errorEmpresas } = await supabase
                    .from('usuario_empresa')
                    .select('empresa_id')
                    .eq('usuario_id', usuario.id);

                if (errorEmpresas) throw errorEmpresas;

                if (empresasUsuario.length > 0) {
                    const empresasIds = empresasUsuario.map(e => e.empresa_id);

                    const { data, error } = await supabase
                        .from('propostas')
                        .select(`
                            *,
                            empresas:empresa_id (
                                id,
                                nome
                            )
                        `)
                        .in('empresa_id', empresasIds)
                        .order('data_criacao', { ascending: false });

                    if (error) throw error;
                    propostas = data;
                }
            }

            res.status(200).json(responseFormatter.success(propostas));

        } catch (error) {
            console.error('Erro ao listar propostas:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Atualizar proposta
    static async atualizarProposta(req, res) {
        try {
            const { id } = req.params;
            const dadosAtualizacao = req.body;

            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const usuario = req.session.user;

            // Verificar permissões
            const temPermissao = await PropostaController.verificarPermissaoProposta(id, usuario);
            if (!temPermissao) {
                return res.status(403).json(responseFormatter.error('Acesso negado a esta proposta'));
            }

            const { data, error } = await supabase
                .from('propostas')
                .update(dadosAtualizacao)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.status(200).json(responseFormatter.success(data));

        } catch (error) {
            console.error('Erro ao atualizar proposta:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Excluir proposta
    static async excluirProposta(req, res) {
        try {
            const { id } = req.params;

            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const usuario = req.session.user;

            // Verificar permissões
            const temPermissao = await PropostaController.verificarPermissaoProposta(id, usuario);
            if (!temPermissao) {
                return res.status(403).json(responseFormatter.error('Acesso negado a esta proposta'));
            }

            // Excluir proposta (o CASCADE vai cuidar das aberturas_proposta automaticamente)
            const { error } = await supabase
                .from('propostas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.status(200).json(responseFormatter.success({ message: 'Proposta excluída com sucesso' }));

        } catch (error) {
            console.error('Erro ao excluir proposta:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Registrar abertura de proposta
    static async registrarAbertura(req, res) {
        try {
            const { propostaId, ip, userAgent } = req.body;

            if (!propostaId) {
                return res.status(400).json(responseFormatter.error('ID da proposta é obrigatório'));
            }

            // Atualizar contadores da proposta
            const { data: proposta, error: errorUpdate } = await supabase
                .from('propostas')
                .update({ 
                    status: 'Aberta',
                    visualizacoes: supabase.sql`visualizacoes + 1`
                })
                .eq('id', propostaId)
                .select()
                .single();

            if (errorUpdate) throw errorUpdate;

            // Registrar abertura na tabela de log (se existir)
            const abertura = {
                proposta_id: propostaId,
                dataHora: new Date().toISOString(),
                ip: ip || req.ip,
                userAgent: userAgent || req.get('User-Agent')
            };

            // Aqui você pode criar uma tabela de log de aberturas se necessário
            // Por enquanto, vamos apenas retornar os dados

            res.status(200).json(responseFormatter.success({
                ...abertura,
                proposta: proposta
            }));

        } catch (error) {
            console.error('Erro ao registrar abertura:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Verificar se usuário tem permissão para acessar uma proposta específica
    static async verificarPermissaoProposta(propostaId, usuario) {
        try {
            if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
                return true; // ADMIN e GESTOR têm acesso total
            }

            if (usuario.permissao === 'USER') {
                // Buscar a proposta e verificar se pertence a uma empresa do usuário
                const { data: proposta } = await supabase
                    .from('propostas')
                    .select('empresa_id')
                    .eq('id', propostaId)
                    .single();

                if (!proposta) {
                    return false;
                }

                // Verificar se o usuário tem acesso à empresa da proposta
                const { data: empresasUsuario } = await supabase
                    .from('usuario_empresa')
                    .select('empresa_id')
                    .eq('usuario_id', usuario.id);

                if (!empresasUsuario || empresasUsuario.length === 0) {
                    return false;
                }

                const empresasIds = empresasUsuario.map(e => e.empresa_id);
                return empresasIds.includes(proposta.empresa_id);
            }

            return false;

        } catch (error) {
            console.error('Erro ao verificar permissão da proposta:', error);
            return false;
        }
    }

    // Buscar empresas disponíveis para vincular à proposta
    static async buscarEmpresasDisponiveis(req, res) {
        try {
            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const usuario = req.session.user;
            let empresas = [];

            if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
                // ADMIN e GESTOR: todas as empresas
                const { data, error } = await supabase
                    .from('empresas')
                    .select('id, nome')
                    .order('nome');

                if (error) throw error;
                empresas = data;

            } else if (usuario.permissao === 'USER') {
                // USER: apenas suas empresas
                const { data, error } = await supabase
                    .from('usuario_empresa')
                    .select(`
                        empresas:empresa_id (
                            id,
                            nome
                        )
                    `)
                    .eq('usuario_id', usuario.id);

                if (error) throw error;
                empresas = data.map(item => item.empresas);
            }

            res.status(200).json(responseFormatter.success(empresas));

        } catch (error) {
            console.error('Erro ao buscar empresas disponíveis:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Servir proposta pública (sem autenticação)
    static async servirProposta(req, res) {
        try {
            const { id } = req.params;

            // Buscar proposta com informações básicas
            const { data: proposta, error } = await supabase
                .from('propostas')
                .select('id, nome, pedir_whatsapp, tipo, link_canva, arquivo')
                .eq('id', id)
                .single();

            if (error || !proposta) {
                return res.status(404).json(responseFormatter.error('Proposta não encontrada'));
            }

            // Retornar dados da proposta para o frontend
            res.json(responseFormatter.success({
                id: proposta.id,
                nome: proposta.nome,
                pedirWhatsapp: proposta.pedir_whatsapp,
                tipo: proposta.tipo,
                linkCanva: proposta.link_canva,
                arquivo: proposta.arquivo
            }));

        } catch (error) {
            console.error('Erro ao servir proposta:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Registrar visualização da proposta (sem autenticação)
    static async registrarVisualizacao(req, res) {
        try {
            const { id } = req.params;
            const { fullName, whatsapp } = req.body;

            // Validação básica
            if (!fullName) {
                return res.status(400).json(responseFormatter.error('Nome é obrigatório'));
            }

            // Verificar se a proposta existe
            const { data: proposta, error: errorProposta } = await supabase
                .from('propostas')
                .select(`
                    *,
                    empresas:empresa_id (
                        id,
                        nome
                    )
                `)
                .eq('id', id)
                .single();

            if (errorProposta || !proposta) {
                return res.status(404).json(responseFormatter.error('Proposta não encontrada'));
            }

            // Validar se WhatsApp é obrigatório para esta proposta
            if (proposta.pedir_whatsapp && !whatsapp) {
                return res.status(400).json(responseFormatter.error('WhatsApp é obrigatório para esta proposta'));
            }

            // Incrementar visualizações e atualizar status
            const { error: errorUpdate } = await supabase
                .from('propostas')
                .update({ 
                    visualizacoes: proposta.visualizacoes + 1,
                    status: 'Aberta'
                })
                .eq('id', id);

            if (errorUpdate) throw errorUpdate;

            // Registrar abertura com dados do cliente
            const { error: errorAbertura } = await supabase
                .from('aberturas_proposta')
                .insert({
                    proposta_id: id,
                    nome_acesso: fullName,
                    wpp_acesso: whatsapp || null,
                    data_abertura: new Date().toISOString(),
                    ip: req.ip || req.connection.remoteAddress
                });

            if (errorAbertura) {
                console.warn('Erro ao registrar abertura:', errorAbertura);
                // Não falhar se não conseguir registrar a abertura
            }

            // 📱 ENVIAR NOTIFICAÇÃO WHATSAPP
            try {
                const numeroDestino = '41996616801'; // Número padrão para notificações (conforme solicitado)
                const empresaNome = proposta.empresas?.nome || 'Empresa não especificada';
                const tipoAcao = proposta.tipo === 'arquivo' ? '📥 BAIXOU' : '👁️ ACESSOU';
                
                const mensagem = `🚀 *NOVA AÇÃO EM PROPOSTA!*\n\n` +
                    `${tipoAcao} a proposta: *${proposta.nome}*\n\n` +
                    `👤 Cliente: ${fullName}\n` +
                    `${whatsapp ? `📱 WhatsApp: ${whatsapp}\n` : ''}` +
                    `🏢 Empresa: ${empresaNome}\n` +
                    `🔢 Visualizações totais: ${proposta.visualizacoes + 1}\n` +
                    `📅 Data: ${new Date().toLocaleString('pt-BR')}`;

                // Enviar via BotConversa (mesma API do sistema de notificações)
                const responseWhatsApp = await fetch('https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/133147/oma7bYgznono/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        telefone: numeroDestino,
                        nome: fullName,
                        mensagem: mensagem
                    })
                });

                if (responseWhatsApp.ok) {
                    const responseData = await responseWhatsApp.json();
                    console.log(`📱 Notificação enviada para ${numeroDestino}: ${fullName} ${tipoAcao} "${proposta.nome}"`, responseData);
                } else {
                    console.warn('⚠️ Falha ao enviar notificação WhatsApp:', await responseWhatsApp.text());
                }

            } catch (errorNotificacao) {
                console.error('❌ Erro ao enviar notificação WhatsApp:', errorNotificacao);
                // Não falhar a requisição principal por causa da notificação
            }

            res.json(responseFormatter.success({
                message: `Obrigado, ${fullName}! Sua solicitação foi registrada.`,
                proposta: {
                    id: proposta.id,
                    nome: proposta.nome,
                    tipo: proposta.tipo,
                    linkCanva: proposta.link_canva,
                    arquivo: proposta.arquivo,
                    pedirWhatsapp: proposta.pedir_whatsapp
                }
            }));

        } catch (error) {
            console.error('Erro ao registrar visualização:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }

    // Listar aberturas de uma proposta
    static async listarAberturas(req, res) {
        try {
            const { id } = req.params;

            // Verificar se há usuário logado
            if (!req.session || !req.session.user) {
                return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
            }

            const usuario = req.session.user;

            // Verificar permissões
            const temPermissao = await PropostaController.verificarPermissaoProposta(id, usuario);
            if (!temPermissao) {
                return res.status(403).json(responseFormatter.error('Acesso negado a esta proposta'));
            }

            // Buscar aberturas da proposta
            const { data: aberturas, error } = await supabase
                .from('aberturas_proposta')
                .select('*')
                .eq('proposta_id', id)
                .order('data_abertura', { ascending: false });

            if (error) throw error;

            console.log(`📊 Listando ${aberturas?.length || 0} aberturas da proposta ${id}`);

            res.status(200).json(responseFormatter.success(aberturas || []));

        } catch (error) {
            console.error('Erro ao listar aberturas:', error);
            res.status(500).json(responseFormatter.error('Erro interno do servidor', error));
        }
    }
}

module.exports = PropostaController;