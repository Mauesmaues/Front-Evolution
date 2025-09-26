// Variáveis globais para controle de filtros
let empresasGlobais = [];
let filtroAtivo = 'hoje'; // Filtro padrão

// Funções de Loading
function mostrarLoading(tipo = 'overlay', container = null, texto = 'Carregando...') {
  if (tipo === 'overlay') {
    // Loading de tela cheia
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">${texto}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else if (tipo === 'container' && container) {
    // Loading em container específico
    const containerElement = typeof container === 'string' ? document.getElementById(container) : container;
    if (containerElement) {
      containerElement.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner-small"></div>
          <div class="loading-text">${texto}</div>
        </div>
      `;
    }
  }
}

function esconderLoading(tipo = 'overlay', container = null) {
  if (tipo === 'overlay') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  } else if (tipo === 'container' && container) {
    // O conteúdo será substituído pela resposta da API
    console.log('Loading do container será removido quando o conteúdo for carregado');
  }
}

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

// Função para obter filtro de data baseado no tipo
function obterFiltroData(tipo) {
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  
  const formatarData = (data) => {
    return data.toISOString().split('T')[0];
  };

  switch(tipo) {
    case 'hoje':
      return formatarData(hoje) + ',' + formatarData(hoje);
    case 'ontem':
      return formatarData(ontem) + ',' + formatarData(ontem);
    case 'este-mes':
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return formatarData(inicioMes) + ',' + formatarData(hoje);
    case 'periodo-total':
      return 'maximum';
    default:
      return formatarData(hoje) + ',' + formatarData(hoje);
  }
}

// Função para aplicar estilo ao filtro ativo
function marcarFiltroAtivo(filtroSelecionado) {
  // Remove classe ativo de todos os botões
  document.querySelectorAll('.btn-filtro-preset').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Adiciona classe ativo ao filtro selecionado
  const botaoAtivo = document.querySelector(`.btn-filtro-preset[data-filtro="${filtroSelecionado}"]`);
  if (botaoAtivo) {
    botaoAtivo.classList.add('active');
  }
  
  filtroAtivo = filtroSelecionado;
}

async function carregarEmpresasEMetricas(filtroData = null, empresaSelecionada = 'todas') {
    // Mostrar loading no container das métricas
    mostrarLoading('container', 'dropDownEmpresa', 'Carregando métricas...');
    
    try {
      let empresas = [];
      // Buscar empresas baseado na permissão do usuário
      let usuario = await usuarioSession();
      console.log('Usuário logado:', usuario);
      
      if (usuario.permissao === 'USER') {
        // USER: buscar empresas vinculadas (não apenas accountIds)
        const resEmpresas = await fetch("/api/buscarEmpresas");
        const resultado = await resEmpresas.json();
        console.log('Resultado buscarEmpresas para USER:', resultado);
        if (resultado.success && resultado.data) {
          empresas = resultado.data;
        }
      } else if (usuario.permissao === 'ADMIN' || usuario.permissao === 'GESTOR') {
        // ADMIN e GESTOR: todas as empresas
        const resEmpresas = await fetch("/api/buscarEmpresas");
        const resultado = await resEmpresas.json();
        console.log('Resultado buscarEmpresas para ADMIN/GESTOR:', resultado);
        if (resultado.success && resultado.data) {
          empresas = resultado.data;
        }
      }

      console.log('Empresas carregadas:', empresas);

      // Armazenar empresas globalmente para uso nos filtros
      empresasGlobais = empresas;

      // Carregar empresas no select IMEDIATAMENTE após carregar as empresas
      carregarEmpresasSelect();

      // Filtrar por empresa se selecionada
      let empresasFiltradas = empresas;
      if (empresaSelecionada !== 'todas') {
        empresasFiltradas = empresas.filter(emp => emp.id == empresaSelecionada);
      }

      console.log('Empresas filtradas:', empresasFiltradas);

      // Definir filtro de data
      const filtro = filtroData || obterFiltroData(filtroAtivo);
      console.log('Aplicando filtro:', filtro);
  
      // 2. Criar promessas para buscar métricas de cada empresa
      const promessas = empresasFiltradas.map(async (emp) => {
        try {
          // Verificar se a empresa tem contaDeAnuncio válida
          if (!emp || !emp.contaDeAnuncio) {
            console.error(`Empresa inválida ou sem contaDeAnuncio:`, emp);
            return null;
          }

          // Construir URL com ou sem filtro de data
          let url = `http://localhost:3001/api/v1/metrics/account/${emp.contaDeAnuncio}`;
          if (filtro) {
            url += `/${filtro}`;
          }
          url += '/insights';

          console.log(`Buscando métricas para ${emp.nome}:`, url);

          let resMetrica = await fetch(url);
          console.log(`Status da resposta para ${emp.nome}:`, resMetrica.status);
          
          // Se der erro 500 com filtro de data, tentar sem filtro
          if (!resMetrica.ok && resMetrica.status === 500 && filtro) {
            console.warn(`Erro 500 com filtro para ${emp.nome}, tentando sem filtro...`);
            const urlSemFiltro = `http://localhost:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/insights`;
            resMetrica = await fetch(urlSemFiltro);
            console.log(`Status da resposta sem filtro para ${emp.nome}:`, resMetrica.status);
          }
          
          if (!resMetrica.ok) {
            console.error(`Erro ${resMetrica.status} para ${emp.nome}:`, resMetrica.statusText);
            const errorText = await resMetrica.text();
            console.error(`Detalhes do erro:`, errorText);
            return null;
          }
          
          const metricas = await resMetrica.json();
          console.log(`Resposta da API para ${emp.nome}:`, metricas);
          console.log(`Resposta da API para ${emp.nome}:`, metricas.data[0].cpr);
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
  
      // 4. Renderizar tabela (isso remove automaticamente o loading)
      renderTabelaEmpresas(dadosComMetricas);
  
    } catch (err) {
      console.error("Erro ao carregar empresas e métricas:", err);
      document.getElementById("dropDownEmpresa").innerHTML =
        "<p style='color:red'>Erro ao carregar dados.</p>";
    }
}

// Função para carregar apenas empresas (para popular o dropdown rapidamente)
async function carregarEmpresasDropdown() {
  try {
    let usuario = await usuarioSession();
    if (!usuario) return;

    const resEmpresas = await fetch("/api/buscarEmpresas");
    const resultado = await resEmpresas.json();
    
    if (resultado.success && resultado.data) {
      empresasGlobais = resultado.data;
      carregarEmpresasSelect();
      console.log('Dropdown de empresas carregado com sucesso');
    }
  } catch (error) {
    console.error('Erro ao carregar empresas para dropdown:', error);
  }
}

// Função para carregar empresas no select
function carregarEmpresasSelect() {
  const select = document.getElementById('empresaFiltro');
  if (!select) {
    console.warn('Elemento empresaFiltro não encontrado');
    return;
  }

  if (empresasGlobais.length === 0) {
    console.warn('Nenhuma empresa disponível para carregar no select');
    return;
  }

  // Verificar se já foi carregado (evitar duplicação)
  if (select.children.length > 1) {
    console.log('Select já carregado, ignorando...');
    return;
  }

  console.log('Carregando empresas no select:', empresasGlobais);
  
  // Limpar e adicionar opção padrão
  select.innerHTML = '<option value="todas">Todas as empresas</option>';
  
  // Adicionar cada empresa
  empresasGlobais.forEach(empresa => {
    const option = document.createElement('option');
    option.value = empresa.id;
    option.textContent = empresa.nome;
    select.appendChild(option);
  });

  // Adicionar event listener para mudança de empresa (apenas uma vez)
  if (!select.hasAttribute('data-listener-added')) {
    select.addEventListener('change', function() {
      const empresaSelecionada = this.value;
      console.log('Empresa selecionada:', empresaSelecionada);
      
      // Recarregar métricas com a empresa selecionada
      carregarEmpresasEMetricas(null, empresaSelecionada);
    });
    
    select.setAttribute('data-listener-added', 'true');
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
      <div class="tabela-empresas-container">
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
              <th>Resultados</th>
              <th>CPL</th>
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
    let somadorCpl = 0;
    
    dados.forEach(emp => {
      let cpl = emp.gasto / emp.cpr || emp.gasto;
      tabela += `
        <tr>
          <td>${emp.empresa}</td>
          <td>${parseInt(emp.cliques)}</td>
          <td>${parseInt(emp.impressoes)}</td>
          <td>${parseInt(emp.alcance)}</td>
          <td class="valor">R$ ${emp.gasto.toLocaleString("pt-BR", {style: "currency", currency: "BRL"})}</td>
          <td>${parseFloat(emp.ctr).toFixed(2)}%</td>
          <td>R$ ${parseFloat(emp.cpc).toFixed(2)}</td>
          <td>${parseInt(emp.cpr)}</td>
          <td>${cpl.toLocaleString("pt-BR", {style: "currency", currency: "BRL"})}</td>
        </tr>
      `;
      somadorCliques += parseInt(emp.cliques) || 0;
      somadorImpressoes += parseInt(emp.impressoes) || 0;
      somadorAlcance += parseInt(emp.alcance) || 0;
      somadorGasto += parseFloat(emp.gasto) || 0;
      somadorCpr += parseFloat(emp.cpr) || 0;
      somadorCpl = somadorGasto / somadorCpr || 0;
  
    });
    
    document.getElementById('cliques').innerText = somadorCliques.toLocaleString();
    document.getElementById('impressoes').innerText = somadorImpressoes.toLocaleString();
    document.getElementById('alcance').innerText = somadorAlcance.toLocaleString();
    document.getElementById('gasto').innerText = somadorGasto.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    somadorCtr = (somadorCliques / somadorImpressoes) * 100 || 0;
    document.getElementById('ctr').innerText = somadorCtr.toFixed(2) + '%';
    somadorCpc = (somadorGasto / somadorCliques) || 0;
    document.getElementById('cpc').innerText = somadorCpc.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    document.getElementById('cpr').innerText = parseInt(somadorCpr);
    document.getElementById('cpl').innerText = somadorCpl.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
  
    tabela += `
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = tabela;
  }

  // Função para inicializar eventos dos filtros
  function inicializarFiltros() {
    // Adicionar data-filtro aos botões de filtro rápido
    const botoesRapidos = document.querySelectorAll('.btn-filtro-preset');
    if (botoesRapidos.length > 0) {
      botoesRapidos[0].setAttribute('data-filtro', 'hoje');
      botoesRapidos[0].textContent = 'Hoje';
      
      if (botoesRapidos[1]) {
        botoesRapidos[1].setAttribute('data-filtro', 'ontem');
        botoesRapidos[1].textContent = 'Ontem';
      }
      
      if (botoesRapidos[2]) {
        botoesRapidos[2].setAttribute('data-filtro', 'este-mes');
        botoesRapidos[2].textContent = 'Este mês';
      }
      
      if (botoesRapidos[3]) {
        botoesRapidos[3].setAttribute('data-filtro', 'periodo-total');
        botoesRapidos[3].textContent = 'Período total';
      }
    }

    // Event listeners para filtros rápidos
    document.querySelectorAll('.btn-filtro-preset').forEach(botao => {
      botao.addEventListener('click', function() {
        const tipoFiltro = this.getAttribute('data-filtro');
        console.log('Filtro rápido selecionado:', tipoFiltro);
        
        marcarFiltroAtivo(tipoFiltro);
        
        // Aplicar filtro com empresa selecionada
        const empresaSelecionada = document.getElementById('empresaFiltro').value;
        carregarEmpresasEMetricas(null, empresaSelecionada);
      });
    });

    // Event listener para botão "Aplicar Filtros"
    document.getElementById('aplicarFiltro').addEventListener('click', function() {
      const dataInicio = document.getElementById('dataInicio').value;
      const dataFim = document.getElementById('dataFim').value;
      const empresaSelecionada = document.getElementById('empresaFiltro').value;

      if (dataInicio && dataFim) {
        // Remover seleção dos filtros rápidos quando usar datas personalizadas
        document.querySelectorAll('.btn-filtro-preset').forEach(btn => {
          btn.classList.remove('active');
        });
        
        filtroAtivo = 'personalizado';
        
        // Formato: YYYY-MM-DD,YYYY-MM-DD
        const filtroPersonalizado = `${dataInicio},${dataFim}`;
        console.log('Aplicando filtro personalizado:', filtroPersonalizado);
        
        carregarEmpresasEMetricas(filtroPersonalizado, empresaSelecionada);
      } else {
        alert('Por favor, selecione as datas de início e fim para aplicar o filtro personalizado.');
      }
    });

    // Marcar "Hoje" como ativo por padrão
    marcarFiltroAtivo('hoje');
  }
  
  // Executa quando a página carrega
  document.addEventListener('DOMContentLoaded', function() {
    inicializarFiltros();
    
    // Carregar empresas no dropdown primeiro (rápido)
    carregarEmpresasDropdown();
    
    // Depois carregar métricas (mais lento)
    carregarEmpresasEMetricas();
  });

  // Manter compatibilidade com chamada direta (caso seja chamado de outro lugar)
  if (document.readyState === 'loading') {
    // Se ainda está carregando, aguardar o DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
      inicializarFiltros();
      carregarEmpresasDropdown();
      carregarEmpresasEMetricas();
    });
  } else {
    // Se já carregou, executar imediatamente
    inicializarFiltros();
    carregarEmpresasDropdown();
    carregarEmpresasEMetricas();
  }