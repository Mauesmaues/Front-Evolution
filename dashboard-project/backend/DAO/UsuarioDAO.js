const Usuario = require('../models/Usuario');
const supabase = require('../utils/supabaseCliente');

class UsuarioDAO {

  async criar(usuarioData) {
    try{
        const usuario = new Usuario(usuarioData);
        const {data, error} = await supabase
                    .from('usuario')
                    .insert(usuario)
                    .single();
        res.status(201).json(responseFormatter.success(data));

        if (error) throw error;
    }catch(error){
        res.status(500).json(responseFormatter.error('Erro ao criar empresa', error));
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
