window.addEventListener('DOMContentLoaded', async function() {
async function usuarioSession() {
  try {
    const response = await fetch('/api/session-user');
    
    // Se não autenticado (401), redireciona para login
    if (response.status === 401) {
      console.log('Usuário não autenticado, redirecionando para login');
      window.location.href = '/login.html';
      return null;
    }
    
    const result = await response.json();
    if(result.usuario) {
      return result.usuario;
    }else{
      return null;
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    // Em caso de erro de rede, não redireciona automaticamente
    return null;
  }
}

let userSession = document.getElementById('headerLogin');
let usuarioSessao = await usuarioSession();
userSession.textContent = usuarioSessao?.nome || 'Usuário';

this.document.getElementById('sair').addEventListener('click', async function(ev) {
  ev.preventDefault();
  
  // Mostrar loading no botão
  LoadingUtils.buttonLoading(this, true);
  
  try {
    console.log("Sair clicado");
    await fetch('/api/sair', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'logout' })
    });
    
    LoadingUtils.buttonLoading(this, false);
    window.location.href = '/login.html';
  } catch (error) {
    LoadingUtils.buttonLoading(this, false);
    console.error('Erro ao fazer logout:', error);
    alert('Erro ao sair do sistema');
  }
});

try {
    let usuario = await usuarioSession();
    if (usuario && usuario.id) {
      // Buscar dados baseado na permissão do usuário
      let accountIds = [];
      
      if (usuario.permissao === 'USER') {
        // USER: apenas contas vinculadas
        const response = await fetch('/api/permission/' + usuario.id);
        const result = await response.json();
        accountIds = result.accountIds || [];
      } else if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
        // ADMIN e GESTOR: todas as contas
        const empresasResponse = await fetch('/api/buscarEmpresas');
        const empresasResult = await empresasResponse.json();
        if (empresasResult.success && empresasResult.data) {
          accountIds = empresasResult.data.map(empresa => empresa.contaDeAnuncio);
        }
      }
    }
  } catch (err) {
    console.error('Erro inesperado no carregamento de insights:', err);
  }    
  
  async function carregarEmpresasSelect() {
    try {
      // A API /api/buscarEmpresas já considera as permissões do usuário logado
      const response = await fetch('/api/buscarEmpresas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const resultado = await response.json();
      const empresas = Array.isArray(resultado.data) ? resultado.data : [];

      const select = document.getElementById('empresaFiltro');
      // Limpar opções existentes (exceto "Todas as empresas")
      const opcaoTodas = select.querySelector('option[value="todas"]');
      select.innerHTML = '';
      if (opcaoTodas) select.appendChild(opcaoTodas);
      
      empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  }

  carregarEmpresasSelect();
});

  async function testeCrm() {
    const response = await fetch('/api/testeCrm');
    const result = await response.json();
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const primeiroId = result.data[0].id;
      console.log('Primeiro ID:', primeiroId);
    } else {
      console.log('Nenhum dado retornado ou formato inesperado:', result);
    }
  }

  testeCrm();




