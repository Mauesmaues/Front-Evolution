window.addEventListener('DOMContentLoaded', function() {
//Seleção de painel
const painelMonitoramento = document.getElementById('painelMonitoramento');
const painelAdministracao = document.getElementById('painelAdministracao');

//Painel administrção
document.getElementById('administracao').addEventListener('click', function(ev) {
  ev.preventDefault();
  console.log("função ativa");
  if(painelMonitoramento.dataset.theme === "ativo") {

    painelMonitoramento.dataset.theme = "default";
    painelMonitoramento.style.setProperty('display', 'none');
  }

  painelAdministracao.dataset.theme = "ativo";
  painelAdministracao.style.setProperty('display', 'flex');

});

//Painel DashBoard
document.getElementById('dashboard').addEventListener('click', function(ev) {
  ev.preventDefault();
  console.log("função ativa");
  if(painelMonitoramento.dataset.theme === "default") {
    painelMonitoramento.dataset.theme = "ativo";
    painelMonitoramento.style.setProperty('display', 'flex');
    painelAdministracao.style.setProperty('display', 'none');
    document.getElementById('FormCadastroEmpresa').style.display = 'none';
    document.getElementById('FormCadastroUsuario').style.display = 'none';
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
        carregarEmpresasCadastradas();
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

    // Agora pegamos o array de empresas
    const empresas = Array.isArray(resultado.data) ? resultado.data : [];
    const dadosComMetricas = [];

    // 2. Iterar empresas e buscar métricas
    for (const emp of empresas) {
      try {
        const resMetrica = await fetch(
          `http://162.240.157.62:3000/api/v1/metrics/account/${emp.contaDeAnuncio}/insights`
        );
        const metricas = await resMetrica.json();
        console.log("Resposta da API /metrics:", metricas);

        if (metricas && metricas.data && metricas.data.length > 0) {
          dadosComMetricas.push({
            empresa: emp.nome,
            cliques: metricas.data[0].cliques || 0,
            impressoes: metricas.data[0].impressoes || 0,
            alcance: metricas.data[0].alcance || 0,
            gasto: metricas.data[0].gasto || 0,
            ctr: metricas.data[0].ctr || 0,
            cpc: metricas.data[0].cpc || 0,
            cpr: metricas.data[0].cpr || 0
          });
        }
      } catch (err) {
        console.error(`Erro ao buscar métricas da empresa ${emp.nome}:`, err);
      }
    }

    // 3. Renderizar tabela
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
          <th>CTR</th>
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
        <td>${emp.ctr}%</td>
        <td>R$ ${parseFloat(emp.cpc).toFixed(2)}</td>
        <td>R$ ${parseFloat(emp.cpr).toFixed(2)}</td>
      </tr>
    `;
  });

  tabela += `</tbody></table>`;
  container.innerHTML = tabela;
}

// Executa quando a página carrega
carregarEmpresasEMetricas();

});