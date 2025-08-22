window.addEventListener('DOMContentLoaded', function() {
// Lógica JS para consumir API e atualizar UI

// Substitua pelo ID real da conta
const accountId = '537800105358529';

fetch(`http://162.240.157.62:3000/api/v1/metrics/account/${accountId}/insights`)
  .then(res => res.json())
  .then(data => {
    // Supondo que o backend retorna { success: true, data: [ ... ] }
    if (data.success && data.data && data.data.length > 0) {
      const insight = data.data[0]; // Pega o primeiro insight
      document.getElementById('cliques').innerText = insight.cliques;
      document.getElementById('impressoes').innerText = insight.impressoes;
      document.getElementById('alcance').innerText = insight.alcance;
      document.getElementById('gasto').innerText = insight.gasto;
      document.getElementById('ctr').innerText = insight.ctr;
      document.getElementById('cpc').innerText = insight.cpc;
      document.getElementById('cpr').innerText = insight.cpr;
      // Adicione outros campos conforme necessário
    } else {
      document.getElementById('cliques').textContent = '-';
      document.getElementById('impressoes').textContent = '-';
      document.getElementById('alcance').textContent = '-';
      document.getElementById('gasto').textContent = '-';
      document.getElementById('ctr').textContent = '-';
      document.getElementById('cpc').textContent = '-';
      document.getElementById('cpr').textContent = '-';
    }
  })
  .catch(err => {
    document.getElementById('cliques').textContent = '-';
    document.getElementById('impressoes').textContent = '-';
    document.getElementById('alcance').textContent = '-';
    document.getElementById('gasto').textContent = '-';
    document.getElementById('ctr').textContent = '-';
    document.getElementById('cpc').textContent = '-';
    document.getElementById('cpr').textContent = '-';
    console.error(err);
  });
});


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
  }
});

  document.getElementById('btnAdicionarEmpresa').addEventListener('click', function(ev) {
    ev.preventDefault();
    console.log("função ativa");
    document.getElementById('FormCadastroEmpresa').style.display = 'block';

    document.getElementById('salvarEmpresa').addEventListener('click', async function(ev) {
    ev.preventDefault();
    console.log("função de salvar empresa ativa");

    let nome = document.getElementById('nomeEmpresa').value;
    let contaDeAnuncio = document.getElementById('idContaAnuncio').value;
    console.log("Nome da empresa:", nome);
    console.log("Conta de anúncio:", contaDeAnuncio);

    const url = `/criarEmpresa/${nome}/${contaDeAnuncio}`;

    try{
        const response = await fetch('/api/criarEmpresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, contaDeAnuncio })
      });
      const data = await response.json();

      if (data.error) {
          console.error('[MetaAdsService] Erro retornado pela API:', data.error);
          throw new Error(JSON.stringify(data.error));
        }
    }catch (error) {
      console.error(error);
    }

    document.getElementById('FormCadastroEmpresa').style.display = 'none';
  });
});



document.getElementById('salvarEmpresa').addEventListener('click', async function(ev) {
  ev.preventDefault();
  console.log("função de salvar empresa ativa");

  let nome = document.getElementById('nomeEmpresa').value;
  let contaDeAnuncio = document.getElementById('idContaAnuncio').value;

  console.log("Nome da empresa:", nome);
  console.log("Conta de anúncio:", contaDeAnuncio);

  try{
      const response = await fetch('/api/criarEmpresa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, contaDeAnuncio })
    });
    const data = await response.json();

    if (data.error) {
        console.error('[MetaAdsService] Erro retornado pela API:', data.error);
        throw new Error(JSON.stringify(data.error));
      }
  }catch (error) {
    console.error(error);
  }

  document.getElementById('FormCadastroEmpresa').style.display = 'none';
});