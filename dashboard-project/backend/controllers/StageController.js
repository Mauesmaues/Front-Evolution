const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');

/**
 * Controller para gerenciar stages (etapas) personalizados por empresa
 * Permite criar, editar e reordenar as colunas do Kanban CRM
 */
const StageController = {
  /**
   * Buscar stages de uma empresa
   * Se não existir, retorna stages padrão
   */
  async buscarStages(req, res) {
    try {
      const { empresaId } = req.params;

      console.log(`📋 [StageController] Buscando stages da empresa ${empresaId}`);

      // Verificar autenticação
      if (!req.session || !req.session.user) {
        return res.status(401).json(
          responseFormatter.error('Usuário não autenticado')
        );
      }

      const usuario = req.session.user;

      // Verificar permissão: USER só pode ver stages de suas empresas
      if (usuario.permissao === 'USER') {
        const { data: empresasUsuario, error: errorPermissao } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('usuario_id', usuario.id)
          .eq('empresa_id', empresaId);

        if (errorPermissao || !empresasUsuario || empresasUsuario.length === 0) {
          console.error('❌ [StageController] Usuário sem permissão para esta empresa');
          return res.status(403).json(
            responseFormatter.error('Você não tem permissão para acessar esta empresa')
          );
        }
      }

      // Buscar stages da empresa
      const { data: empresaStage, error } = await supabase
        .from('empresa_stages')
        .select('*')
        .eq('id_empresa', empresaId)
        .maybeSingle(); // Pode não existir registro

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('❌ [StageController] Erro ao buscar stages:', error);
        throw error;
      }

      // Se não existir, retornar stages padrão
      if (!empresaStage || !empresaStage.estagios) {
        console.log('ℹ️ [StageController] Empresa sem stages personalizados, retornando padrão');
        
        const stagesPadrao = [
          { id: 'entrou', nome: 'Entrou', cor: '#2196F3', ordem: 1 },
          { id: 'qualificado', nome: 'Qualificado', cor: '#FF9800', ordem: 2 },
          { id: 'conversao', nome: 'Conversão', cor: '#9C27B0', ordem: 3 },
          { id: 'ganho', nome: 'Ganho', cor: '#4CAF50', ordem: 4 }
        ];

        return res.status(200).json(
          responseFormatter.success(
            {
              id_empresa: parseInt(empresaId),
              estagios: stagesPadrao,
              is_padrao: true
            },
            'Stages padrão retornados'
          )
        );
      }

      console.log(`✅ [StageController] ${empresaStage.estagios.length} stages encontrados`);

      return res.status(200).json(
        responseFormatter.success(
          {
            id: empresaStage.id,
            id_empresa: empresaStage.id_empresa,
            estagios: empresaStage.estagios,
            is_padrao: false
          },
          'Stages encontrados'
        )
      );

    } catch (error) {
      console.error('❌ [StageController] Erro ao buscar stages:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao buscar stages: ' + error.message)
      );
    }
  },

  /**
   * Salvar/atualizar stages de uma empresa
   * Cria ou atualiza o registro na tabela empresa_stages
   */
  async salvarStages(req, res) {
    try {
      const { empresaId } = req.params;
      const { estagios } = req.body;

      console.log(`💾 [StageController] Salvando stages da empresa ${empresaId}`);
      console.log(`📊 [StageController] Total de stages: ${estagios?.length || 0}`);

      // Verificar autenticação
      if (!req.session || !req.session.user) {
        return res.status(401).json(
          responseFormatter.error('Usuário não autenticado')
        );
      }

      const usuario = req.session.user;

      // Validação
      if (!estagios || !Array.isArray(estagios) || estagios.length === 0) {
        return res.status(400).json(
          responseFormatter.error('Deve fornecer pelo menos um estágio')
        );
      }

      // Validar estrutura de cada stage
      for (let i = 0; i < estagios.length; i++) {
        const stage = estagios[i];
        if (!stage.id || !stage.nome || !stage.cor) {
          return res.status(400).json(
            responseFormatter.error(`Estágio na posição ${i} está incompleto (id, nome e cor são obrigatórios)`)
          );
        }
      }

      // Verificar se a empresa existe
      const { data: empresa, error: errorEmpresa } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('id', empresaId)
        .single();

      if (errorEmpresa || !empresa) {
        return res.status(400).json(
          responseFormatter.error(`Empresa com ID ${empresaId} não encontrada`)
        );
      }

      // Verificar permissão: USER só pode editar stages de suas empresas
      // ADMIN e GESTOR podem editar qualquer empresa
      if (usuario.permissao === 'USER') {
        const { data: empresasUsuario, error: errorPermissao } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('usuario_id', usuario.id)
          .eq('empresa_id', empresaId);

        if (errorPermissao || !empresasUsuario || empresasUsuario.length === 0) {
          console.error('❌ [StageController] Usuário sem permissão para esta empresa');
          return res.status(403).json(
            responseFormatter.error('Você não tem permissão para editar stages desta empresa')
          );
        }
      }

      // Verificar se já existe registro
      const { data: registroExistente } = await supabase
        .from('empresa_stages')
        .select('id')
        .eq('id_empresa', empresaId)
        .maybeSingle();

      let resultado;

      if (registroExistente) {
        // Atualizar
        console.log('🔄 [StageController] Atualizando stages existentes...');
        const { data, error } = await supabase
          .from('empresa_stages')
          .update({
            estagios: estagios
          })
          .eq('id_empresa', empresaId)
          .select()
          .single();

        if (error) throw error;
        resultado = data;
        console.log('✅ [StageController] Stages atualizados');

      } else {
        // Inserir
        console.log('➕ [StageController] Criando novos stages...');
        const { data, error } = await supabase
          .from('empresa_stages')
          .insert([{
            id_empresa: parseInt(empresaId),
            estagios: estagios
          }])
          .select()
          .single();

        if (error) throw error;
        resultado = data;
        console.log('✅ [StageController] Stages criados');
      }

      // Registrar log de auditoria
      console.log('📝 [StageController] Auditoria:', {
        empresa_id: empresaId,
        empresa_nome: empresa.nome,
        usuario: usuario.nome,
        usuario_id: usuario.id,
        total_stages: estagios.length,
        stages: estagios.map(s => s.nome).join(', ')
      });

      return res.status(200).json(
        responseFormatter.success(
          {
            id: resultado.id,
            id_empresa: resultado.id_empresa,
            estagios: resultado.estagios
          },
          'Stages salvos com sucesso'
        )
      );

    } catch (error) {
      console.error('❌ [StageController] Erro ao salvar stages:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao salvar stages: ' + error.message)
      );
    }
  },

  /**
   * Resetar stages para o padrão
   * Remove o registro customizado da empresa
   */
  async resetarStages(req, res) {
    try {
      const { empresaId } = req.params;

      console.log(`🔄 [StageController] Resetando stages da empresa ${empresaId} para padrão`);

      // Verificar autenticação
      if (!req.session || !req.session.user) {
        return res.status(401).json(
          responseFormatter.error('Usuário não autenticado')
        );
      }

      const usuario = req.session.user;

      // Verificar permissão
      if (usuario.permissao === 'USER') {
        const { data: empresasUsuario, error: errorPermissao } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('usuario_id', usuario.id)
          .eq('empresa_id', empresaId);

        if (errorPermissao || !empresasUsuario || empresasUsuario.length === 0) {
          return res.status(403).json(
            responseFormatter.error('Você não tem permissão para resetar stages desta empresa')
          );
        }
      }

      // Deletar registro customizado
      const { error } = await supabase
        .from('empresa_stages')
        .delete()
        .eq('id_empresa', empresaId);

      if (error) {
        console.error('❌ [StageController] Erro ao resetar:', error);
        throw error;
      }

      console.log('✅ [StageController] Stages resetados para padrão');

      // Retornar stages padrão
      const stagesPadrao = [
        { id: 'entrou', nome: 'Entrou', cor: '#2196F3', ordem: 1 },
        { id: 'qualificado', nome: 'Qualificado', cor: '#FF9800', ordem: 2 },
        { id: 'conversao', nome: 'Conversão', cor: '#9C27B0', ordem: 3 },
        { id: 'ganho', nome: 'Ganho', cor: '#4CAF50', ordem: 4 }
      ];

      return res.status(200).json(
        responseFormatter.success(
          {
            id_empresa: parseInt(empresaId),
            estagios: stagesPadrao,
            is_padrao: true
          },
          'Stages resetados para padrão'
        )
      );

    } catch (error) {
      console.error('❌ [StageController] Erro ao resetar stages:', error);
      return res.status(500).json(
        responseFormatter.error('Erro interno ao resetar stages: ' + error.message)
      );
    }
  }
};

module.exports = StageController;
