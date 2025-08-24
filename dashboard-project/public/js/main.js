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
    fetch(`http://162.240.157.62:3000/api/v1/metrics/account/${accountId}/insights`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          const insight = data.data[0];
          document.getElementById('cliques').innerText = insight.cliques;
          document.getElementById('impressoes').innerText = insight.impressoes;
          document.getElementById('alcance').innerText = insight.alcance;
          document.getElementById('gasto').innerText = insight.gasto;
          document.getElementById('ctr').innerText = insight.ctr;
          document.getElementById('cpc').innerText = insight.cpc;
          document.getElementById('cpr').innerText = insight.cpr;
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


