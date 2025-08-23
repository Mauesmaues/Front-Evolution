const PermissaoEnum = require('./PermissaoEnum');

class Usuario {
  constructor({ nome, email, senha, permissao, empresas = [] }) {
    this.nome = nome;
    this.email = email;
    this.senha = senha;
    this.permissao = permissao; // Use PermissaoEnum
    this.empresas = empresas; // Array de empresas
  }
}

module.exports = Usuario;
