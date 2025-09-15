window.addEventListener('DOMContentLoaded', function() {
// Verificar permissões do usuário e configurar interface
verificarPermissoesEConfigurarInterface();

//Seleção de painel
const painelMonitoramento = document.getElementById('painelMonitoramento');
const painelAdministracao = document.getElementById('painelAdministracao');
const painelCRM = document.getElementById('crmSection');
const painelNotificacoes = document.getElementById('painelNotificacoes');

//Painel administrção
document.getElementById('administracao').addEventListener('click', function(ev) {
  ev.preventDefault();
  console.log("função ativa");
  if(painelAdministracao.dataset.theme === "default") {
    painelAdministracao.dataset.theme = "ativo";
    painelAdministracao.style.setProperty('display', 'flex');

    painelCRM.style.setProperty('display', 'none');
    painelCRM.dataset.theme = "default";
    painelMonitoramento.dataset.theme = "default";
    painelMonitoramento.style.setProperty('display', 'none');
    painelNotificacoes.style.setProperty('display', 'none');
    painelNotificacoes.dataset.theme = "default";
    document.getElementById('subAbaUsuario').style.display = 'none';
    document.getElementById('subAbaEmpresas').style.display = 'flex';

    carregarEmpresasCadastradas();
    refreshDados("cadastradas");
  }
});

//Painel DashBoard
document.getElementById('dashboard').addEventListener('click', function(ev) {
  ev.preventDefault();
  console.log("função ativa");
  if(painelMonitoramento.dataset.theme === "default") {
    painelMonitoramento.dataset.theme = "ativo";
    painelMonitoramento.style.setProperty('display', 'flex');
    painelAdministracao.dataset.theme = "default";
    painelAdministracao.style.setProperty('display', 'none');
    painelAdministracao.dataset.theme = "default";
    painelCRM.style.setProperty('display', 'none');
    painelCRM.dataset.theme = "default";
    painelNotificacoes.style.setProperty('display', 'none');
    painelNotificacoes.dataset.theme = "default";

    document.getElementById('FormCadastroEmpresa').style.display = 'none';
    document.getElementById('FormCadastroUsuario').style.display = 'none';
  }
});

//Painel CRM
document.getElementById('crm').addEventListener('click', function(ev) {
  ev.preventDefault();
  console.log("função ativa");
  if(painelCRM.dataset.theme === "default") {
    painelCRM.dataset.theme = "ativo";
    painelCRM.style.setProperty('display', 'flex');
    painelMonitoramento.style.setProperty('display', 'none');
    painelMonitoramento.dataset.theme = "default";
    painelAdministracao.style.setProperty('display', 'none');
    painelAdministracao.dataset.theme = "default";
    painelNotificacoes.style.setProperty('display', 'none');
    painelNotificacoes.dataset.theme = "default";

    document.getElementById('FormCadastroEmpresa').style.display = 'none';
    document.getElementById('FormCadastroUsuario').style.display = 'none';
    
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
    painelNotificacoes.dataset.theme = "ativo";
    painelNotificacoes.style.setProperty('display', 'flex');
    painelMonitoramento.style.setProperty('display', 'none');
    painelMonitoramento.dataset.theme = "default";
    painelAdministracao.style.setProperty('display', 'none');
    painelAdministracao.dataset.theme = "default";
    painelCRM.style.setProperty('display', 'none');
    painelCRM.dataset.theme = "default";
  }
});

document.getElementById('abaUsuario').addEventListener('click', function(ev){
    ev.preventDefault;
    let btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    if(btnAdicionarSubAbaAdmin.dataset.theme === "empresa"){
        btnAdicionarSubAbaAdmin.textContent = "Adicionar Usuario";
        btnAdicionarSubAbaAdmin.dataset.theme = "usuario";

        subAbaEmpresas.style.setProperty('display', 'none');
        subAbaUsuario.style.setProperty('display', 'flex');
    }
})

document.getElementById('abaEmpresas').addEventListener('click', function(ev){
    ev.preventDefault;
    let btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    let subAbaUsuario = document.getElementById('subAbaUsuario');
    let subAbaEmpresas = document.getElementById('subAbaEmpresas');

    if(btnAdicionarSubAbaAdmin.dataset.theme === "usuario"){
        btnAdicionarSubAbaAdmin.textContent = "Adicionar Empresa";
        btnAdicionarSubAbaAdmin.dataset.theme = "empresa";
        subAbaUsuario.style.setProperty('display', 'none');
        subAbaEmpresas.style.setProperty('display', 'flex');
    }
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
    window.location.href = '/login.html';
  }
}

// Função para configurar interface baseado na permissão
function configurarInterfacePorPermissao(permissao) {
  const administracaoLi = document.getElementById('administracao');
  const subAbasAdmin = document.getElementById('subAbasAdmin');
  const btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
  const notificacoesLi = document.getElementById('Notificacoes');
  
  if (permissao === 'USER') {
    // USER: Ocultar painel de administração e notificações
    if (administracaoLi) {
      administracaoLi.style.display = 'none';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'none';
    }
  } else if (permissao === 'GESTOR') {
    // GESTOR: Mostrar administração e notificações, mas ocultar criação de usuários
    if (administracaoLi) {
      administracaoLi.style.display = 'block';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'block';
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
    if(ev.currentTarget.dataset.theme === "empresa"){
        let FormCadastroEmpresa = document.getElementById('FormCadastroEmpresa');
        FormCadastroEmpresa.style.setProperty('display', 'block');
    }else{
        let FormCadastroUsuario = document.getElementById('FormCadastroUsuario');
        FormCadastroUsuario.style.setProperty('display', 'block');
        carregarEmpresasSelect();
        carregarPermissoes();
    }

});

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
            empresa: emp.nome,
            cliques: metricas.data[0].cliques || 0,
            impressoes: metricas.data[0].impressoes || 0,
            alcance: metricas.data[0].alcance || 0,
            gasto: metricas.data[0].gasto || 0,
            ctr: metricas.data[0].ctr || 0,
            cpc: metricas.data[0].cpc || 0,
            cpr: metricas.data[0].cpr || 0,
            saldo: saldo?.data?.saldo || 0,
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

// Função de renderizar tabela (igual à sua)
function renderTabelaEmpresas(dados) {
  const container = document.getElementById("subAbaEmpresas");

  if (dados.length === 0) {
    container.innerHTML = "<p>Nenhuma métrica disponível.</p>";
    return;
  }

  let tabela = `
    <div class="tabela-empresas-container">
      <table class="tabela-empresas">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
  `;

  dados.forEach(emp => {
    tabela += `
      <tr>
        <td>${emp.empresa}</td>
        <td class="valor">R$ ${parseFloat(emp.saldo).toFixed(2)}</td>
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
    // O loading será mostrado dentro da função carregarEmpresasEMetricas
    carregarEmpresasEMetricas();
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

// Executa quando a página carrega
carregarEmpresasEMetricas();

});
