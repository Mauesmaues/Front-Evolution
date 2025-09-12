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

  listar() {
    return this.usuarios;
  }

  buscarPorEmail(email) {
    return this.usuarios.find(u => u.email === email);
  }

  atualizar(email, novosDados) {
    const usuario = this.buscarPorEmail(email);
    if (usuario) {
      Object.assign(usuario, novosDados);
      return usuario;
    }
    return null;
  }

  remover(email) {
    const index = this.usuarios.findIndex(u => u.email === email);
    if (index !== -1) {
      return this.usuarios.splice(index, 1)[0];
    }
    return null;
  }
}

module.exports = new UsuarioDAO();
