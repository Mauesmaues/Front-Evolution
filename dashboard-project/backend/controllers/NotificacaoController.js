const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');

class NotificacaoController {
  
  // Criar nova notificação
  static async criarNotificacao(req, res) {
    try {
      const { nome, numeroDestinatario, empresas, horario, ativo } = req.body;
      
      // Validações
      if (!nome || !numeroDestinatario || !empresas || empresas.length === 0) {
        return res.status(400).json(
          responseFormatter.error('Dados obrigatórios não fornecidos.')
        );
      }
      
      // Inserir notificação
      const { data: notificacao, error: errorNotificacao } = await supabase
        .from('notificacoes')
        .insert([{
          nome,
          numero_destinatario: numeroDestinatario,
          horario: horario || '09:00',
          ativo: ativo !== false, // Default true
        }])
        .select()
        .single();
      
      if (errorNotificacao) {
        console.error('Erro ao criar notificação:', errorNotificacao);
        return res.status(500).json(
          responseFormatter.error('Erro ao criar notificação.')
        );
      }
      
      // Inserir relações com empresas
      const relacoes = empresas.map(empresaId => ({
        notificacao_id: notificacao.id,
        empresa_id: empresaId
      }));
      
      const { error: errorRelacoes } = await supabase
        .from('notificacao_empresas')
        .insert(relacoes);
      
      if (errorRelacoes) {
        console.error('Erro ao criar relações notificação-empresa:', errorRelacoes);
        // Rollback - deletar notificação criada
        await supabase
          .from('notificacoes')
          .delete()
          .eq('id', notificacao.id);
          
        return res.status(500).json(
          responseFormatter.error('Erro ao associar empresas à notificação.')
        );
      }
      
      return res.status(201).json(
        responseFormatter.success(notificacao, 'Notificação criada com sucesso.')
      );
      
    } catch (error) {
      console.error('Erro interno ao criar notificação:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno do servidor.')
      );
    }
  }
  
  // Buscar notificações do usuário
  static async buscarNotificacoes(req, res) {
    try {
      // Verificar se o usuário está logado
      const { data: notificacoes, error } = await supabase
        .from('notificacoes')
        .select(`
          *,
          notificacao_empresas (
            empresa_id,
            empresas (
              id,
              nome
            )
          )
        `)
      
      if (error) {
        console.error('Erro ao buscar notificações:', error);
        return res.status(500).json(
          responseFormatter.error('Erro ao buscar notificações.')
        );
      }
      
      // Formatar dados para incluir lista de empresas
      const notificacoesFormatadas = notificacoes.map(notificacao => ({
        ...notificacao,
        empresas: notificacao.notificacao_empresas.map(rel => rel.empresas)
      }));
      
      return res.json(
        responseFormatter.success(notificacoesFormatadas, 'Notificações encontradas.')
      );
      
    } catch (error) {
      console.error('Erro interno ao buscar notificações:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno do servidor.')
      );
    }
  }
  
  // Excluir notificação
  static async excluirNotificacao(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se o usuário está logado
      if (!req.session.user) {
        return res.status(401).json(
          responseFormatter.error('Usuário não autenticado.')
        );
      }
      
      // Verificar se a notificação pertence ao usuário
      const { data: notificacao, error: errorBusca } = await supabase
        .from('notificacoes')
        .select('id, usuario_id')
        .eq('id', id)
        .eq('usuario_id', req.session.user.id)
        .single();
      
      if (errorBusca || !notificacao) {
        return res.status(404).json(
          responseFormatter.error('Notificação não encontrada.')
        );
      }
      
      // Excluir relações primeiro (devido à foreign key)
      const { error: errorRelacoes } = await supabase
        .from('notificacao_empresas')
        .delete()
        .eq('notificacao_id', id);
      
      if (errorRelacoes) {
        console.error('Erro ao excluir relações:', errorRelacoes);
        return res.status(500).json(
          responseFormatter.error('Erro ao excluir notificação.')
        );
      }
      
      // Excluir notificação
      const { error: errorNotificacao } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);
      
      if (errorNotificacao) {
        console.error('Erro ao excluir notificação:', errorNotificacao);
        return res.status(500).json(
          responseFormatter.error('Erro ao excluir notificação.')
        );
      }
      
      return res.json(
        responseFormatter.success(null, 'Notificação excluída com sucesso.')
      );
      
    } catch (error) {
      console.error('Erro interno ao excluir notificação:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno do servidor.')
      );
    }
  }

  static async enviarNotificação(req, res) {
    try {
        const notificações = await supabase
            .from('notificacoes')
            .select(`*`)
            .eq('ativo', true); // Só notificações ativas

        if (!notificações || !notificações.data || notificações.data.length === 0) {
            return res.status(404).json(
                responseFormatter.error('Nenhuma notificação ativa encontrada.')
            );
        }

        const today = new Date().toISOString().split('T')[0]; // Formato: 2025-09-11
        
        for(let i = 0; i < notificações.data.length; i++){
            console.log(notificações.data[i])

            const empresaNotifica = await supabase
                .from('notificacao_empresas')
                .select(`*`)
                .eq('notificacao_id', notificações.data[i].id)
                
            const contaDeAnuncioArray = []
            let totalConversoes = 0;
            
            // Buscar conversões para cada empresa
            for(let j = 0; j < empresaNotifica.data.length; j++){
                console.log(empresaNotifica.data[j])

                const contaDeAnuncio = await supabase
                    .from('empresas')
                    .select(`*`)
                    .eq('id', empresaNotifica.data[j].empresa_id) 
                
                if(contaDeAnuncio.data && contaDeAnuncio.data[j] && contaDeAnuncio.data[j].contaDeAnuncio){
                    const conta = contaDeAnuncio.data[j].contaDeAnuncio;
                    contaDeAnuncioArray.push(conta);
                }

                if (contaDeAnuncio.data && contaDeAnuncio.data[j] && contaDeAnuncio.data[j].contaDeAnuncio) {
                    try {
                        // Usar a conta específica da empresa em vez de hardcoded
                        const conversoes = await fetch(`https://graph.facebook.com/v23.0/act_${conta}/insights?fields=actions&time_range={"since":"${today}","until":"${today}"}&access_token=EAAKMZBbIAoCoBPJXG9kL2JUyS6WBU8ZADqX17cQwt7HqhUM6gaDmjy51ZCQUB8mNbD3qPqGdvb1BfZA7NAcm6zZBCvKl34d6yO0hOIeSmb3WKjaVtlmeZBfrTRZCTh95780p249AyttHrmTQRNUMpL81qh9kk0DhHzgaPBOaVpkg22fETWMI3TZCJZBgD0wZCtnoxx9ZCttI28ZD`);
                        const conversoesJson = await conversoes.json();

                        console.log(`Dados da conta ${conta}:`, conversoesJson);

                        if (conversoesJson.data && Array.isArray(conversoesJson.data)) {
                            const conversoesConta = conversoesJson.data.reduce((total, item) => {
                                const actions = item.actions || [];
                                const lead = actions.find(action => action.action_type === 'lead');
                                return total + (lead ? parseInt(lead.value) : 0);
                            }, 0);
                            
                            totalConversoes += conversoesConta;
                        }
                    } catch (error) {
                        console.error(`Erro ao buscar conversões da conta ${conta}:`, error);
                    }
                }
            }

            const numero = notificações.data[i].numero_destinatario;
            const nome = notificações.data[i].nome;
            const msg = `Notificação: ${nome}\nTotal de conversões hoje: ${totalConversoes}\n`;
            
            try {
                // Usar fetch nativo do Node.js em vez de UrlFetchApp
                const response = await fetch(`https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/133147/oma7bYgznono/`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        telefone: numero,
                        nome: nome,
                        mensagem: msg
                    })
                });
                
                const responseData = await response.json();
                console.log(`Notificação enviada para ${numero}:`, responseData);
            } catch (error) {
                console.error(`Erro ao enviar notificação para ${numero}:`, error);
            }
            
            console.log(`Total de conversões: ${totalConversoes}`);
        }

      return res.json(
          responseFormatter.success(null, 'Notificação enviada com sucesso.')
      );

  } catch (error) {
      console.error('Erro interno ao enviar notificação:', error);
      return res.status(500).json(
          responseFormatter.error('Erro interno do servidor.')
      );
  }
}
}
module.exports = NotificacaoController;