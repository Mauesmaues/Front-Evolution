const usuarioDAO = require('../DAO/UsuarioDAO');
const PermissaoEnum = require('../models/PermissaoEnum');
const supabase = require('../utils/supabaseCliente');
const responseFormatter = require('../utils/responseFormatter');

const UsuarioController = {
  criarUsuario: async (req, res) => {
    try {
      const { nome, email, senha, permissao, empresas } = req.body;
      
      // Validação dos campos obrigatórios
      if (!nome || !email || !senha || !permissao) {
        return res.status(400).json({ erro: 'Todos os campos obrigatórios devem ser preenchidos.' });
      }
      
      // Validação da permissão
      if (!Object.values(PermissaoEnum).includes(permissao)) {
        return res.status(400).json({ erro: 'Permissão inválida.' });
      }
      
      // Validação de empresas para usuários não admin
      if (permissao !== 'ADMIN' && (!empresas || empresas.length === 0)) {
        return res.status(400).json({ erro: 'Usuários não administradores devem ter pelo menos uma empresa associada.' });
      }
      
      const usuario = await usuarioDAO.criar({ nome, email, senha, permissao, empresas });
      res.status(201).json({ success: true, data: usuario, mensagem: 'Usuário criado com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ erro: 'Erro interno do servidor: ' + error.message });
    }
  },

    login: async (req, res) => {
      const { email, password } = req.body;

      try {
        const { data: users, error } = await supabase
          .from('usuario')
          .select('*')
          .eq('email', email);

        if (error) {
          return res.status(500).json({ mensagem: 'Erro ao buscar usuário.' });
        }

        const user = (users && users.length > 0) ? users[0] : null;

        if (!user) {
          return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        if (user.senha !== password) {
          return res.status(401).json({ mensagem: 'Senha incorreta.' });
        }

        req.session.user = {
          id: user.id,
          nome: user.nome,
          email: user.email,
          permissao: user.permissao
        };

        return res.status(200).json({ sucesso: true });

      } catch (err) {
        console.error('Erro no login:', err);
        return res.status(500).json({ mensagem: 'Erro interno no servidor.' });
      }
    },

    usuarioSecao : async (req, res) => {
        if(req.session.user){
            res.json({usuario: req.session.user});
        }else{
            res.status(401).json({mensagem: "Não autenticado"});
        }
    },

  listarUsuarios: async (req, res) => {
    try {
      const usuarios = await usuarioDAO.listar();
      res.json({ success: true, data: usuarios, error: null });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ success: false, data: null, error: error.message });
    }
  },

  buscarUsuarioPorEmail: async (req, res) => {
    try {
      const { email } = req.params;
      const usuario = await usuarioDAO.buscarPorEmail(email);
      if (!usuario) {
        return res.status(404).json(responseFormatter.error('Usuário não encontrado.'));
      }
      res.json(responseFormatter.success(usuario, 'Usuário encontrado.'));
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json(responseFormatter.error('Erro interno do servidor: ' + error.message));
    }
  },

  atualizarUsuario: async (req, res) => {
    try {
      const { id } = req.params;
      const novosDados = req.body;
      
      console.log('🔧 [UsuarioController] Atualizar usuário - ID:', id);
      console.log('📦 [UsuarioController] Novos dados:', novosDados);
      
      // Validação da permissão se fornecida
      if (novosDados.permissao && !Object.values(PermissaoEnum).includes(novosDados.permissao)) {
        console.error('❌ [UsuarioController] Permissão inválida:', novosDados.permissao);
        return res.status(400).json(responseFormatter.error('Permissão inválida.'));
      }
      
      const usuario = await usuarioDAO.atualizar(id, novosDados);
      console.log('✅ [UsuarioController] Usuário atualizado:', usuario);
      res.json(responseFormatter.success(usuario, 'Usuário atualizado com sucesso.'));
    } catch (error) {
      console.error('❌ [UsuarioController] Erro ao atualizar usuário:', error);
      res.status(500).json(responseFormatter.error('Erro interno do servidor: ' + error.message));
    }
  },

  removerUsuario: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🗑️ [UsuarioController] Remover usuário - ID:', id);
      
      const usuario = await usuarioDAO.remover(id);
      console.log('✅ [UsuarioController] Usuário removido:', usuario);
      res.json(responseFormatter.success(usuario, 'Usuário removido com sucesso.'));
    } catch (error) {
      console.error('❌ [UsuarioController] Erro ao remover usuário:', error);
      res.status(500).json(responseFormatter.error('Erro interno do servidor: ' + error.message));
    }
  },

  adicionarEmpresaAoUsuario: async (req, res) => {
    try {
      const { usuarioId, empresaId } = req.body;
      
      console.log('🏢 [UsuarioController] Adicionar empresa ao usuário');
      console.log('📦 [UsuarioController] usuarioId:', usuarioId, 'empresaId:', empresaId);
      
      if (!usuarioId || !empresaId) {
        console.error('❌ [UsuarioController] IDs faltando');
        return res.status(400).json(responseFormatter.error('ID do usuário e ID da empresa são obrigatórios.'));
      }
      
      const resultado = await usuarioDAO.adicionarEmpresa(usuarioId, empresaId);
      console.log('✅ [UsuarioController] Empresa adicionada:', resultado);
      res.json(responseFormatter.success(resultado, 'Empresa adicionada ao usuário com sucesso.'));
    } catch (error) {
      console.error('❌ [UsuarioController] Erro ao adicionar empresa:', error);
      res.status(500).json(responseFormatter.error('Erro interno do servidor: ' + error.message));
    }
  },

  sair: (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ mensagem: 'Erro ao encerrar sessão.' });
      }
      res.status(200).json({ mensagem: 'Sessão encerrada com sucesso.' });
    });
  }
};

module.exports = UsuarioController;
