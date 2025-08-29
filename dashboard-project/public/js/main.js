
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
userSession.textContent = usuarioSession.nome + ' \\/';
// Lógica JS para consumir API e atualizar UI

// Substitua pelo ID real da conta
const accountId = '537800105358529';

  try {
    fetch(`http://162.240.157.62:3001/api/v1/metrics/account/${accountId}/insights`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          const insight = data.data[0];
          document.getElementById('cliques').innerText = insight.cliques;
          document.getElementById('cliques').style.color = 'white';
          document.getElementById('impressoes').innerText = insight.impressoes;
          document.getElementById('impressoes').style.color = 'white';
          document.getElementById('alcance').innerText = insight.alcance;
          document.getElementById('alcance').style.color = 'white';
          document.getElementById('gasto').innerText = insight.gasto;
          document.getElementById('ctr').innerText = insight.ctr;
          this.document.getElementById('ctr').style.color = 'white';
          document.getElementById('cpc').innerText = insight.cpc;
          document.getElementById('cpc').style.color = 'white';
          document.getElementById('cpr').innerText = insight.cpr;
          document.getElementById('cpr').style.color = 'white';
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


