window.addEventListener('DOMContentLoaded', function() {
// Verificar permissões do usuário e configurar interface
verificarPermissoesEConfigurarInterface();

//Seleção de painel
const painelMonitoramento = document.getElementById('painelMonitoramento');
const painelAdministracao = document.getElementById('painelAdministracao');
const painelCRM = document.getElementById('crmSection');
const painelNotificacoes = document.getElementById('painelNotificacoes');
const painelMetricasVideo = document.getElementById('painelMetricasVideo');
const painelProposta = document.getElementById('painelProposta');

const btnDashboard = document.getElementById('dashboard');
const btnAdministracao = document.getElementById('administracao');
const btnCRM = document.getElementById('crm');
const btnNotificacoes = document.getElementById('Notificacoes');
const btnMetricasVideo = document.getElementById('metricasVideo');
const btnProposta = document.getElementById('proposta');

// Função centralizada para esconder todos os painéis
function esconderTodosPaineis() {
  // Esconder painéis
  painelMonitoramento.style.setProperty('display', 'none');
  painelMonitoramento.dataset.theme = "default";
  
  painelAdministracao.style.setProperty('display', 'none');
  painelAdministracao.dataset.theme = "default";
  
  painelCRM.style.setProperty('display', 'none');
  painelCRM.dataset.theme = "default";
  
  painelNotificacoes.style.setProperty('display', 'none');
  painelNotificacoes.dataset.theme = "default";
  
  painelMetricasVideo.style.setProperty('display', 'none');
  painelMetricasVideo.dataset.theme = "default";

  //Resetar Proposta
  if (painelProposta) {
    painelProposta.style.setProperty('display', 'none');
    painelProposta.dataset.theme = "default";
  }

  // Resetar botões - remover background-color E classe active
  btnDashboard.style.setProperty('background-color', 'transparent');
  btnDashboard.classList.remove('active');

  if (btnAdministracao) {
    btnAdministracao.style.setProperty('background-color', 'transparent');
    btnAdministracao.classList.remove('active');
  }

  if (btnCRM) {
    btnCRM.style.setProperty('background-color', 'transparent');
    btnCRM.classList.remove('active');
  }

  if (btnNotificacoes) {
    btnNotificacoes.style.setProperty('background-color', 'transparent');
    btnNotificacoes.classList.remove('active');
  }

  if (btnMetricasVideo) {
    btnMetricasVideo.style.setProperty('background-color', 'transparent');
    btnMetricasVideo.classList.remove('active');
  }

  if (btnProposta) {
    btnProposta.style.setProperty('background-color', 'transparent');
    btnProposta.classList.remove('active');
  }

  // Esconder formulários
  const formEmpresa = document.getElementById('FormCadastroEmpresa');
  const formUsuario = document.getElementById('FormCadastroUsuario');
  if (formEmpresa) formEmpresa.style.display = 'none';
  if (formUsuario) formUsuario.style.display = 'none';
}

//Painel administrção
document.getElementById('administracao').addEventListener('click', function(ev) {
  ev.preventDefault();
  
  if(painelAdministracao.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelAdministracao.dataset.theme = "ativo";
    painelAdministracao.style.setProperty('display', 'flex');
    btnAdministracao.style.setProperty('background-color', '#dde9f5ff');
    btnAdministracao.classList.add('active');

    // Inicializar com aba de empresas ativa
    document.getElementById('subAbaUsuario').style.display = 'none';
    document.getElementById('subAbaEmpresas').style.display = 'flex';
    
    // Configurar botão para modo empresa
    const btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    btnAdicionarSubAbaAdmin.innerHTML = '<i class="fas fa-plus"></i>Adicionar Empresa';
    btnAdicionarSubAbaAdmin.dataset.theme = "empresa";
    
    // Ativar visualmente a aba empresa
    document.getElementById('abaEmpresas').classList.add('active');
    document.getElementById('abaUsuario').classList.remove('active');

    carregarEmpresasCadastradas();
    refreshDados("cadastradas");
  }
});

//Painel DashBoard
document.getElementById('dashboard').addEventListener('click', function(ev) {
  ev.preventDefault();
  console.log("função ativa");

  if(painelMonitoramento.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelMonitoramento.dataset.theme = "ativo";
    painelMonitoramento.style.setProperty('display', 'flex');
    btnDashboard.style.setProperty('background-color', '#dde9f5ff');
    btnDashboard.classList.add('active');
  }
});

this.document.getElementById('metricasVideo').addEventListener('click', function(ev) {
  ev.preventDefault();

  if(painelMetricasVideo.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelMetricasVideo.dataset.theme = "ativo";
    painelMetricasVideo.style.setProperty('display', 'flex');
    btnMetricasVideo.style.setProperty('background-color', '#dde9f5ff');
    btnMetricasVideo.classList.add('active');
  }
});

document.getElementById('proposta').addEventListener('click', function(ev){
  ev.preventDefault();
  console.log("Botão Proposta clicado - função ativa");

  if(painelProposta && painelProposta.dataset.theme === "default") {
    esconderTodosPaineis();

    painelProposta.dataset.theme = "ativo";
    painelProposta.style.setProperty('display', 'flex');
    if (btnProposta) {
      btnProposta.style.setProperty('background-color', '#dde9f5ff');
      btnProposta.classList.add('active');
    }
    
    // Inicializar sistema de propostas se não estiver inicializado
    setTimeout(() => {
      if (typeof propostaManager === 'undefined' || !propostaManager) {
        if (typeof PropostaManager !== 'undefined') {
          propostaManager = new PropostaManager();
          console.log("Sistema de propostas inicializado");
        } else {
          console.error("Classe PropostaManager não encontrada");
        }
      }
    }, 100);
    
    console.log("Painel Proposta ativado");
  } else {
    console.log("Painel Proposta já está ativo ou elemento não encontrado");
  }
});

//Painel CRM
document.getElementById('crm').addEventListener('click', function(ev) {

  ev.preventDefault();
  console.log("função ativa");

  if(painelCRM.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelCRM.dataset.theme = "ativo";
    painelCRM.style.setProperty('display', 'flex');
    btnCRM.style.setProperty('background-color', '#dde9f5ff');
    btnCRM.classList.add('active');
    
    // Adicionar header do CRM se não existir
    adicionarHeaderCRM();
    
    // Carregar leads após exibir o painel
    setTimeout(() => {
      if (typeof carregarLeadsCRM === 'function') {
        carregarLeadsCRM();
      }
    }, 100);
  }
});

//Painel Notificações
document.getElementById('Notificacoes').addEventListener('click', function(ev) {
  ev.preventDefault();

  console.log("função ativa");
  if(painelNotificacoes.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelNotificacoes.dataset.theme = "ativo";
    painelNotificacoes.style.setProperty('display', 'flex');
    btnNotificacoes.style.setProperty('background-color', '#dde9f5ff');
    btnNotificacoes.classList.add('active');
  }
});

document.getElementById('abaUsuario').addEventListener('click', function(ev){
    ev.preventDefault();
    let btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    let subAbaEmpresas = document.getElementById('subAbaEmpresas');
    let subAbaUsuario = document.getElementById('subAbaUsuario');
    
    // Sempre alterar para mode usuário, independente do estado atual
    btnAdicionarSubAbaAdmin.innerHTML = '<i class="fas fa-plus"></i>Adicionar Usuario';
    btnAdicionarSubAbaAdmin.dataset.theme = "usuario";

    // Esconder aba de empresas e mostrar aba de usuários
    subAbaEmpresas.style.setProperty('display', 'none');
    subAbaUsuario.style.setProperty('display', 'flex');
    
    // Ativar estilo do botão usuário
    document.getElementById('abaUsuario').classList.add('active');
    document.getElementById('abaEmpresas').classList.remove('active');
    
    // Carregar lista de usuários quando a aba for ativada
    carregarUsuariosCadastrados();
})

document.getElementById('abaEmpresas').addEventListener('click', function(ev){
    ev.preventDefault();
    let btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    let subAbaUsuario = document.getElementById('subAbaUsuario');
    let subAbaEmpresas = document.getElementById('subAbaEmpresas');

    // Sempre alterar para mode empresa, independente do estado atual
    btnAdicionarSubAbaAdmin.innerHTML = '<i class="fas fa-plus"></i>Adicionar Empresa';
    btnAdicionarSubAbaAdmin.dataset.theme = "empresa";
    
    // Esconder aba de usuários e mostrar aba de empresas
    subAbaUsuario.style.setProperty('display', 'none');
    subAbaEmpresas.style.setProperty('display', 'flex');
    
    // Ativar estilo do botão empresa
    document.getElementById('abaEmpresas').classList.add('active');
    document.getElementById('abaUsuario').classList.remove('active');
    
    // Carregar lista de empresas
    carregarEmpresasCadastradas();
    refreshDados("cadastradas");
})

async function carregarEmpresasSelect() {
    try {
      LoadingUtils.showOverlay('Carregando empresas...');
      
      // A API /api/buscarEmpresas já considera as permissões do usuário logado
      const response = await fetch('/api/buscarEmpresas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const resultado = await response.json();
      const empresas = Array.isArray(resultado.data) ? resultado.data : [];

      const select = document.getElementById('empresaSelect');
      // Limpar opções existentes
      select.innerHTML = '<option value="">Selecione uma empresa</option>';
      
      empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        select.appendChild(option);
      });
      
      LoadingUtils.hideOverlay();
    } catch (error) {
      LoadingUtils.hideOverlay();
      console.error('Erro ao carregar empresas:', error);
    }
}

const PermissaoEnum = {
    ADMIN: 'ADMIN',
    GESTOR: 'GESTOR',
    USER: 'USER'
  };

// Função para verificar permissões e configurar interface
async function verificarPermissoesEConfigurarInterface() {
  try {
    const response = await fetch('/api/session-user');
    if (response.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    
    const { usuario } = await response.json();
    if (!usuario) {
      window.location.href = '/login.html';
      return;
    }

    // Configurar interface baseado na permissão
    configurarInterfacePorPermissao(usuario.permissao);
    
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    // Em caso de erro de rede, não redireciona automaticamente
  }
}

// Função para configurar interface baseado na permissão
function configurarInterfacePorPermissao(permissao) {
  const administracaoLi = document.getElementById('administracao');
  const subAbasAdmin = document.getElementById('subAbasAdmin');
  const btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
  const notificacoesLi = document.getElementById('Notificacoes');
  const propostaLi = document.getElementById('proposta');
  
  if (permissao === 'USER') {
    // USER: Ocultar painel de administração, notificações e proposta
    if (administracaoLi) {
      administracaoLi.style.display = 'none';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'none';
    }
    if (propostaLi) {
      propostaLi.style.display = 'none';
    }
  } else if (permissao === 'GESTOR') {
    // GESTOR: Mostrar administração, notificações e proposta, mas ocultar criação de usuários
    if (administracaoLi) {
      administracaoLi.style.display = 'block';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'block';
    }
    if (propostaLi) {
      propostaLi.style.display = 'block';
    }
    // Ocultar aba de usuários para gestores
    const abaUsuario = document.getElementById('abaUsuario');
    if (abaUsuario) {
      abaUsuario.style.display = 'none';
    }
  } else if (permissao === 'ADMIN') {
    // ADMIN: Acesso total
    if (administracaoLi) {
      administracaoLi.style.display = 'block';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'block';
    }
    if (propostaLi) {
      propostaLi.style.display = 'block';
    }
  }
}

  function carregarPermissoes() {
    const select = document.getElementById('permissaoSelect');
    Object.entries(PermissaoEnum).forEach(([key, value]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = key.charAt(0) + key.slice(1).toLowerCase(); // Ex: Admin, Gestor...
      select.appendChild(option);
    });
  }


document.getElementById('btnAdicionarSubAbaAdmin').addEventListener('click', function(ev) {
    console.log("botão adicionar em sub aba admin foi ativo");
    console.log("Theme:", ev.currentTarget.dataset.theme);
    
    if(ev.currentTarget.dataset.theme === "empresa"){
        // Abrir modal de criar empresa
        console.log("Abrindo modal de empresa");
        const modalElement = document.getElementById('modalCriarEmpresa');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error("Modal de empresa não encontrado");
        }
    }else{
        // Abrir modal de criar usuário
        console.log("Abrindo modal de usuário");
        const modalElement = document.getElementById('modalCriarUsuario');
        if (modalElement) {
            try {
                carregarEmpresasUsuarioModal();
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } catch (error) {
                console.error("Erro ao abrir modal de usuário:", error);
            }
        } else {
            console.error("Modal de usuário não encontrado");
        }
    }
});

// Event listeners para os novos modais
document.getElementById('btnSalvarEmpresa').addEventListener('click', async function(ev) {
    try {
        ev.preventDefault();
        console.log("função de salvar empresa ativa");

        // Mostrar loading no botão
        const btnOriginal = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
        this.disabled = true;

        let nome = document.getElementById('nomeEmpresaModal').value;
        let contaDeAnuncio = document.getElementById('idContaAnuncioModal').value;

        if (!nome || !contaDeAnuncio) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        let empresa = {
            nome: nome,
            contaDeAnuncio: contaDeAnuncio
        };

        const response = await fetch('/api/criarEmpresa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(empresa)
        });

        const data = await response.json();

        if (response.ok) {
            toastUtils.showToast('Empresa criada com sucesso!', 'success');
            // Limpar formulário
            document.getElementById('formCriarEmpresa').reset();
            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCriarEmpresa')).hide();
            // Recarregar lista
            carregarEmpresas();
        } else {
            throw new Error(data.erro || 'Erro ao criar empresa');
        }

    } catch (error) {
        console.error('Erro ao salvar empresa:', error);
        toastUtils.showToast(error.message || 'Erro ao salvar empresa', 'error');
    } finally {
        // Restaurar botão
        this.innerHTML = btnOriginal;
        this.disabled = false;
    }
});

document.getElementById('btnSalvarUsuario').addEventListener('click', async function(ev) {
    try {
        ev.preventDefault();
        console.log("função de salvar usuário ativa");

        // Mostrar loading no botão
        const btnOriginal = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
        this.disabled = true;

        let nome = document.getElementById('nomeUsuarioModal').value;
        let email = document.getElementById('emailUsuarioModal').value;
        let senha = document.getElementById('senhaUsuarioModal').value;
        let permissao = document.getElementById('permissaoUsuarioModal').value;

        if (!nome || !email || !senha || !permissao) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Coletar empresas selecionadas
        const empresasCheckboxes = document.querySelectorAll('#empresasUsuarioCheckboxes input[type="checkbox"]:checked');
        const empresas = Array.from(empresasCheckboxes).map(cb => parseInt(cb.value));

        if (permissao !== 'ADMIN' && empresas.length === 0) {
            alert('Usuários não administradores devem ter pelo menos uma empresa vinculada');
            return;
        }

        let usuario = {
            nome: nome,
            email: email,
            senha: senha,
            permissao: permissao,
            empresas: empresas
        };

        const response = await fetch('/api/criarUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuario)
        });

        const data = await response.json();

        if (response.ok) {
            toastUtils.showToast('Usuário criado com sucesso!', 'success');
            // Limpar formulário
            document.getElementById('formCriarUsuario').reset();
            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCriarUsuario')).hide();
            // Recarregar lista (se houver)
            // carregarUsuarios(); // Implementar se necessário
        } else {
            throw new Error(data.erro || 'Erro ao criar usuário');
        }

    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        toastUtils.showToast(error.message || 'Erro ao salvar usuário', 'error');
    } finally {
        // Restaurar botão
        this.innerHTML = btnOriginal;
        this.disabled = false;
    }
});

// Função para carregar empresas no modal de usuário
function carregarEmpresasUsuarioModal() {
    const container = document.getElementById('empresasUsuarioCheckboxes');
    
    fetch('/api/buscarEmpresas')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                let html = '';
                data.data.forEach(empresa => {
                    html += `
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" value="${empresa.id}" id="empresa_user_${empresa.id}">
                            <label class="form-check-label" for="empresa_user_${empresa.id}">
                                <i class="fas fa-building me-1"></i>
                                ${empresa.nome}
                            </label>
                        </div>
                    `;
                });
                container.innerHTML = html || '<div class="text-muted">Nenhuma empresa encontrada</div>';
            } else {
                container.innerHTML = '<div class="text-danger">Erro ao carregar empresas</div>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
            container.innerHTML = '<div class="text-danger">Erro ao carregar empresas</div>';
        });
}

document.getElementById('salvarEmpresa').addEventListener('click', async function(ev) {
  try {
    ev.preventDefault();
    console.log("função de salvar empresa ativa");

    // Mostrar loading no botão
    LoadingUtils.buttonLoading(this, true);

    let nome = document.getElementById('nomeEmpresa').value;
    let contaDeAnuncio = document.getElementById('idContaAnuncio').value;

    console.log("Nome da empresa:", nome);
    console.log("Conta de anúncio:", contaDeAnuncio);

    const response = await fetch('/api/criarEmpresa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, contaDeAnuncio })
    });
    const data = await response.json();

    LoadingUtils.buttonLoading(this, false);

    if (data.error) {
      console.error('[MetaAdsService] Erro retornado pela API:', data.error);
      alert('Erro ao salvar empresa: ' + data.error);
    } else {
      alert('Empresa salva com sucesso!');
    }
    
    refreshDados("cadastradas");
    document.getElementById('FormCadastroEmpresa').style.display = 'none';
  } catch (error) {
    LoadingUtils.buttonLoading(this, false);
    console.error('Erro ao salvar empresa:', error);
    alert('Erro ao salvar empresa');
  }
});

async function carregarEmpresasCadastradas() {
  // Mostrar loading no container das empresas
  LoadingUtils.showContainer('subAbaEmpresas', 'Carregando empresas cadastradas...');
  
  try {
    // 1. Verificar se há usuário logado
    const usuarioResponse = await fetch('/api/session-user');
    if (usuarioResponse.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    
    const { usuario } = await usuarioResponse.json();
    if (!usuario) {
      window.location.href = '/login.html';
      return;
    }

    // 2. Buscar empresas baseado na permissão do usuário
    const resEmpresas = await fetch("/api/buscarEmpresas");
    const resultado = await resEmpresas.json();

    const empresas = Array.isArray(resultado.data) ? resultado.data : [];

    // 3. Criar promessas para cada empresa
    const promessas = empresas.map(async (emp) => {
      try {
        console.log(`Processando empresa:`, emp);
        
        const [resMetrica, resSaldo] = await Promise.all([
          fetch(`http://localhost:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/insights`),
          fetch(`http://localhost:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/saldo`)
        ]);

        const metricas = await resMetrica.json();
        const saldo = await resSaldo.json();
        
        console.log(`Métricas para ${emp.nome}:`, metricas);
        console.log(`Saldo para ${emp.nome}:`, saldo);

        if (metricas?.data?.length > 0) {
          const resultado = {
            id: emp.id,
            empresa: emp.nome,
            contaDeAnuncio: emp.contaDeAnuncio,
            cliques: metricas.data[0].cliques || 0,
            impressoes: metricas.data[0].impressoes || 0,
            alcance: metricas.data[0].alcance || 0,
            gasto: metricas.data[0].gasto || 0,
            ctr: metricas.data[0].ctr || 0,
            cpc: metricas.data[0].cpc || 0,
            cpr: metricas.data[0].cpr || 0,
            saldo: saldo?.data?.saldoOriginal || 0,
          };
          console.log(`Resultado final para ${emp.nome}:`, resultado);
          return resultado;
        }
      } catch (err) {
        console.error(`Erro ao buscar métricas da empresa ${emp.nome}:`, err);
        return null;
      }
    });

    // 4. Aguardar todas as promessas de uma vez
    const dadosComMetricas = (await Promise.all(promessas)).filter(Boolean);

    // 5. Renderizar tabela (isso remove automaticamente o loading)
    renderTabelaEmpresas(dadosComMetricas);

  } catch (err) {
    console.error("Erro ao carregar empresas e métricas:", err);
    document.getElementById("subAbaEmpresas").innerHTML =
      "<p style='color:red'>Erro ao carregar dados.</p>";
  }
}

// Função de renderizar tabela de empresas
function renderTabelaEmpresas(dados) {
  const container = document.getElementById("subAbaEmpresas");

  if (dados.length === 0) {
    container.innerHTML = "<p>Nenhuma empresa cadastrada.</p>";
    return;
  }

  let tabela = `
    <div class="tabela-empresas-container">
      <table class="tabela-empresas table table-striped">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Conta de Anúncio</th>
            <th>Saldo [META]</th>
            <th>Saldo [GOOGLE]</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
  `;

  dados.forEach(emp => {
    tabela += `
      <tr>
        <td>${emp.empresa}</td>
        <td>${emp.contaDeAnuncio || 'Não informado'}</td>
        <td class="valor">${emp.saldo}</td>
        <td class="valor">SaldoGoogle</td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editarEmpresa(${emp.id}, '${emp.empresa}', '${emp.contaDeAnuncio}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="excluirEmpresa(${emp.id}, '${emp.empresa}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </td>
      </tr>
    `;
  });

  tabela += `</tbody></table></div>`;
  container.innerHTML = tabela;
}

function refreshDados(tipo = "cadastradas") {
  if (tipo === "cadastradas") {
    // O loading será mostrado dentro da função carregarEmpresasCadastradas
    carregarEmpresasCadastradas();
  } else if (tipo === "metricas") {
    // O loading será mostrado dentro da função carregarEmpresasCadastradas
    carregarEmpresasCadastradas();
  }
}

// Função para adicionar header do CRM com ações
function adicionarHeaderCRM() {
  const crmSection = document.getElementById('crmSection');
  if (crmSection) {
    const cardBody = crmSection.querySelector('.card-body');
    if (cardBody && !cardBody.querySelector('.crm-header-actions')) {
      const headerActions = document.createElement('div');
      headerActions.className = 'crm-header-actions d-flex justify-content-between align-items-center mb-3';
      headerActions.innerHTML = `
        <h5 class="mb-0">Gestão de Leads</h5>
        <div class="crm-actions">
          <button class="btn btn-outline-primary btn-sm me-2" onclick="recarregarLeads()">
            <i class="fas fa-sync-alt"></i> Atualizar
          </button>
          <input type="text" class="form-control form-control-sm d-inline-block" 
                 placeholder="Filtrar leads..." 
                 style="width: 200px;"
                 onkeyup="filtrarLeads(this.value)">
        </div>
      `;
      cardBody.insertBefore(headerActions, cardBody.firstChild);
    }
  }
}

// Função para carregar usuários cadastrados
async function carregarUsuariosCadastrados() {
  try {
    LoadingUtils.showContainer('subAbaUsuario', 'Carregando usuários cadastrados...');
    
    // Verificar se há usuário logado e suas permissões
    const usuarioResponse = await fetch('/api/session-user');
    if (usuarioResponse.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    
    const { usuario } = await usuarioResponse.json();
    if (!usuario) {
      window.location.href = '/login.html';
      return;
    }

    // Verificar se o usuário tem permissão para ver usuários
    if (usuario.permissao === 'USER') {
      document.getElementById('subAbaUsuario').innerHTML = 
        "<p style='color:orange'>Você não tem permissão para visualizar usuários.</p>";
      return;
    }
    
    const response = await fetch('/api/listarUsuarios', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const resultado = await response.json();
    console.log('Resposta da API listarUsuarios:', resultado);
    
    if (resultado.error) {
      throw new Error(resultado.error);
    }

    const usuarios = Array.isArray(resultado.data) ? resultado.data : [];
    renderTabelaUsuarios(usuarios);
    
  } catch (error) {
    console.error('Erro detalhado ao carregar usuários:', error);
    const errorMessage = error.message || 'Erro desconhecido';
    document.getElementById('subAbaUsuario').innerHTML = 
      "<p style='color:red'>Erro ao carregar usuários: " + errorMessage + "</p>";
  }
}

// Função para renderizar tabela de usuários
function renderTabelaUsuarios(usuarios) {
  const container = document.getElementById('subAbaUsuario');

  if (usuarios.length === 0) {
    container.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
    return;
  }

  let tabela = `
    <div class="tabela-usuarios-container">
      <table class="tabela-usuarios table table-striped">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Permissão</th>
            <th>Empresas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
  `;

  usuarios.forEach(usuario => {
    const empresasTexto = usuario.empresas && usuario.empresas.length > 0 
      ? usuario.empresas.map(emp => emp.nome).join(', ')
      : 'Nenhuma empresa';

    tabela += `
      <tr>
        <td>${usuario.nome}</td>
        <td>${usuario.email}</td>
        <td><span class="badge bg-${getPermissaoBadgeColor(usuario.permissao)}">${usuario.permissao}</span></td>
        <td>${empresasTexto}</td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editarUsuario(${usuario.id})">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-sm btn-success me-1" onclick="adicionarEmpresaUsuario(${usuario.id})">
            <i class="fas fa-building"></i> Add Empresa
          </button>
          <button class="btn btn-sm btn-danger" onclick="excluirUsuario(${usuario.id}, '${usuario.nome}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </td>
      </tr>
    `;
  });

  tabela += `</tbody></table></div>`;
  container.innerHTML = tabela;
}

// Função para obter cor do badge baseado na permissão
function getPermissaoBadgeColor(permissao) {
  switch (permissao) {
    case 'ADMIN': return 'danger';
    case 'GESTOR': return 'warning';
    case 'USER': return 'secondary';
    default: return 'light';
  }
}

// Função para editar usuário
async function editarUsuario(usuarioId) {
  try {
    const response = await fetch('/api/listarUsuarios');
    const resultado = await response.json();
    const usuarios = resultado.data || [];
    const usuario = usuarios.find(u => u.id === usuarioId);
    
    if (!usuario) {
      alert('Usuário não encontrado');
      return;
    }

    // Criar modal de edição
    const modalHtml = `
      <div class="modal fade" id="modalEditarUsuario" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Usuário</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formEditarUsuario">
                <div class="mb-3">
                  <label class="form-label">Nome</label>
                  <input type="text" class="form-control" id="editNome" value="${usuario.nome}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="editEmail" value="${usuario.email}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Permissão</label>
                  <select class="form-control" id="editPermissao" required>
                    <option value="USER" ${usuario.permissao === 'USER' ? 'selected' : ''}>User</option>
                    <option value="GESTOR" ${usuario.permissao === 'GESTOR' ? 'selected' : ''}>Gestor</option>
                    <option value="ADMIN" ${usuario.permissao === 'ADMIN' ? 'selected' : ''}>Admin</option>
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" onclick="salvarEdicaoUsuario(${usuarioId})">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalEditarUsuario');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    modal.show();

  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    alert('Erro ao carregar dados do usuário');
  }
}

// Função para salvar edição do usuário
async function salvarEdicaoUsuario(usuarioId) {
  try {
    const nome = document.getElementById('editNome').value;
    const email = document.getElementById('editEmail').value;
    const permissao = document.getElementById('editPermissao').value;

    if (!nome || !email || !permissao) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    const response = await fetch(`/api/atualizarUsuario/${usuarioId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, permissao })
    });

    const resultado = await response.json();

    if (resultado.error) {
      alert('Erro ao atualizar usuário: ' + resultado.error);
      return;
    }

    alert('Usuário atualizado com sucesso!');
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario'));
    modal.hide();
    
    // Recarregar lista
    carregarUsuariosCadastrados();

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    alert('Erro ao atualizar usuário');
  }
}

// Função para excluir usuário
async function excluirUsuario(usuarioId, nomeUsuario) {
  if (!confirm(`Tem certeza que deseja excluir o usuário "${nomeUsuario}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/removerUsuario/${usuarioId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const resultado = await response.json();

    if (resultado.error) {
      alert('Erro ao excluir usuário: ' + resultado.error);
      return;
    }

    alert('Usuário excluído com sucesso!');
    carregarUsuariosCadastrados();

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário');
  }
}

// Função para adicionar empresa ao usuário
async function adicionarEmpresaUsuario(usuarioId) {
  try {
    // Carregar empresas disponíveis
    const response = await fetch('/api/buscarEmpresas');
    const resultado = await response.json();
    const empresas = resultado.data || [];

    if (empresas.length === 0) {
      alert('Nenhuma empresa disponível para associação');
      return;
    }

    // Criar modal para seleção de empresa
    const modalHtml = `
      <div class="modal fade" id="modalAdicionarEmpresa" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Adicionar Empresa ao Usuário</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Selecione uma empresa</label>
                <select class="form-control" id="selectEmpresa" required>
                  <option value="">Selecione uma empresa</option>
                  ${empresas.map(emp => `<option value="${emp.id}">${emp.nome}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" onclick="salvarEmpresaUsuario(${usuarioId})">Adicionar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalAdicionarEmpresa');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalAdicionarEmpresa'));
    modal.show();

  } catch (error) {
    console.error('Erro ao carregar empresas:', error);
    alert('Erro ao carregar empresas');
  }
}

// Função para salvar empresa ao usuário
async function salvarEmpresaUsuario(usuarioId) {
  try {
    const empresaId = document.getElementById('selectEmpresa').value;

    if (!empresaId) {
      alert('Selecione uma empresa');
      return;
    }

    const response = await fetch('/api/adicionarEmpresaUsuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: parseInt(usuarioId), empresaId: parseInt(empresaId) })
    });

    const resultado = await response.json();

    if (resultado.error) {
      alert('Erro ao adicionar empresa: ' + resultado.error);
      return;
    }

    alert('Empresa adicionada com sucesso!');
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAdicionarEmpresa'));
    modal.hide();
    
    // Recarregar lista
    carregarUsuariosCadastrados();

  } catch (error) {
    console.error('Erro ao adicionar empresa:', error);
    alert('Erro ao adicionar empresa');
  }
}

// Função para editar empresa
async function editarEmpresa(empresaId, nomeAtual, contaAtual) {
  try {
    // Criar modal de edição
    const modalHtml = `
      <div class="modal fade" id="modalEditarEmpresa" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Empresa</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formEditarEmpresa">
                <div class="mb-3">
                  <label class="form-label">Nome da Empresa</label>
                  <input type="text" class="form-control" id="editNomeEmpresa" value="${nomeAtual}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Conta de Anúncio</label>
                  <input type="text" class="form-control" id="editContaEmpresa" value="${contaAtual}" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" onclick="salvarEdicaoEmpresa(${empresaId})">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalEditarEmpresa');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarEmpresa'));
    modal.show();

  } catch (error) {
    console.error('Erro ao carregar dados da empresa:', error);
    alert('Erro ao carregar dados da empresa');
  }
}

// Função para salvar edição da empresa
async function salvarEdicaoEmpresa(empresaId) {
  try {
    const nome = document.getElementById('editNomeEmpresa').value;
    const contaDeAnuncio = document.getElementById('editContaEmpresa').value;

    if (!nome || !contaDeAnuncio) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    const response = await fetch(`/api/atualizarEmpresa/${empresaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, contaDeAnuncio })
    });

    const resultado = await response.json();

    if (resultado.error) {
      alert('Erro ao atualizar empresa: ' + resultado.error.message);
      return;
    }

    alert('Empresa atualizada com sucesso!');
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarEmpresa'));
    modal.hide();
    
    // Recarregar lista
    carregarEmpresasCadastradas();

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    alert('Erro ao atualizar empresa');
  }
}

// Função para excluir empresa
async function excluirEmpresa(empresaId, nomeEmpresa) {
  if (!confirm(`Tem certeza que deseja excluir a empresa "${nomeEmpresa}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/excluirEmpresa/${empresaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const resultado = await response.json();

    if (resultado.error) {
      alert('Erro ao excluir empresa: ' + resultado.error.message);
      return;
    }

    alert('Empresa excluída com sucesso!');
    carregarEmpresasCadastradas();

  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    alert('Erro ao excluir empresa');
  }
}

// Função para inicializar os painéis corretamente
function inicializarPaineis() {
  // Esconder todos os painéis primeiro
  esconderTodosPaineis();
  
  // Mostrar apenas o painel Dashboard no carregamento
  if (painelMonitoramento) {
    painelMonitoramento.style.setProperty('display', 'flex');
    painelMonitoramento.dataset.theme = "ativo";
  }
  if (btnDashboard) {
    btnDashboard.style.setProperty('background-color', '#dde9f5ff');
    btnDashboard.classList.add('active');
  }
}

// Executa quando a página carrega
carregarEmpresasCadastradas();
inicializarPaineis();

});
