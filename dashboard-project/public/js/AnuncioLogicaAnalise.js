// Lógica para carregamento e exibição de dados de anúncios na seção Métricas de Vídeo

// Variáveis globais
let empresasDisponiveis = [];
let dadosAnunciosCache = {};
let dadosJaCarregados = false;

// Função para obter dados da sessão do usuário
async function obterUsuarioSessao() {
  try {
    const response = await fetch('/api/session-user');
    
    if (response.status === 401) {
      console.log('Usuário não autenticado, redirecionando para login');
      window.location.href = '/login.html';
      return null;
    }
    
    const result = await response.json();
    return result.usuario || null;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    window.location.href = '/login.html';
    return null;
  }
}

// Função para carregar empresas no select
async function carregarEmpresasParaMetricasVideo() {
  try {
    const response = await fetch('/api/buscarEmpresas', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const resultado = await response.json();
    const empresas = Array.isArray(resultado.data) ? resultado.data : [];
    
    // Armazenar empresas disponíveis
    empresasDisponiveis = empresas;

    // Atualizar o dropdown customizado de empresas
    atualizarDropdownCustomizado(empresas);
    
    // Manter compatibilidade com o select oculto
    const selectEmpresa = document.getElementById('empresaFiltroVideo');
    if (selectEmpresa) {
      // Limpar e recriar opções do select oculto
      selectEmpresa.innerHTML = '';
      
      const optionTodas = document.createElement('option');
      optionTodas.value = 'todas';
      optionTodas.textContent = 'Todas as empresas';
      selectEmpresa.appendChild(optionTodas);
      
      // Adicionar empresas ao select oculto
      empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        option.dataset.contaAnuncio = empresa.contaDeAnuncio;
        selectEmpresa.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar empresas para métricas de vídeo:', error);
  }
}

// Função para buscar dados de anúncios da API
async function buscarDadosAnuncios(contaDeAnuncio) {
  try {
    const url = `http://localhost:3001/api/v1/anuncios/${contaDeAnuncio}`;
    console.log('Buscando dados de anúncios:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const dados = await response.json();
    console.log('Dados de anúncios recebidos:', dados);
    
    return dados;
  } catch (error) {
    console.error('Erro ao buscar dados de anúncios:', error);
    return null;
  }
}

// Função para formatar valores monetários
function formatarMoeda(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Função para formatar números
function formatarNumero(numero) {
  if (numero === null || numero === undefined || isNaN(numero)) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR').format(numero);
}

// Função para formatar percentual
function formatarPercentual(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0%';
  }
  return `${parseFloat(valor).toFixed(2)}%`;
}

// Função para organizar dados em estrutura hierárquica
function organizarDadosHierarquicos(dadosAnuncios, nomeEmpresa) {
  const estrutura = {
    empresa: nomeEmpresa,
    totalAnuncios: dadosAnuncios.length,
    campanhas: {}
  };

  dadosAnuncios.forEach(anuncio => {
    const campanhaName = anuncio.campanha || 'Campanha Desconhecida';
    const grupoName = anuncio.grupo || 'Grupo Desconhecido';

    // Inicializar campanha se não existir
    if (!estrutura.campanhas[campanhaName]) {
      estrutura.campanhas[campanhaName] = {
        nome: campanhaName,
        totalGrupos: 0,
        totalAnuncios: 0,
        grupos: {}
      };
    }

    // Inicializar grupo se não existir
    if (!estrutura.campanhas[campanhaName].grupos[grupoName]) {
      estrutura.campanhas[campanhaName].grupos[grupoName] = {
        nome: grupoName,
        campanhaName: campanhaName,
        anuncios: []
      };
      estrutura.campanhas[campanhaName].totalGrupos++;
    }

    // Adicionar anúncio ao grupo
    estrutura.campanhas[campanhaName].grupos[grupoName].anuncios.push(anuncio);
    estrutura.campanhas[campanhaName].totalAnuncios++;
  });

  return estrutura;
}

// Função para calcular totais de uma campanha
function calcularTotaisCampanha(campanha) {
  let totais = {
    visualizacoes: 0,
    alcance: 0,
    cpl: 0,
    conversoes: 0
  };

  let totalAnuncios = 0;
  let somaAlcance = 0;
  let somaCpl = 0;

  Object.values(campanha.grupos).forEach(grupo => {
    grupo.anuncios.forEach(anuncio => {
      totais.visualizacoes += parseInt(anuncio.visualizacoes || 0);
      const alcanceAtual = parseInt(anuncio.alcance || 0);
      somaAlcance += alcanceAtual;
      
      const cplAtual = parseFloat(anuncio.cpl || 0);
      if (cplAtual > 0) {
        somaCpl += cplAtual;
        totalAnuncios++;
      }
      
      totais.conversoes += parseFloat(anuncio.convs || 0);
    });
  });

  totais.alcance = somaAlcance;
  totais.cpl = totalAnuncios > 0 ? somaCpl / totalAnuncios : 0;

  return totais;
}

// Função para calcular totais de um grupo
function calcularTotaisGrupo(grupo) {
  let totais = {
    visualizacoes: 0,
    alcance: 0,
    cpl: 0,
    conversoes: 0
  };

  let totalAnuncios = 0;
  let somaAlcance = 0;
  let somaCpl = 0;

  grupo.anuncios.forEach(anuncio => {
    totais.visualizacoes += parseInt(anuncio.visualizacoes || 0);
    const alcanceAtual = parseInt(anuncio.alcance || 0);
    somaAlcance += alcanceAtual;
    
    const cplAtual = parseFloat(anuncio.cpl || 0);
    if (cplAtual > 0) {
      somaCpl += cplAtual;
      totalAnuncios++;
    }
    
    totais.conversoes += parseFloat(anuncio.convs || 0);
  });

  totais.alcance = somaAlcance;
  totais.cpl = totalAnuncios > 0 ? somaCpl / totalAnuncios : 0;

  return totais;
}

// Variáveis para controle de expansão
let estadoExpansao = {
  empresas: {},
  campanhas: {},
  grupos: {}
};

// Funções de expansão/colapso
function toggleEmpresa(empresaId) {
  estadoExpansao.empresas[empresaId] = !estadoExpansao.empresas[empresaId];
  atualizarVisibilidadeLinhas();
}

function toggleCampanha(empresaId, campanhaId) {
  const chave = `${empresaId}_${campanhaId}`;
  estadoExpansao.campanhas[chave] = !estadoExpansao.campanhas[chave];
  atualizarVisibilidadeLinhas();
}

function toggleGrupo(empresaId, campanhaId, grupoId) {
  const chave = `${empresaId}_${campanhaId}_${grupoId}`;
  estadoExpansao.grupos[chave] = !estadoExpansao.grupos[chave];
  atualizarVisibilidadeLinhas();
}

function atualizarVisibilidadeLinhas() {
  const tbody = document.getElementById('tabelaMetricasVideo');
  if (!tbody) return;

  const linhas = tbody.querySelectorAll('tr');
  linhas.forEach(linha => {
    const tipo = linha.dataset.tipo;
    const empresaId = linha.dataset.empresaId;
    const campanhaId = linha.dataset.campanhaId;
    const grupoId = linha.dataset.grupoId;

    let visivel = true;

    if (tipo === 'campanha') {
      visivel = estadoExpansao.empresas[empresaId] || false;
    } else if (tipo === 'grupo') {
      const chaveEmpresa = empresaId;
      const chaveCampanha = `${empresaId}_${campanhaId}`;
      visivel = (estadoExpansao.empresas[chaveEmpresa] || false) && 
                (estadoExpansao.campanhas[chaveCampanha] || false);
    } else if (tipo === 'anuncio') {
      const chaveEmpresa = empresaId;
      const chaveCampanha = `${empresaId}_${campanhaId}`;
      const chaveGrupo = `${empresaId}_${campanhaId}_${grupoId}`;
      visivel = (estadoExpansao.empresas[chaveEmpresa] || false) && 
                (estadoExpansao.campanhas[chaveCampanha] || false) &&
                (estadoExpansao.grupos[chaveGrupo] || false);
    }

    // Aplicar transição suave
    if (visivel && linha.style.display === 'none') {
      linha.style.display = '';
      linha.style.opacity = '0';
      linha.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        linha.style.opacity = '1';
        linha.style.transform = 'translateY(0)';
      }, 10);
    } else if (!visivel && linha.style.display !== 'none') {
      linha.style.opacity = '0';
      linha.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        linha.style.display = 'none';
      }, 300);
    }
  });
  
  // Atualizar ícones dos botões de expansão
  atualizarIconesBotoes();
}

function atualizarIconesBotoes() {
  const tbody = document.getElementById('tabelaMetricasVideo');
  if (!tbody) return;
  
  tbody.querySelectorAll('button[onclick*="toggle"]').forEach(botao => {
    const onclick = botao.getAttribute('onclick');
    const i = botao.querySelector('i');
    
    if (!onclick || !i) return;
    
    try {
      if (onclick.includes('toggleEmpresa')) {
        const matches = onclick.match(/'([^']+)'/g);
        if (matches && matches.length >= 1) {
          const empresaId = matches[0].slice(1, -1);
          const expandido = estadoExpansao.empresas[empresaId] || false;
          i.className = expandido ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
        }
      } else if (onclick.includes('toggleCampanha')) {
        const matches = onclick.match(/'([^']+)'/g);
        if (matches && matches.length >= 2) {
          const empresaId = matches[0].slice(1, -1);
          const campanhaId = matches[1].slice(1, -1);
          const chave = `${empresaId}_${campanhaId}`;
          const expandido = estadoExpansao.campanhas[chave] || false;
          i.className = expandido ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
        }
      } else if (onclick.includes('toggleGrupo')) {
        const matches = onclick.match(/'([^']+)'/g);
        if (matches && matches.length >= 3) {
          const empresaId = matches[0].slice(1, -1);
          const campanhaId = matches[1].slice(1, -1);
          const grupoId = matches[2].slice(1, -1);
          const chave = `${empresaId}_${campanhaId}_${grupoId}`;
          const expandido = estadoExpansao.grupos[chave] || false;
          i.className = expandido ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar ícone do botão:', error, 'onclick:', onclick);
    }
  });
}

function criarBotaoExpansao(expandido, onClick) {
  const icone = expandido ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
  return `<button class="btn btn-sm btn-outline-secondary border-0" onclick="${onClick}">
            <i class="${icone}"></i>
          </button>`;
}

// Função para criar ID seguro para HTML
function criarIdSeguro(texto) {
  return texto
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove caracteres especiais exceto espaços e hífens
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/-+/g, '_') // Substitui hífens por underscore
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, '') // Remove underscores do início e fim
    .substring(0, 50); // Limita a 50 caracteres
}

// Função para escapar aspas em strings para uso em atributos HTML
function escaparParaHTML(texto) {
  return texto.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Função para abrir modal da imagem expandida
function expandirImagemAnuncio(anuncioId) {
  try {
    // Recuperar dados do anúncio do objeto global
    const anuncio = window.dadosAnuncios && window.dadosAnuncios[anuncioId];
    
    if (!anuncio || !anuncio.img) {
      console.warn('Anúncio não encontrado ou sem imagem:', anuncioId);
      return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalImagemAnuncio'));
    
    // Atualizar elementos do modal
    document.getElementById('imagemExpandida').src = anuncio.img || '';
    document.getElementById('imagemExpandida').alt = `Criativo: ${anuncio.nome}`;
    
    document.getElementById('modalImagemAnuncioLabel').textContent = anuncio.nome || 'Criativo do Anúncio';
    document.getElementById('infoAnuncio').textContent = `${anuncio.campanha || 'Campanha'} › ${anuncio.grupo || 'Grupo'}`;
    
    document.getElementById('visualizacoesModal').textContent = formatarNumero(anuncio.visualizacoes || 0);
    document.getElementById('alcanceModal').textContent = formatarNumero(anuncio.alcance || 0);
    document.getElementById('cplModal').textContent = parseFloat(anuncio.cpl || 0).toFixed(2);
    
    document.getElementById('linkImagemOriginal').href = anuncio.img || '#';
    
    modal.show();
    
  } catch (error) {
    console.error('Erro ao expandir imagem:', error);
    alert('Erro ao exibir imagem. Tente novamente.');
  }
}

// Função para aplicar filtros locais nos dados
function aplicarFiltrosLocais(dados, filtroNomeCampanha) {
  if (!filtroNomeCampanha) {
    return dados;
  }
  
  return dados.filter(anuncio => 
    (anuncio.campanha && anuncio.campanha.toLowerCase().includes(filtroNomeCampanha.toLowerCase())) ||
    (anuncio.grupo && anuncio.grupo.toLowerCase().includes(filtroNomeCampanha.toLowerCase())) ||
    (anuncio.nome && anuncio.nome.toLowerCase().includes(filtroNomeCampanha.toLowerCase()))
  );
}

// Função para mostrar loading na tabela
function mostrarLoadingTabela() {
  const tbody = document.getElementById('tabelaMetricasVideo');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center p-4">
          <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
            <span class="visually-hidden">Carregando...</span>
          </div>
          Carregando dados...
        </td>
      </tr>
    `;
  }
}

// Função para mostrar erro na tabela
function mostrarErroTabela(mensagem) {
  const tbody = document.getElementById('tabelaMetricasVideo');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center p-4 text-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          ${mensagem}
        </td>
      </tr>
    `;
  }
}

// Função para mostrar mensagem de dados vazios
function mostrarTabelaVazia() {
  const tbody = document.getElementById('tabelaMetricasVideo');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center p-4 text-muted">
          <i class="fas fa-info-circle me-2"></i>
          Nenhum dado encontrado para os filtros aplicados
        </td>
      </tr>
    `;
  }
}
// Função para renderizar dados na tabela
function renderizarTabelaAnuncios(dadosEstruturados) {
  const tbody = document.getElementById('tabelaMetricasVideo');
  
  if (!tbody) {
    console.error('Elemento tabelaMetricasVideo não encontrado');
    return;
  }
  
  // Limpar tabela
  tbody.innerHTML = '';
  
  if (!dadosEstruturados || dadosEstruturados.length === 0) {
    mostrarTabelaVazia();
    return;
  }
  
  try {
    // Renderizar cada empresa
    dadosEstruturados.forEach(estruturaEmpresa => {
      renderizarEmpresa(tbody, estruturaEmpresa);
    });
    
    // Inicializar estados de expansão apenas se houver dados
    if (dadosEstruturados.length > 0) {
      setTimeout(() => {
        atualizarVisibilidadeLinhas();
      }, 100);
    }
  } catch (error) {
    console.error('Erro ao renderizar tabela:', error);
    mostrarErroTabela('Erro ao exibir dados. Tente novamente.');
  }
}

function renderizarEmpresa(tbody, estruturaEmpresa) {
  const empresaId = criarIdSeguro(estruturaEmpresa.empresa);
  const expandido = estadoExpansao.empresas[empresaId] || false;
  
  // Calcular totais da empresa
  let totaisEmpresa = {
    totalCampanhas: Object.keys(estruturaEmpresa.campanhas).length,
    totalGrupos: 0,
    totalAnuncios: estruturaEmpresa.totalAnuncios,
    visualizacoes: 0,
    alcance: 0,
    cpl: 0,
    conversoes: 0
  };
  
  let somaAlcance = 0;
  let somaCpl = 0;
  let countCpl = 0;
  
  Object.values(estruturaEmpresa.campanhas).forEach(campanha => {
    totaisEmpresa.totalGrupos += campanha.totalGrupos;
    const totaisCampanha = calcularTotaisCampanha(campanha);
    totaisEmpresa.visualizacoes += totaisCampanha.visualizacoes;
    somaAlcance += totaisCampanha.alcance;
    if (totaisCampanha.cpl > 0) {
      somaCpl += totaisCampanha.cpl;
      countCpl++;
    }
    totaisEmpresa.conversoes += totaisCampanha.conversoes;
  });
  
  totaisEmpresa.alcance = somaAlcance;
  totaisEmpresa.cpl = countCpl > 0 ? somaCpl / countCpl : 0;
  
  // Renderizar linha da empresa
  const linhaEmpresa = document.createElement('tr');
  linhaEmpresa.className = 'table-primary fw-bold';
  linhaEmpresa.dataset.tipo = 'empresa';
  linhaEmpresa.dataset.empresaId = empresaId;
  
  linhaEmpresa.innerHTML = `
    <td>${criarBotaoExpansao(expandido, `toggleEmpresa('${escaparParaHTML(empresaId)}')`)}</td>
    <td><i class="fas fa-building me-2"></i>${estruturaEmpresa.empresa}</td>
    <td>${totaisEmpresa.totalCampanhas} campanhas</td>
    <td>${totaisEmpresa.totalGrupos} grupos</td>
    <td>${totaisEmpresa.totalAnuncios} anúncios</td>
    <td>-</td>
    <td>${formatarNumero(totaisEmpresa.visualizacoes)}</td>
    <td>${formatarNumero(totaisEmpresa.alcance)}</td>
    <td>R$ ${totaisEmpresa.cpl.toFixed(2)}</td>
    <td>${totaisEmpresa.conversoes.toFixed(2)}</td>
  `;
  
  tbody.appendChild(linhaEmpresa);
  
  // Renderizar campanhas da empresa
  Object.values(estruturaEmpresa.campanhas).forEach(campanha => {
    renderizarCampanha(tbody, campanha, empresaId);
  });
}

function renderizarCampanha(tbody, campanha, empresaId) {
  const campanhaId = criarIdSeguro(campanha.nome);
  const chaveCampanha = `${empresaId}_${campanhaId}`;
  const expandido = estadoExpansao.campanhas[chaveCampanha] || false;
  
  const totaisCampanha = calcularTotaisCampanha(campanha);
  
  // Renderizar linha da campanha
  const linhaCampanha = document.createElement('tr');
  linhaCampanha.className = 'table-secondary';
  linhaCampanha.dataset.tipo = 'campanha';
  linhaCampanha.dataset.empresaId = empresaId;
  linhaCampanha.dataset.campanhaId = campanhaId;
  linhaCampanha.style.display = 'none'; // Inicialmente oculta
  
  linhaCampanha.innerHTML = `
    <td class="ps-4">${criarBotaoExpansao(expandido, `toggleCampanha('${escaparParaHTML(empresaId)}', '${escaparParaHTML(campanhaId)}')`)}</td>
    <td>-</td>
    <td><i class="fas fa-bullhorn me-2"></i>${campanha.nome}</td>
    <td>${campanha.totalGrupos} grupos</td>
    <td>${campanha.totalAnuncios} anúncios</td>
    <td>-</td>
    <td>${formatarNumero(totaisCampanha.visualizacoes)}</td>
    <td>${formatarNumero(totaisCampanha.alcance)}</td>
    <td>R$ ${totaisCampanha.cpl.toFixed(2)}</td>
    <td>${totaisCampanha.conversoes.toFixed(2)}</td>
  `;
  
  tbody.appendChild(linhaCampanha);
  
  // Renderizar grupos da campanha
  Object.values(campanha.grupos).forEach(grupo => {
    renderizarGrupo(tbody, grupo, empresaId, campanhaId);
  });
}

function renderizarGrupo(tbody, grupo, empresaId, campanhaId) {
  const grupoId = criarIdSeguro(grupo.nome);
  const chaveGrupo = `${empresaId}_${campanhaId}_${grupoId}`;
  const expandido = estadoExpansao.grupos[chaveGrupo] || false;
  
  const totaisGrupo = calcularTotaisGrupo(grupo);
  
  // Renderizar linha do grupo
  const linhaGrupo = document.createElement('tr');
  linhaGrupo.className = 'table-light';
  linhaGrupo.dataset.tipo = 'grupo';
  linhaGrupo.dataset.empresaId = empresaId;
  linhaGrupo.dataset.campanhaId = campanhaId;
  linhaGrupo.dataset.grupoId = grupoId;
  linhaGrupo.style.display = 'none'; // Inicialmente oculta
  
  linhaGrupo.innerHTML = `
    <td class="ps-5">${criarBotaoExpansao(expandido, `toggleGrupo('${escaparParaHTML(empresaId)}', '${escaparParaHTML(campanhaId)}', '${escaparParaHTML(grupoId)}')`)}</td>
    <td>-</td>
    <td>-</td>
    <td><i class="fas fa-layer-group me-2"></i>${grupo.nome}</td>
    <td>${grupo.anuncios.length} anúncios</td>
    <td>-</td>
    <td>${formatarNumero(totaisGrupo.visualizacoes)}</td>
    <td>${formatarNumero(totaisGrupo.alcance)}</td>
    <td>R$ ${totaisGrupo.cpl.toFixed(2)}</td>
    <td>${totaisGrupo.conversoes.toFixed(2)}</td>
  `;
  
  tbody.appendChild(linhaGrupo);
  
  // Renderizar anúncios do grupo
  grupo.anuncios.forEach(anuncio => {
    renderizarAnuncio(tbody, anuncio, empresaId, campanhaId, grupoId);
  });
}

function renderizarAnuncio(tbody, anuncio, empresaId, campanhaId, grupoId) {
  // Renderizar linha do anúncio
  const linhaAnuncio = document.createElement('tr');
  linhaAnuncio.dataset.tipo = 'anuncio';
  linhaAnuncio.dataset.empresaId = empresaId;
  linhaAnuncio.dataset.campanhaId = campanhaId;
  linhaAnuncio.dataset.grupoId = grupoId;
  linhaAnuncio.style.display = 'none'; // Inicialmente oculta
  
  // Criar elemento de imagem com botão de expansão
  let imagemHtml;
  if (anuncio.img) {
    // Criar um ID único para este anúncio para evitar problemas com caracteres especiais
    const anuncioId = `anuncio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Armazenar dados do anúncio no objeto global para acesso posterior
    if (!window.dadosAnuncios) {
      window.dadosAnuncios = {};
    }
    window.dadosAnuncios[anuncioId] = anuncio;
    
    imagemHtml = `
      <div class="position-relative">
        <img src="${anuncio.img}" alt="Criativo" class="img-thumbnail criativo-thumbnail" 
             style="max-width: 50px; max-height: 50px; cursor: pointer;"
             onclick="expandirImagemAnuncio('${anuncioId}')">
        <button class="btn btn-sm btn-primary position-absolute top-0 end-0 btn-expand-image" 
                style="padding: 2px 6px; font-size: 10px; border-radius: 50%;"
                title="Expandir imagem"
                onclick="expandirImagemAnuncio('${anuncioId}')">
          <i class="fas fa-expand-alt"></i>
        </button>
      </div>`;
  } else {
    imagemHtml = '<span class="text-muted">Sem imagem</span>';
  }
  
  linhaAnuncio.innerHTML = `
    <td class="ps-5"></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td><i class="fas fa-ad me-2"></i>${anuncio.nome}</td>
    <td>${imagemHtml}</td>
    <td>${formatarNumero(anuncio.visualizacoes || 0)}</td>
    <td>${formatarNumero(anuncio.alcance || 0)}</td>
    <td>R$ ${parseFloat(anuncio.cpl || 0).toFixed(2)}</td>
    <td>${parseFloat(anuncio.convs || 0).toFixed(2)}</td>
  `;
  
  tbody.appendChild(linhaAnuncio);
}

// Função para aplicar filtros e carregar dados
async function aplicarFiltrosMetricasVideo() {
  const selectEmpresa = document.getElementById('empresaFiltroVideo');
  const inputCampanha = document.getElementById('campanhaFiltroVideo');
  const inputDataInicio = document.getElementById('dataInicioVideo');
  const inputDataFim = document.getElementById('dataFimVideo');
  
  if (!selectEmpresa) {
    console.error('Select de empresa não encontrado');
    return;
  }
  
  const empresaSelecionada = selectEmpresa.value;
  const filtroNomeCampanha = inputCampanha ? inputCampanha.value.trim() : '';
  const dataInicio = inputDataInicio ? inputDataInicio.value : null;
  const dataFim = inputDataFim ? inputDataFim.value : null;
  
  // Mostrar loading
  mostrarLoadingTabela();
  
  try {
    // Organizar dados por empresa
    const dadosEstruturados = [];
    
    if (empresaSelecionada === 'todas') {
      // Buscar dados de todas as empresas
      for (const empresa of empresasDisponiveis) {
        if (empresa.contaDeAnuncio) {
          const dados = await buscarDadosAnuncios(empresa.contaDeAnuncio);
          if (dados && dados.data && Array.isArray(dados.data)) {
            const anunciosFiltrados = aplicarFiltrosLocais(dados.data, filtroNomeCampanha);
            if (anunciosFiltrados.length > 0) {
              const estrutura = organizarDadosHierarquicos(anunciosFiltrados, empresa.nome);
              dadosEstruturados.push(estrutura);
            }
          }
        }
      }
    } else {
      // Buscar dados da empresa selecionada
      const empresaSelecionadaObj = empresasDisponiveis.find(emp => emp.id == empresaSelecionada);
      if (empresaSelecionadaObj && empresaSelecionadaObj.contaDeAnuncio) {
        const dados = await buscarDadosAnuncios(empresaSelecionadaObj.contaDeAnuncio);
        if (dados && dados.data && Array.isArray(dados.data)) {
          const anunciosFiltrados = aplicarFiltrosLocais(dados.data, filtroNomeCampanha);
          const estrutura = organizarDadosHierarquicos(anunciosFiltrados, empresaSelecionadaObj.nome);
          dadosEstruturados.push(estrutura);
        }
      }
    }
    
    // Filtrar por data (se implementado na API)
    // Nota: A filtragem por data seria melhor implementada na API para melhor performance
    
    // Renderizar dados estruturados
    renderizarTabelaAnuncios(dadosEstruturados);
    
  } catch (error) {
    console.error('Erro ao aplicar filtros:', error);
    mostrarErroTabela('Erro ao carregar dados. Tente novamente.');
  }
}

// Função para carregar dados iniciais ao abrir o painel
async function carregarDadosIniciaisMetricasVideo() {
  try {
    console.log('Carregando dados iniciais das métricas de vídeo...');
    
    // Carregar empresas apenas uma vez
    if (empresasDisponiveis.length === 0) {
      await carregarEmpresasParaMetricasVideo();
    }
    
    // Carregar dados iniciais apenas uma vez por sessão
    if (!dadosJaCarregados) {
      await aplicarFiltrosMetricasVideo();
      dadosJaCarregados = true;
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados iniciais:', error);
    mostrarErroTabela('Erro ao inicializar dados. Tente recarregar a página.');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('AnuncioLogicaAnalise.js carregado');
  
  // Event listener para o botão de aplicar filtros
  const btnAplicarFiltro = document.getElementById('aplicarFiltroMetricas');
  if (btnAplicarFiltro) {
    btnAplicarFiltro.addEventListener('click', function(e) {
      e.preventDefault();
      aplicarFiltrosMetricasVideo();
    });
    console.log('Event listener do botão aplicar filtros adicionado');
  }
  
  // Event listener para mudança no select de empresa
  const selectEmpresa = document.getElementById('empresaFiltroVideo');
  if (selectEmpresa) {
    selectEmpresa.addEventListener('change', function(e) {
      console.log('Empresa selecionada:', e.target.value);
      aplicarFiltrosMetricasVideo();
    });
    console.log('Event listener do select empresa adicionado');
  }
  
  // Observer para detectar quando o painel de métricas de vídeo é exibido
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'data-theme')) {
        const painelMetricasVideo = document.getElementById('painelMetricasVideo');
        if (painelMetricasVideo && painelMetricasVideo.style.display !== 'none' && 
            painelMetricasVideo.dataset.theme === 'ativo') {
          console.log('Painel de Métricas de Vídeo ativado - carregando dados');
          // Painel foi exibido, carregar dados
          setTimeout(() => {
            carregarDadosIniciaisMetricasVideo();
          }, 100); // Pequeno delay para garantir que o painel esteja totalmente visível
        }
      }
    });
  });
  
  const painelMetricasVideo = document.getElementById('painelMetricasVideo');
  if (painelMetricasVideo) {
    observer.observe(painelMetricasVideo, { 
      attributes: true, 
      attributeFilter: ['style', 'data-theme'] 
    });
    console.log('Observer do painel de métricas de vídeo configurado');
  }
});

// Exportar funções para uso global se necessário
window.AnuncioLogicaAnalise = {
  carregarEmpresasParaMetricasVideo,
  aplicarFiltrosMetricasVideo,
  carregarDadosIniciaisMetricasVideo,
  buscarDadosAnuncios
};

// Tornar funções de toggle globais para uso nos botões
window.toggleEmpresa = toggleEmpresa;
window.toggleCampanha = toggleCampanha;
window.toggleGrupo = toggleGrupo;
window.expandirImagemAnuncio = expandirImagemAnuncio;

// Funções para o dropdown customizado de empresas
function atualizarDropdownCustomizado(empresas) {
  const optionsList = document.getElementById('optionsList');
  if (!optionsList) return;
  
  // Limpar opções existentes (exceto "Todas as empresas")
  const todasOption = optionsList.querySelector('.option[data-value="todas"]');
  optionsList.innerHTML = '';
  
  // Recriar opção "Todas as empresas"
  const optionTodas = document.createElement('div');
  optionTodas.className = 'option selected';
  optionTodas.dataset.value = 'todas';
  optionTodas.textContent = 'Todas as empresas';
  optionsList.appendChild(optionTodas);
  
  // Adicionar empresas
  empresas.forEach(empresa => {
    const option = document.createElement('div');
    option.className = 'option';
    option.dataset.value = empresa.id;
    option.dataset.contaAnuncio = empresa.contaDeAnuncio;
    option.textContent = empresa.nome;
    optionsList.appendChild(option);
  });
  
  // Inicializar eventos se não foram inicializados
  if (!optionsList.dataset.eventsInitialized) {
    inicializarDropdownCustomizado();
    optionsList.dataset.eventsInitialized = 'true';
  }
}

function inicializarDropdownCustomizado() {
  const dropdownSelected = document.getElementById('dropdownSelected');
  const dropdownOptions = document.getElementById('dropdownOptions');
  const optionsList = document.getElementById('optionsList');
  const searchInput = document.getElementById('searchEmpresa');
  const selectedText = dropdownSelected?.querySelector('.selected-text');
  
  if (!dropdownSelected || !dropdownOptions || !optionsList) return;
  
  // Toggle dropdown
  dropdownSelected.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = dropdownSelected.classList.contains('active');
    
    // Fechar outros dropdowns se houver
    document.querySelectorAll('.dropdown-selected.active').forEach(dropdown => {
      if (dropdown !== dropdownSelected) {
        dropdown.classList.remove('active');
        dropdown.parentElement.querySelector('.dropdown-options').classList.remove('show');
      }
    });
    
    if (isActive) {
      dropdownSelected.classList.remove('active');
      dropdownOptions.classList.remove('show');
    } else {
      dropdownSelected.classList.add('active');
      dropdownOptions.classList.add('show');
      // Focar no campo de busca quando abrir
      setTimeout(() => searchInput?.focus(), 100);
    }
  });
  
  // Busca no dropdown
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const options = optionsList.querySelectorAll('.option');
      
      options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          option.classList.remove('hidden');
        } else {
          option.classList.add('hidden');
        }
      });
    });
    
    // Prevenir fechamento quando clicar no input de busca
    searchInput.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  // Seleção de opção
  optionsList.addEventListener('click', function(e) {
    if (e.target.classList.contains('option') && !e.target.classList.contains('hidden')) {
      const value = e.target.dataset.value;
      const text = e.target.textContent;
      
      // Atualizar seleção visual
      optionsList.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      e.target.classList.add('selected');
      
      // Atualizar texto selecionado
      if (selectedText) {
        selectedText.textContent = text;
      }
      
      // Atualizar select oculto para compatibilidade
      const selectEmpresa = document.getElementById('empresaFiltroVideo');
      if (selectEmpresa) {
        selectEmpresa.value = value;
        // Disparar evento change para compatibilidade
        selectEmpresa.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Fechar dropdown
      dropdownSelected.classList.remove('active');
      dropdownOptions.classList.remove('show');
      
      // Limpar busca
      if (searchInput) {
        searchInput.value = '';
        optionsList.querySelectorAll('.option').forEach(opt => opt.classList.remove('hidden'));
      }
    }
  });
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', function() {
    dropdownSelected.classList.remove('active');
    dropdownOptions.classList.remove('show');
  });
  
  // Fechar dropdown com ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      dropdownSelected.classList.remove('active');
      dropdownOptions.classList.remove('show');
    }
  });
}
