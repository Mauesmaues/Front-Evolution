const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');

const CrmController = {
  /**
   * Recebe leads de fontes externas (Google Sheets, Apps Script, etc)
   * Aceita qualquer estrutura de dados JSON
   * OBRIGATÓRIO: empresa_id nos dados enviados para permissionamento
   * Campos comuns mapeados automaticamente:
   * - nome, name, cliente, client -> nome
   * - email, e-mail, mail -> email
   * - telefone, phone, whatsapp, celular, tel -> telefone
   * - data_contato, data, date -> data_contato
   */
  receberLeadExterno: async (req, res) => {
    try {
      const dadosRecebidos = req.body;
      
      console.log('📥 [CrmController] Lead recebido de fonte externa');
      console.log('📦 [CrmController] Dados brutos:', JSON.stringify(dadosRecebidos, null, 2));

      // Validação básica
      if (!dadosRecebidos || Object.keys(dadosRecebidos).length === 0) {
        console.error('❌ [CrmController] Dados vazios ou inválidos');
        return res.status(400).json(
          responseFormatter.error('Dados do lead não podem estar vazios')
        );
      }

      // Validação OBRIGATÓRIA: empresa_id
      const empresaId = buscarCampo(dadosRecebidos, 'empresa_id');
      if (!empresaId) {
        console.error('❌ [CrmController] empresa_id não fornecido');
        return res.status(400).json(
          responseFormatter.error('Campo empresa_id é obrigatório nos dados do lead')
        );
      }

      // Verificar se a empresa existe
      const { data: empresa, error: errorEmpresa } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('id', empresaId)
        .single();

      if (errorEmpresa || !empresa) {
        console.error('❌ [CrmController] Empresa não encontrada:', empresaId);
        return res.status(400).json(
          responseFormatter.error(`Empresa com ID ${empresaId} não encontrada`)
        );
      }

      // Mapear campos dinamicamente
      const leadMapeado = mapearCamposLead(dadosRecebidos);
      
      console.log('🗺️ [CrmController] Lead mapeado:', leadMapeado);

      // Validação: pelo menos um campo de identificação
      if (!leadMapeado.nome && !leadMapeado.email && !leadMapeado.telefone) {
        console.error('❌ [CrmController] Lead sem dados de identificação');
        return res.status(400).json(
          responseFormatter.error('Lead deve ter pelo menos nome, email ou telefone')
        );
      }

      // Adicionar metadados
      leadMapeado.data_entrada = new Date().toISOString();
      leadMapeado.stage = 'entrou'; // Stage inicial do CRM
      leadMapeado.dados_originais = dadosRecebidos; // Guardar dados originais + empresa_id

      // Inserir no banco de dados
      const { data: leadInserido, error } = await supabase
        .from('leads')
        .insert([leadMapeado])
        .select()
        .single();

      if (error) {
        console.error('❌ [CrmController] Erro ao inserir no Supabase:', error);
        throw new Error(`Erro ao salvar lead: ${error.message}`);
      }

      console.log('✅ [CrmController] Lead salvo com sucesso - ID:', leadInserido.id);
      console.log('🏢 [CrmController] Empresa:', empresa.nome);

      return res.status(201).json(
        responseFormatter.success(
          {
            id: leadInserido.id,
            nome: leadInserido.nome,
            email: leadInserido.email,
            telefone: leadInserido.telefone,
            stage: leadInserido.stage,
            empresa: empresa.nome
          },
          'Lead recebido e salvo com sucesso'
        )
      );

    } catch (error) {
      console.error('❌ [CrmController] Erro ao processar lead:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao processar lead: ' + error.message)
      );
    }
  },

  /**
   * Recebe múltiplos leads de uma vez (batch)
   * Útil para sincronização em massa
   * OBRIGATÓRIO: empresa_id em cada lead
   */
  receberLeadsBatch: async (req, res) => {
    try {
      const { leads } = req.body;

      console.log('📥 [CrmController] Recebendo batch de leads');
      console.log('📊 [CrmController] Quantidade:', leads?.length || 0);

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json(
          responseFormatter.error('Deve enviar um array de leads no campo "leads"')
        );
      }

      // Validar empresa_id em todos os leads
      for (let i = 0; i < leads.length; i++) {
        const empresaId = buscarCampo(leads[i], 'empresa_id');
        if (!empresaId) {
          return res.status(400).json(
            responseFormatter.error(`Lead na posição ${i} não possui empresa_id`)
          );
        }
      }

      const leadsMapeados = leads.map(lead => {
        const mapeado = mapearCamposLead(lead);
        mapeado.data_entrada = new Date().toISOString();
        mapeado.stage = 'entrou';
        mapeado.dados_originais = lead; // Incluindo empresa_id
        return mapeado;
      });

      // Inserir todos de uma vez
      const { data: leadsInseridos, error } = await supabase
        .from('leads')
        .insert(leadsMapeados)
        .select('id, nome, email, telefone, stage');

      if (error) {
        console.error('❌ [CrmController] Erro ao inserir batch:', error);
        throw new Error(`Erro ao salvar leads: ${error.message}`);
      }

      console.log('✅ [CrmController] Batch salvo - Total:', leadsInseridos.length);

      return res.status(201).json(
        responseFormatter.success(
          {
            total: leadsInseridos.length,
            leads: leadsInseridos
          },
          `${leadsInseridos.length} leads recebidos e salvos com sucesso`
        )
      );

    } catch (error) {
      console.error('❌ [CrmController] Erro ao processar batch:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao processar batch: ' + error.message)
      );
    }
  },

  /**
   * Listar leads com permissionamento por empresa
   * - ADMIN/GESTOR: vê todos os leads
   * - USER: vê apenas leads das empresas que tem acesso
   */
  listarLeads: async (req, res) => {
    try {
      // Verificar autenticação
      if (!req.session || !req.session.user) {
        return res.status(401).json(
          responseFormatter.error('Usuário não autenticado')
        );
      }

      const usuario = req.session.user;
      console.log('📋 [CrmController] Listar leads - Usuário:', usuario.nome, '| Permissão:', usuario.permissao);

      let leads = [];

      if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
        // ADMIN e GESTOR: todos os leads
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('data_entrada', { ascending: false });

        if (error) {
          console.error('❌ [CrmController] Erro ao buscar leads:', error);
          throw error;
        }

        leads = data || [];
        console.log('✅ [CrmController] ADMIN/GESTOR - Total de leads:', leads.length);

      } else if (usuario.permissao === 'USER') {
        // USER: apenas leads das empresas que tem acesso
        
        // Buscar empresas do usuário
        const { data: empresasUsuario, error: errorEmpresas } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('usuario_id', usuario.id);

        if (errorEmpresas) {
          console.error('❌ [CrmController] Erro ao buscar empresas do usuário:', errorEmpresas);
          throw errorEmpresas;
        }

        const empresasIds = empresasUsuario.map(e => e.empresa_id.toString());
        console.log('🏢 [CrmController] USER - Empresas permitidas:', empresasIds);

        if (empresasIds.length === 0) {
          console.log('⚠️ [CrmController] Usuário sem empresas vinculadas');
          return res.status(200).json(
            responseFormatter.success([], 'Usuário não possui empresas vinculadas')
          );
        }

        // Buscar todos os leads e filtrar por empresa_id em JSONB
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('data_entrada', { ascending: false });

        if (error) {
          console.error('❌ [CrmController] Erro ao buscar leads:', error);
          throw error;
        }

        // Filtrar leads pela empresa_id no JSONB
        leads = (data || []).filter(lead => {
          const empresaIdLead = lead.dados_originais?.empresa_id?.toString();
          return empresasIds.includes(empresaIdLead);
        });

        console.log('✅ [CrmController] USER - Leads filtrados:', leads.length);
      }

      return res.status(200).json(
        responseFormatter.success(leads, `${leads.length} leads encontrados`)
      );

    } catch (error) {
      console.error('❌ [CrmController] Erro ao listar leads:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao listar leads: ' + error.message)
      );
    }
  },

  /**
   * Adicionar lead manualmente através do frontend
   * Valida permissões: usuário deve ter acesso à empresa do lead
   */
  adicionarLeadManual: async (req, res) => {
    try {
      // Verificar autenticação
      if (!req.session || !req.session.user) {
        return res.status(401).json(
          responseFormatter.error('Usuário não autenticado')
        );
      }

      const usuario = req.session.user;
      const { nome, email, telefone, empresa_id, dados_extras } = req.body;

      console.log('➕ [CrmController] Adicionar lead manual');
      console.log('👤 [CrmController] Usuário:', usuario.nome);
      console.log('📦 [CrmController] Dados:', { nome, email, telefone, empresa_id });

      // Validações básicas
      if (!nome || !empresa_id) {
        return res.status(400).json(
          responseFormatter.error('Nome e empresa_id são obrigatórios')
        );
      }

      if (!email && !telefone) {
        return res.status(400).json(
          responseFormatter.error('Deve fornecer pelo menos email ou telefone')
        );
      }

      // Verificar se a empresa existe
      const { data: empresa, error: errorEmpresa } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('id', empresa_id)
        .single();

      if (errorEmpresa || !empresa) {
        return res.status(400).json(
          responseFormatter.error(`Empresa com ID ${empresa_id} não encontrada`)
        );
      }

      // Verificar permissões: USER só pode adicionar em suas empresas
      if (usuario.permissao === 'USER') {
        const { data: empresasUsuario, error: errorPermissao } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('usuario_id', usuario.id)
          .eq('empresa_id', empresa_id);

        if (errorPermissao || !empresasUsuario || empresasUsuario.length === 0) {
          console.error('❌ [CrmController] Usuário sem permissão para esta empresa');
          return res.status(403).json(
            responseFormatter.error('Você não tem permissão para adicionar leads nesta empresa')
          );
        }
      }

      // Montar dados originais com empresa_id
      const dados_originais = {
        empresa_id: empresa_id.toString(),
        empresa: empresa.nome,
        origem: 'Manual - Frontend',
        criado_por: usuario.nome,
        criado_por_id: usuario.id,
        ...(dados_extras || {})
      };

      // Criar lead
      const novoLead = {
        nome: nome.trim(),
        email: email ? email.trim() : null,
        telefone: telefone ? telefone.trim() : null,
        data_contato: new Date().toISOString(),
        stage: 'entrou',
        data_entrada: new Date().toISOString(),
        dados_originais: dados_originais
      };

      const { data: leadInserido, error } = await supabase
        .from('leads')
        .insert([novoLead])
        .select()
        .single();

      if (error) {
        console.error('❌ [CrmController] Erro ao inserir lead:', error);
        throw new Error(`Erro ao salvar lead: ${error.message}`);
      }

      console.log('✅ [CrmController] Lead criado manualmente - ID:', leadInserido.id);

      return res.status(201).json(
        responseFormatter.success(
          leadInserido,
          'Lead adicionado com sucesso'
        )
      );

    } catch (error) {
      console.error('❌ [CrmController] Erro ao adicionar lead manual:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao adicionar lead: ' + error.message)
      );
    }
  },

  /**
   * Atualizar stage de um lead (usado no drag and drop do Kanban)
   */
  async atualizarStage(req, res) {
    try {
      const { id } = req.params;
      const { stage } = req.body;

      console.log(`🔄 [CrmController] Atualizando stage do lead ${id} para ${stage}`);

      // Validar campos obrigatórios
      if (!id) {
        return res.status(400).json(
          responseFormatter.error('ID do lead é obrigatório')
        );
      }

      if (!stage) {
        return res.status(400).json(
          responseFormatter.error('Stage é obrigatório')
        );
      }

      // ⭐ VALIDAÇÃO REMOVIDA: Com stages dinâmicos, qualquer valor é permitido
      // A validação agora é feita pelo StageController ao configurar stages
      // Antigo código (REMOVIDO):
      // const stagesValidos = ['entrou', 'qualificado', 'conversao', 'ganho'];
      // if (!stagesValidos.includes(stage)) { ... }

      // Verificar sessão do usuário
      const usuario = req.session.user; // ⚠️ CORRIGIDO: era req.session.usuario
      if (!usuario) {
        console.error('❌ [CrmController] Usuário não autenticado');
        return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
      }

      console.log(`👤 [CrmController] Usuário: ${usuario.nome} (${usuario.permissao})`);

      // Buscar o lead para verificar permissões
      const { data: lead, error: errorLead } = await supabase
        .from('leads')
        .select('id, dados_originais')
        .eq('id', id)
        .single();

      if (errorLead || !lead) {
        console.error('❌ [CrmController] Lead não encontrado:', errorLead);
        return res.status(404).json(
          responseFormatter.error('Lead não encontrado')
        );
      }

      // Extrair empresa_id do lead
      const empresa_id = lead.dados_originais?.empresa_id;
      if (!empresa_id) {
        return res.status(400).json(
          responseFormatter.error('Lead sem empresa_id vinculado')
        );
      }

      // Verificar permissão: USER só pode atualizar leads de suas empresas
      if (usuario.permissao === 'USER') {
        const { data: empresasUsuario, error: errorPermissao } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('usuario_id', usuario.id)
          .eq('empresa_id', empresa_id);

        if (errorPermissao || !empresasUsuario || empresasUsuario.length === 0) {
          console.error('❌ [CrmController] Usuário sem permissão para este lead');
          return res.status(403).json(
            responseFormatter.error('Você não tem permissão para atualizar este lead')
          );
        }
      }

      // Atualizar o stage no banco
      const { data: leadAtualizado, error } = await supabase
        .from('leads')
        .update({ 
          stage: stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [CrmController] Erro ao atualizar stage:', error);
        
        // Mensagem específica para constraint de stage
        if (error.code === '23514' && error.message.includes('leads_stage_check')) {
          return res.status(400).json(
            responseFormatter.error(
              '⚠️ ERRO DE CONSTRAINT: A tabela leads tem uma constraint que valida apenas stages antigos (entrou, agendou, analisando, fechou). ' +
              'Para usar stages personalizados, execute o script: docs/fix-stage-constraint.sql no banco de dados. ' +
              'Este script remove a constraint e permite qualquer valor de stage.'
            )
          );
        }
        
        throw new Error(`Erro ao atualizar stage: ${error.message}`);
      }

      console.log(`✅ [CrmController] Stage atualizado - Lead ${id} -> ${stage}`);

      return res.status(200).json(
        responseFormatter.success(
          leadAtualizado,
          'Stage atualizado com sucesso'
        )
      );

    } catch (error) {
      console.error('❌ [CrmController] Erro ao atualizar stage:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao atualizar stage: ' + error.message)
      );
    }
  },

  /**
   * Marca um lead como qualificado para otimização de campanhas
   * Este endpoint é usado quando o usuário identifica um lead de alta qualidade
   * e deseja que a plataforma otimize para encontrar leads similares
   */
  async marcarLeadQualificado(req, res) {
    try {
      const { id } = req.params;
      const { qualificado, timestamp } = req.body;

      console.log(`⭐ [CrmController] Marcando lead ${id} como qualificado`);

      // Validar campos obrigatórios
      if (!id) {
        return res.status(400).json(
          responseFormatter.error('ID do lead é obrigatório')
        );
      }

      // Verificar sessão do usuário
      const usuario = req.session.user; // ⚠️ CORRIGIDO: era req.session.usuario
      if (!usuario) {
        console.error('❌ [CrmController] Usuário não autenticado');
        return res.status(401).json(responseFormatter.error('Usuário não autenticado'));
      }

      console.log(`👤 [CrmController] Usuário: ${usuario.nome} (${usuario.permissao})`);

      // Buscar o lead para verificar permissões e obter dados completos
      const { data: lead, error: errorLead } = await supabase
        .from('leads')
        .select('id, nome, email, telefone, dados_originais, stage')
        .eq('id', id)
        .single();

      if (errorLead || !lead) {
        console.error('❌ [CrmController] Lead não encontrado:', errorLead);
        return res.status(404).json(
          responseFormatter.error('Lead não encontrado')
        );
      }

      // Extrair empresa_id do lead
      const empresa_id = lead.dados_originais?.empresa_id;
      if (!empresa_id) {
        return res.status(400).json(
          responseFormatter.error('Lead sem empresa_id vinculado')
        );
      }

      // Verificar permissão: USER só pode marcar leads de suas empresas
      if (usuario.permissao === 'USER') {
        const { data: empresasUsuario, error: errorPermissao } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('usuario_id', usuario.id)
          .eq('empresa_id', empresa_id);

        if (errorPermissao || !empresasUsuario || empresasUsuario.length === 0) {
          console.error('❌ [CrmController] Usuário sem permissão para este lead');
          return res.status(403).json(
            responseFormatter.error('Você não tem permissão para marcar este lead')
          );
        }
      }

      // Atualizar o lead no banco com flag de qualificado
      const dadosAtualizacao = {
        ...lead.dados_originais,
        qualificado: true,
        data_qualificacao: timestamp || new Date().toISOString(),
        qualificado_por: usuario.nome,
        qualificado_por_id: usuario.id
      };

      const { data: leadAtualizado, error } = await supabase
        .from('leads')
        .update({ 
          dados_originais: dadosAtualizacao,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [CrmController] Erro ao marcar lead como qualificado:', error);
        throw new Error(`Erro ao marcar lead como qualificado: ${error.message}`);
      }

      console.log(`✅ [CrmController] Lead ${id} marcado como qualificado por ${usuario.nome}`);

      // TODO: Aqui você pode adicionar integração com APIs de anúncios
      // Exemplos:
      // - Facebook Conversions API
      // - Google Ads Conversion Tracking
      // - TikTok Pixel
      // 
      // Enviar dados do lead qualificado para otimização de campanhas:
      // await enviarParaFacebookConversions(lead, empresa_id);
      // await enviarParaGoogleAds(lead, empresa_id);

      // Registrar log de atividade
      console.log('📊 [CrmController] Dados do lead qualificado:', {
        lead_id: id,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        stage: lead.stage,
        empresa_id: empresa_id,
        qualificado_por: usuario.nome
      });

      return res.status(200).json(
        responseFormatter.success(
          {
            lead: leadAtualizado,
            mensagem: 'Lead marcado como qualificado. A plataforma irá otimizar para encontrar leads similares.'
          },
          'Lead qualificado com sucesso'
        )
      );

    } catch (error) {
      console.error('❌ [CrmController] Erro ao marcar lead como qualificado:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao marcar lead como qualificado: ' + error.message)
      );
    }
  }
};

/**
 * Mapeia campos de diferentes formatos para o padrão do sistema
 * Aceita nomes de campos em português, inglês, com ou sem acentos
 */
function mapearCamposLead(dados) {
  const lead = {};

  // Mapear NOME
  const camposNome = ['nome', 'name', 'cliente', 'client', 'contact', 'contato', 'lead_name'];
  for (const campo of camposNome) {
    const valor = buscarCampo(dados, campo);
    if (valor) {
      lead.nome = valor;
      break;
    }
  }

  // Mapear EMAIL
  const camposEmail = ['email', 'e-mail', 'mail', 'email_address', 'lead_email'];
  for (const campo of camposEmail) {
    const valor = buscarCampo(dados, campo);
    if (valor) {
      lead.email = valor;
      break;
    }
  }

  // Mapear TELEFONE
  const camposTelefone = ['telefone', 'phone', 'whatsapp', 'celular', 'tel', 'mobile', 'contact_number', 'lead_phone'];
  for (const campo of camposTelefone) {
    const valor = buscarCampo(dados, campo);
    if (valor) {
      lead.telefone = valor;
      break;
    }
  }

  // Mapear DATA DE CONTATO
  const camposData = ['data', 'date', 'data_contato', 'contact_date', 'created_at'];
  for (const campo of camposData) {
    const valor = buscarCampo(dados, campo);
    if (valor) {
      lead.data_contato = valor;
      break;
    }
  }

  return lead;
}

/**
 * Busca campo ignorando case e acentos
 */
function buscarCampo(objeto, nomeCampo) {
  const nomeLower = nomeCampo.toLowerCase();
  
  for (const [chave, valor] of Object.entries(objeto)) {
    if (chave.toLowerCase() === nomeLower && valor !== null && valor !== undefined && valor !== '') {
      return typeof valor === 'string' ? valor.trim() : valor;
    }
  }
  
  return null;
}

module.exports = CrmController;
