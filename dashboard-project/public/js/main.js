
window.addEventListener('DOMContentLoaded', async function() {
async function usuarioSession() {
  const response = await fetch('/api/session-user');
  const result = await response.json();
  if(result.usuario) {
    return result.usuario;
  }else{
    return null;
  }

}

let userSession = document.getElementById('headerLogin');
usuarioSession = await usuarioSession();
userSession.textContent = usuarioSession.nome + '';

this.document.getElementById('sair').addEventListener('click', async function(ev) {
  ev.preventDefault();
  console.log("Sair clicado");
  await fetch('/api/sair', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'logout' })
  });
  window.location.href = '/login.html';

});
// Lógica JS para consumir API e atualizar UI

// Substitua pelo ID real da conta
const accountId = '537800105358529';

  try {
    fetch(`http://162.240.157.62:3001/api/v1/metrics/account/${accountId}/insights`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          const insight = data.data[0];
          document.getElementById('cliques').innerText = parseInt(insight.cliques).toLocaleString();
          document.getElementById('cliques').style.color = 'black';
          document.getElementById('impressoes').innerText = parseInt(insight.impressoes).toLocaleString();
          document.getElementById('impressoes').style.color = 'black';
          document.getElementById('alcance').innerText = parseInt(insight.alcance).toLocaleString();
          document.getElementById('alcance').style.color = 'black';
          document.getElementById('gasto').innerText = parseFloat(insight.gasto).toLocaleString();
          document.getElementById('ctr').innerText = parseFloat(insight.ctr).toFixed(2) + '%';
          document.getElementById('ctr').style.color = 'black';
          document.getElementById('cpc').innerText = parseFloat(insight.cpc).toLocaleString();
          document.getElementById('cpc').style.color = 'black';
          document.getElementById('cpr').innerText = parseFloat(insight.cpr).toLocaleString();
          document.getElementById('cpr').style.color = 'black';
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
        console.error('Erro ao buscar insights:', err);
      });
  } catch (err) {
    console.error('Erro inesperado no carregamento de insights:', err);
  }
  
  async function carregarEmpresasSelect() {
    try {
      const response = await fetch('/api/buscarEmpresas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const resultado = await response.json();
      const empresas = Array.isArray(resultado.data) ? resultado.data : [];

      const select = document.getElementById('empresaFiltro');
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


