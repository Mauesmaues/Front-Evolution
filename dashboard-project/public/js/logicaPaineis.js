window.addEventListener('DOMContentLoaded', function() {
//Seleção de painel
const painelMonitoramento = document.getElementById('painelMonitoramento');
const painelAdministracao = document.getElementById('painelAdministracao');
const painelCRM = document.getElementById('crmSection');

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


    document.getElementById('FormCadastroEmpresa').style.display = 'none';
    document.getElementById('FormCadastroUsuario').style.display = 'none';
  }
});

this.document.getElementById('metricasVideo').addEventListener('click', function(ev){
    ev.preventDefault;
    if(painelVideo.dataset.theme === "default"){
        painelVideo.dataset.theme = "ativo";
        painelVideo.style.setProperty('display', 'block');
        painelAdministracao.dataset.theme = "default";
        painelAdministracao.style.setProperty('display', 'none');
        painelMonitoramento.dataset.theme = "default";
        painelMonitoramento.style.setProperty('display', 'none');

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
      const response = await fetch('/api/buscarEmpresas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const resultado = await response.json();
      const empresas = Array.isArray(resultado.data) ? resultado.data : [];

      const select = document.getElementById('empresaSelect');
      empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome; // ajuste conforme o nome da coluna
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
}

const PermissaoEnum = {
    ADMIN: 'adm',
    GESTOR: 'gestor',
    DESIGNER: 'designer',
    USUARIO: 'usuario'
  };

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

    if (data.error) {
      console.error('[MetaAdsService] Erro retornado pela API:', data.error);
      // Apenas loga o erro, não lança para não parar o fluxo
    }
    refreshDados("cadastradas");
    document.getElementById('FormCadastroEmpresa').style.display = 'none';
  } catch (error) {
    console.error('Erro ao salvar empresa:', error);
  }
});

async function carregarEmpresasCadastradas() {
  try {
    // 1. Buscar empresas do usuário logado
    const resEmpresas = await fetch("/api/buscarEmpresas");
    const resultado = await resEmpresas.json();

    const empresas = Array.isArray(resultado.data) ? resultado.data : [];

    // 2. Criar promessas para cada empresa
    const promessas = empresas.map(async (emp) => {
      try {
        const [resMetrica, resSaldo] = await Promise.all([
          fetch(`http://162.240.157.62:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/insights`),
          fetch(`http://162.240.157.62:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/saldo`)
        ]);

        const metricas = await resMetrica.json();
        const saldo = await resSaldo.json();

        if (metricas?.data?.length > 0) {
          return {
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
        }
      } catch (err) {
        console.error(`Erro ao buscar métricas da empresa ${emp.nome}:`, err);
        return null;
      }
    });

    // 3. Aguardar todas as promessas de uma vez
    const dadosComMetricas = (await Promise.all(promessas)).filter(Boolean);

    // 4. Renderizar tabela
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
    <table class="tabela-empresas">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Cliques</th>
          <th>Impressões</th>
          <th>Alcance</th>
          <th>Gasto</th>
          <th>Saldo</th>
          <th>CPC</th>
          <th>CPR</th>
        </tr>
      </thead>
      <tbody>
  `;

  dados.forEach(emp => {
    tabela += `
      <tr>
        <td>${emp.empresa}</td>
        <td>${emp.cliques}</td>
        <td>${emp.impressoes}</td>
        <td>${emp.alcance}</td>
        <td class="valor">R$ ${parseFloat(emp.gasto).toFixed(2)}</td>
        <td>R$ ${parseFloat(emp.saldo).toFixed(2)}</td>
        <td>R$ ${parseFloat(emp.cpc).toFixed(2)}</td>
        <td>R$ ${parseFloat(emp.cpr).toFixed(2)}</td>
      </tr>
    `;
  });

  tabela += `</tbody></table>`;
  container.innerHTML = tabela;
}

function refreshDados(tipo = "cadastradas") {
  const container = document.getElementById("subAbaEmpresas") 
                    || document.getElementById("dropDownEmpresa");

  if (container) {
    container.innerHTML = "<p>🔄 Atualizando dados...</p>";
  }

  if (tipo === "cadastradas") {
    carregarEmpresasCadastradas();
  } else if (tipo === "metricas") {
    carregarEmpresasEMetricas();
  }
}

function carregarCRM(){

}

async function loadCompanyLeads(companyName) {
  
    const response = await fetch('/api/testeCrm');
    const leads = await response.json();
    // Limpa as colunas
    document.querySelectorAll('.crm-column-body').forEach(column => {
        column.innerHTML = '';
    });
    // Adiciona os cards
    const firstColumn = document.querySelector('[data-stage="entrou"] .crm-column-body');
    leads.forEach((lead, index) => {
        const leadCard = createLeadCardFromDB(lead);
        // Carrega observações salvas
        const savedNotes = localStorage.getItem(`lead_notes_${lead.id}`);
        if (savedNotes) {
            setTimeout(() => {
                const notesTextarea = leadCard.querySelector(`#notes_${lead.id}`);
                if (notesTextarea) {
                    notesTextarea.value = savedNotes;
                }
            }, 100);
        }
        firstColumn.appendChild(leadCard);
    });
}
// Executa quando a página carrega
carregarEmpresasEMetricas();

});

function createLeadCardFromDB(leadData) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'crm-card';
    cardDiv.draggable = true;
    cardDiv.id = `lead_${leadData.data[0].id}`;
    cardDiv.ondragstart = drag;

    // Formatar data (tratar como texto)
    let dataFormatada = 'Data não informada';
    let horaFormatada = '';

    if (leadData.data_hora_entrada) {
        try {
            const dataEntrada = new Date(leadData.data_hora_entrada);
            if (!isNaN(dataEntrada.getTime())) {
                dataFormatada = dataEntrada.toLocaleDateString('pt-BR');
                horaFormatada = dataEntrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            } else {
                dataFormatada = leadData.data_hora_entrada;
            }
        } catch (e) {
            dataFormatada = leadData.data_hora_entrada;
        }
    }

    // Função para tratar valores booleanos em texto
    function tratarBooleano(valor) {
        if (!valor) return null;
        const valorLower = valor.toString().toLowerCase().trim();
        if (valorLower === 'true' || valorLower === 't' || valorLower === '1' || valorLower === 'sim' || valorLower === 'yes') {
            return true;
        }
        if (valorLower === 'false' || valorLower === 'f' || valorLower === '0' || valorLower === 'não' || valorLower === 'nao' || valorLower === 'no') {
            return false;
        }
        return null;
    }

    const jaRealizou = tratarBooleano(leadData.ja_realizou);

    cardDiv.innerHTML = `
        <div class="card shadow-sm mb-3">
            <div class="card-body p-2">
                <!-- Dados do Banco -->
                <div class="lead-data-section border-bottom pb-2 mb-2">
                    <h6 class="card-title mb-1 text-primary">${leadData.nome || 'Nome não informado'}</h6>
                    ${leadData.email ? `<p class="card-text small text-muted mb-1">
                        <i class="fas fa-envelope me-1"></i>${leadData.email}
                    </p>` : ''}
                    ${leadData.telefone ? `<p class="card-text small text-muted mb-1">
                        <i class="fas fa-phone me-1"></i>${leadData.telefone}
                    </p>` : ''}
                    ${leadData.procedimento_interesse ? `<p class="card-text small text-muted mb-1">
                        <i class="fas fa-heart me-1"></i><strong>Interesse:</strong> ${leadData.procedimento_interesse}
                    </p>` : ''}
                    ${jaRealizou !== null ? `<p class="card-text small text-muted mb-1">
                        <i class="fas fa-check-circle me-1"></i><strong>Já realizou:</strong> ${jaRealizou ? 'Sim' : 'Não'}
                    </p>` : ''}
                    ${leadData.quando_pretende ? `<p class="card-text small text-muted mb-1">
                        <i class="fas fa-calendar-alt me-1"></i><strong>Quando pretende:</strong> ${leadData.quando_pretende}
                    </p>` : ''}
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>${dataFormatada}${horaFormatada ? ` às ${horaFormatada}` : ''}
                    </small>
                </div>
                
                <!-- Seção de Observações -->
                <div class="lead-notes-section">
                    <textarea class="form-control form-control-sm" 
                              placeholder="Adicione suas observações..." 
                              rows="2" 
                              id="notes_${leadData.id}"
                              onchange="saveLeadNotes(${leadData.id}, this.value)"></textarea>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="badge bg-info">Novo</span>
                    <small class="text-muted">ID: ${leadData.id}</small>
                </div>
            </div>
        </div>
    `;
    
    return cardDiv;
}

