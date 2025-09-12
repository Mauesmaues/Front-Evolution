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

  listarUsuarios: (req, res) => {
    const usuarios = usuarioDAO.listar();
    res.json(usuarios);
  },

  buscarUsuarioPorEmail: (req, res) => {
    const { email } = req.params;
    const usuario = usuarioDAO.buscarPorEmail(email);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json(usuario);
  },

  atualizarUsuario: (req, res) => {
    const { email } = req.params;
    const novosDados = req.body;
    const usuario = usuarioDAO.atualizar(email, novosDados);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json(usuario);
  },

  removerUsuario: (req, res) => {
    const { email } = req.params;
    const usuario = usuarioDAO.remover(email);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json({ mensagem: 'Usuário removido com sucesso.', usuario });
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
