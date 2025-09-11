
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
      // Em caso de erro, redireciona para login
      window.location.href = '/login.html';
      return null;
    }
  }

async function carregarEmpresasEMetricas() {
    try {
      let empresas = [];
      //buscar empresas permissionadas
      let usuario = await usuarioSession();
      if(usuario.permissao !== 'ADMIN') {
        const resEmpresas = await fetch(`/api/permission/${usuario.id}`);
        const resultadoPermissoes = await resEmpresas.json();
        empresas = resultadoPermissoes.accountIds || [];
      }else{
        const resEmpresas = await fetch("/api/buscarEmpresas");
        const resultado = await resEmpresas.json();
        empresas = Array.isArray(resultado.data) ? resultado.data : [];
      }
  
      // 2. Criar promessas para buscar métricas de cada empresa
      const promessas = empresas.map(async (emp) => {
        try {
          const resMetrica = await fetch(
            `http://162.240.157.62:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/insights`
          );
          const metricas = await resMetrica.json();
          console.log("Resposta da API /metrics:", metricas);
  
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
            };
          }
          return null;
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
      document.getElementById("dropDownEmpresa").innerHTML =
        "<p style='color:red'>Erro ao carregar dados.</p>";
    }
  }
  
  // Função de renderizar tabela (igual à sua)
  function renderTabelaEmpresas(dados) {
    const container = document.getElementById("dropDownEmpresa");
  
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
    let somadorCliques = 0;
    let somadorImpressoes = 0;
    let somadorAlcance = 0;
    let somadorGasto = 0;
    let somadorCtr = 0;
    let somadorCpc = 0;
    let somadorCpr = 0;
    dados.forEach(emp => {
      tabela += `
        <tr>
          <td>${emp.empresa}</td>
          <td>${parseFloat(emp.cliques).toLocaleString()}</td>
          <td>${parseFloat(emp.impressoes).toLocaleString()}</td>
          <td>${parseInt(emp.alcance).toLocaleString()}</td>
          <td class="valor">R$ ${parseFloat(emp.gasto).toFixed(2)}</td>
          <td>${parseFloat(emp.ctr).toFixed(2)}%</td>
          <td>R$ ${parseFloat(emp.cpc).toFixed(2)}</td>
          <td>R$ ${parseFloat(emp.cpr).toFixed(2)}</td>
        </tr>
      `;
      somadorCliques += parseInt(emp.cliques) || 0;
      somadorImpressoes += parseInt(emp.impressoes) || 0;
      somadorAlcance += parseInt(emp.alcance) || 0;
      somadorGasto += parseFloat(emp.gasto) || 0;
  
    });
  
    document.getElementById('cliques').innerText = somadorCliques.toLocaleString();
    document.getElementById('impressoes').innerText = somadorImpressoes.toLocaleString();
    document.getElementById('alcance').innerText = somadorAlcance.toLocaleString();
    document.getElementById('gasto').innerText = somadorGasto.toLocaleString();
    somadorCtr = (somadorCliques / somadorImpressoes) * 100 || 0;
    document.getElementById('ctr').innerText = somadorCtr.toFixed(2) + '%';
    somadorCpc = (somadorGasto / somadorCliques) || 0;
    document.getElementById('cpc').innerText = somadorCpc.toFixed(2);
  
    tabela += `</tbody></table>`;
    container.innerHTML = tabela;
  }
  
  // Executa quando a página carrega
  carregarEmpresasEMetricas();