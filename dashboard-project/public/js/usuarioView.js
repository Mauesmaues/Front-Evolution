

document.addEventListener('DOMContentLoaded', function() {
  // Carregar opções quando a página carrega
  carregarPermissoes();
  carregarEmpresas();

  const botaoSalvarUsuario = document.getElementById('salvarUsuario');
  botaoSalvarUsuario.addEventListener('click', async function(event) {
    event.preventDefault();

    const nome = document.getElementById('nomeUsuario').value;
    const email = document.getElementById('emailUsuario').value;
    const senha = document.getElementById('senhaUsuario').value;
    const permissao = document.getElementById('permissaoSelect').value;
    const empresaSelecionada = document.getElementById('empresaSelect').value;

    // Validação
    if (!nome || !email || !senha || !permissao) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validação específica para não administradores
    if (permissao !== 'ADMIN' && !empresaSelecionada) {
      alert('Por favor, selecione uma empresa para usuários não administradores.');
      return;
    }

    // Preparar dados do usuário
    const novoUsuario = {
      nome: nome,
      email: email,
      senha: senha,
      permissao: permissao,
      empresas: permissao === 'ADMIN' ? [] : [parseInt(empresaSelecionada)]
    };

    try {
      // Mostrar loading
      LoadingUtils.buttonLoading(botaoSalvarUsuario, true, 'Salvando...');
      
      const response = await fetch('/api/criarUsuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoUsuario)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Usuário criado com sucesso!');
        limparFormulario();
        console.log('Usuário salvo com sucesso:', data);
      } else {
        alert('Erro ao criar usuário: ' + (data.erro || data.mensagem || 'Erro desconhecido'));
        console.error('Erro na resposta:', data);
      }
    } catch (error) {
      alert('Erro de conexão ao salvar usuário.');
      console.error('Erro ao salvar usuário:', error);
    } finally {
      // Parar loading
      LoadingUtils.buttonLoading(botaoSalvarUsuario, false, 'Salvar');
    }
  });
});

// Função para carregar permissões
async function carregarPermissoes() {
  const permissaoSelect = document.getElementById('permissaoSelect');
  
  // Adicionar opções de permissão (baseado no PermissaoEnum do banco)
  const permissoes = [
    { value: 'ADMIN', text: 'Administrador' },
    { value: 'GESTOR', text: 'Gestor' },
    { value: 'USER', text: 'Usuário' }
  ];
  
  permissoes.forEach(permissao => {
    const option = document.createElement('option');
    option.value = permissao.value;
    option.textContent = permissao.text;
    permissaoSelect.appendChild(option);
  });
  
  // Listener para mostrar/ocultar empresa baseado na permissão
  permissaoSelect.addEventListener('change', function() {
    const empresaGroup = document.getElementById('empresaSelect').closest('.form-group');
    if (this.value === 'ADMIN') {
      empresaGroup.style.display = 'none';
    } else {
      empresaGroup.style.display = 'block';
    }
  });
}

// Função para carregar empresas
async function carregarEmpresas() {
  const empresaSelect = document.getElementById('empresaSelect');
  
  try {
    // Adicionar loading option
    empresaSelect.innerHTML = '<option value="">Carregando empresas...</option>';
    
    const response = await fetch('/api/buscarEmpresas');
    const data = await response.json();
    
    // Limpar loading option
    empresaSelect.innerHTML = '<option value="">Selecione uma empresa</option>';
    
    if (data.success && data.data) {
      data.data.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        empresaSelect.appendChild(option);
      });
    } else {
      empresaSelect.innerHTML = '<option value="">Erro ao carregar empresas</option>';
    }
  } catch (error) {
    console.error('Erro ao carregar empresas:', error);
    empresaSelect.innerHTML = '<option value="">Erro ao carregar empresas</option>';
  }
}

// Função para limpar formulário
function limparFormulario() {
  document.getElementById('nomeUsuario').value = '';
  document.getElementById('emailUsuario').value = '';
  document.getElementById('senhaUsuario').value = '';
  document.getElementById('permissaoSelect').value = '';
  document.getElementById('empresaSelect').value = '';
}