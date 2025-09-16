const Usuario = require('../models/Usuario');
const supabase = require('../utils/supabaseCliente');

class UsuarioDAO {

  // Cria um novo usuário e associa empresas se necessário
  async criar(usuarioData) {
    try {
      // Instancia o modelo de usuário
      const usuario = new Usuario(usuarioData);

      // Formata os dados para inserir no banco
      const usuarioFormatter = {
        nome: usuario.nome,
        email: usuario.email,
        senha: usuario.senha,
        permissao: usuario.permissao,
      };

      // Insere o usuário na tabela 'usuario'
      const { data, error } = await supabase
        .from('usuario')
        .insert(usuarioFormatter)
        .select()
        .single();

      if (error) throw error;

      // Se o usuário não for admin, associa empresas
      if (usuario.permissao !== 'ADMIN' && usuarioData.empresas) {
        for (const empresaId of usuarioData.empresas) {
          const { error: relError } = await supabase
            .from('usuario_empresa')
            .insert({ usuario_id: data.id, empresa_id: empresaId });
          if (relError) throw relError;
        }
      }

      // Retorna os dados do usuário criado
      return data;
    } catch (error) {
      // Lança erro com mensagem personalizada
      throw new Error(`Erro ao criar usuario: ${error.message}`);
    }
  }

  // Busca todos os usuários do banco com suas empresas associadas
  async listar() {
    try {
      // Primeiro, testar apenas listagem básica de usuários
      const { data: usuarios, error } = await supabase
        .from('usuario')
        .select('id, nome, email, permissao')
        .order('nome');

      if (error) throw error;

      // Por enquanto, retornar usuários sem empresas para testar
      const usuariosComEmpresas = usuarios.map(usuario => ({
        ...usuario,
        empresas: [] // Temporariamente vazio para testar
      }));

      return usuariosComEmpresas;
    } catch (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
  }

  async buscarPorEmail(email) {
    try {
      const { data: usuarios, error } = await supabase
        .from('usuario')
        .select(`
          id,
          nome,
          email,
          permissao,
          usuario_empresa (
            empresa (
              id,
              nome
            )
          )
        `)
        .eq('email', email);

      if (error) throw error;

      if (!usuarios || usuarios.length === 0) {
        return null;
      }

      const usuario = usuarios[0];
      return {
        ...usuario,
        empresas: usuario.usuario_empresa?.map(rel => rel.empresa) || []
      };
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  async atualizar(id, novosDados) {
    try {
      const { nome, email, permissao, empresas } = novosDados;
      
      // Atualizar dados básicos do usuário
      const { data: usuario, error } = await supabase
        .from('usuario')
        .update({ nome, email, permissao })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Se empresas foram fornecidas e o usuário não é ADMIN, atualizar associações
      if (empresas && permissao !== 'ADMIN') {
        // Remover associações existentes
        await supabase
          .from('usuario_empresa')
          .delete()
          .eq('usuario_id', id);

        // Adicionar novas associações
        for (const empresaId of empresas) {
          const { error: relError } = await supabase
            .from('usuario_empresa')
            .insert({ usuario_id: id, empresa_id: empresaId });
          if (relError) throw relError;
        }
      }

      return usuario;
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  async remover(id) {
    try {
      // Primeiro remover associações com empresas
      await supabase
        .from('usuario_empresa')
        .delete()
        .eq('usuario_id', id);

      // Depois remover o usuário
      const { data: usuario, error } = await supabase
        .from('usuario')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return usuario;
    } catch (error) {
      throw new Error(`Erro ao remover usuário: ${error.message}`);
    }
  }

  // Método para adicionar empresa a um usuário existente
  async adicionarEmpresa(usuarioId, empresaId) {
    try {
      const { data, error } = await supabase
        .from('usuario_empresa')
        .insert({ usuario_id: usuarioId, empresa_id: empresaId })
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`Erro ao adicionar empresa ao usuário: ${error.message}`);
    }
  }
}

module.exports = new UsuarioDAO();
