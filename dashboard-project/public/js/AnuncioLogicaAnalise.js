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

// Função para organizar dados simplificada - apenas empresa e anúncios
function organizarDadosSimplificados(dadosAnuncios, nomeEmpresa) {
  const estrutura = {
    empresa: nomeEmpresa,
    totalAnuncios: dadosAnuncios.length,
    totalVisualizacoes: 0,
    totalAlcance: 0,
    totalConversoes: 0,
    mediaCPL: 0,
    anuncios: []
  };

  let somaCPL = 0;
  let anunciosComCPL = 0;

  dadosAnuncios.forEach(anuncio => {
    const anuncioProcessado = {
      campanha: anuncio.campanha || 'Campanha Desconhecida',
      grupo: anuncio.grupo || 'Grupo Desconhecido',
      nome: anuncio.nome || 'Anúncio Sem Nome',
      imagem: anuncio.img || anuncio.thumbnail || anuncio.imagem || anuncio.image || anuncio.foto || anuncio.url_imagem || '',
      visualizacoes: parseInt(anuncio.visualizacoes) || 0,
      alcance: parseInt(anuncio.alcance) || 0,
      cpl: parseFloat(anuncio.cpl) || 0,
      conversoes: parseFloat(anuncio.conversoes) || parseFloat(anuncio.convs) || parseFloat(anuncio.resultados) || 0,
      id: anuncio.id || `anuncio_${Date.now()}_${Math.random()}`
    };

    estrutura.anuncios.push(anuncioProcessado);
    
    // Somar totais
    estrutura.totalVisualizacoes += anuncioProcessado.visualizacoes;
    estrutura.totalAlcance += anuncioProcessado.alcance;
    estrutura.totalConversoes += anuncioProcessado.conversoes;
    
    if (anuncioProcessado.cpl > 0) {
      somaCPL += anuncioProcessado.cpl;
      anunciosComCPL++;
    }
  });

  // Calcular média CPL
  estrutura.mediaCPL = anunciosComCPL > 0 ? (somaCPL / anunciosComCPL) : 0;
  
  return estrutura;
}

// Função para renderizar cards das empresas com anúncios
function renderizarCardsEmpresas(dadosEmpresas) {
  const container = document.getElementById('cardsEmpresas');
  if (!container) return;

  container.innerHTML = '';

  if (!dadosEmpresas || dadosEmpresas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>Nenhum anúncio encontrado</h3>
        <p>Aplique filtros diferentes para visualizar os dados</p>
      </div>
    `;
    return;
  }

  let totalGeralAnuncios = 0;
  dadosEmpresas.forEach(empresaData => {
    totalGeralAnuncios += empresaData.totalAnuncios;
    
    const empresaCard = document.createElement('div');
    empresaCard.className = 'empresa-card';
    empresaCard.dataset.empresa = empresaData.empresa;

    empresaCard.innerHTML = `
      <div class="empresa-header" onclick="toggleEmpresaCard('${empresaData.empresa}')">
        <div class="empresa-info">
          <div class="empresa-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="empresa-details">
            <h3>${empresaData.empresa}</h3>
            <div class="empresa-stats">
              <span><i class="fas fa-ad me-1"></i>${empresaData.totalAnuncios} anúncios</span>
              <span><i class="fas fa-eye me-1"></i>${formatarNumero(empresaData.totalVisualizacoes)} visualizações</span>
              <span><i class="fas fa-users me-1"></i>${formatarNumero(empresaData.totalAlcance)} alcance</span>
              <span><i class="fas fa-trophy me-1"></i>${empresaData.totalConversoes} conversões</span>
            </div>
          </div>
        </div>
        <button class="expand-btn">
          <span>Ver Anúncios</span>
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
      
      <div class="anuncios-container">
        <table class="tabela-anuncios">
          <thead>
            <tr>
              <th>Campanha</th>
              <th>Grupo</th>
              <th>Anúncio</th>
              <th>Imagem</th>
              <th>Visualizações</th>
              <th>Alcance</th>
              <th>CPL</th>
              <th>Conversões</th>
            </tr>
          </thead>
          <tbody>
            ${empresaData.anuncios.map(anuncio => `
              <tr>
                <td>${anuncio.campanha}</td>
                <td>${anuncio.grupo}</td>
                <td>${anuncio.nome}</td>
                <td>
                  ${anuncio.imagem ? 
                    `<div class="imagem-container">
                       <img src="${anuncio.imagem}" alt="${anuncio.nome}" class="anuncio-imagem" onerror="mostrarErroImagem(this);">
                       <button class="btn-expandir-imagem" onclick="expandirImagemAnuncio('${anuncio.imagem}', '${anuncio.nome}', ${anuncio.visualizacoes}, ${anuncio.alcance}, ${anuncio.cpl})" title="Expandir imagem">
                         <i class="fas fa-expand"></i>
                       </button>
                       <div class="imagem-erro" style="display:none;">
                         <i class="fas fa-image"></i>
                         <small>Erro ao carregar</small>
                       </div>
                     </div>` :
                    '<div class="sem-imagem"><i class="fas fa-image"></i><small>Sem imagem</small></div>'
                  }
                </td>
                <td><span class="valor-metrica">${formatarNumero(anuncio.visualizacoes)}</span></td>
                <td><span class="valor-metrica">${formatarNumero(anuncio.alcance)}</span></td>
                <td><span class="valor-metrica">${formatarMoeda(anuncio.cpl)}</span></td>
                <td><span class="valor-metrica ${anuncio.conversoes > 0 ? 'valor-positivo' : ''}">${anuncio.conversoes}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(empresaCard);
  });

  // Atualizar contador total
  const totalElement = document.getElementById('totalAnuncios');
  if (totalElement) {
    totalElement.textContent = totalGeralAnuncios;
  }
}

// Função para toggle do card da empresa
function toggleEmpresaCard(nomeEmpresa) {
  const card = document.querySelector(`.empresa-card[data-empresa="${nomeEmpresa}"]`);
  if (!card) return;

  card.classList.toggle('expandida');
}

// Função para tratar erro de carregamento de imagem
function mostrarErroImagem(imgElement) {
  imgElement.style.display = 'none';
  const container = imgElement.parentElement;
  const erroDiv = container.querySelector('.imagem-erro');
  if (erroDiv) {
    erroDiv.style.display = 'flex';
  }
}

// Função auxiliar para expandir imagem do anúncio
function expandirImagemAnuncio(imagemSrc, nomeAnuncio, visualizacoes, alcance, cpl) {
  const dadosAnuncio = {
    visualizacoes: visualizacoes || 0,
    alcance: alcance || 0,
    cpl: cpl || 0
  };
  abrirImagemModal(imagemSrc, nomeAnuncio, dadosAnuncio);
}

// Função para abrir modal de imagem usando o modal do Bootstrap
function abrirImagemModal(imagemSrc, nomeAnuncio, anuncioData = {}) {
  // Elementos do modal Bootstrap
  const modalElement = document.getElementById('modalImagemAnuncio');
  const imagemExpandida = document.getElementById('imagemExpandida');
  const infoAnuncio = document.getElementById('infoAnuncio');
  const visualizacoesModal = document.getElementById('visualizacoesModal');
  const alcanceModal = document.getElementById('alcanceModal');
  const cplModal = document.getElementById('cplModal');
  const linkImagemOriginal = document.getElementById('linkImagemOriginal');
  
  if (!modalElement || !imagemExpandida) {
    console.error('Modal de imagem não encontrado');
    return;
  }

  // Configurar conteúdo do modal
  imagemExpandida.src = imagemSrc;
  imagemExpandida.alt = nomeAnuncio;
  
  if (infoAnuncio) {
    infoAnuncio.textContent = nomeAnuncio;
  }
  
  // Atualizar métricas se disponíveis
  if (visualizacoesModal && anuncioData.visualizacoes !== undefined) {
    visualizacoesModal.textContent = formatarNumero(anuncioData.visualizacoes);
  }
  
  if (alcanceModal && anuncioData.alcance !== undefined) {
    alcanceModal.textContent = formatarNumero(anuncioData.alcance);
  }
  
  if (cplModal && anuncioData.cpl !== undefined) {
    cplModal.textContent = parseFloat(anuncioData.cpl).toFixed(2);
  }
  
  if (linkImagemOriginal) {
    linkImagemOriginal.href = imagemSrc;
  }
  
  // Mostrar modal usando Bootstrap
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
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

// Função para mostrar loading no container de cards
function mostrarLoadingTabela() {
  const container = document.getElementById('cardsEmpresas');
  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner-border text-primary me-2" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
        <span>Carregando dados dos anúncios...</span>
      </div>
    `;
  }
}

// Função para mostrar erro no container de cards
function mostrarErroTabela(mensagem) {
  const container = document.getElementById('cardsEmpresas');
  if (container) {
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erro ao carregar dados</h3>
        <p>${mensagem}</p>
        <button class="btn btn-primary btn-sm" onclick="aplicarFiltrosMetricasVideo()">
          <i class="fas fa-redo me-1"></i>Tentar novamente
        </button>
      </div>
    `;
  }
}

// Função para mostrar mensagem de dados vazios
function mostrarTabelaVazia() {
  const container = document.getElementById('cardsEmpresas');
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>Nenhum anúncio encontrado</h3>
        <p>Tente ajustar os filtros ou verificar se existem dados para o período selecionado</p>
      </div>
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
    // Organizar dados por empresa (nova estrutura simplificada)
    const dadosEstruturados = [];
    
    if (empresaSelecionada === 'todas') {
      // Buscar dados de todas as empresas
      for (const empresa of empresasDisponiveis) {
        if (empresa.contaDeAnuncio) {
          const dados = await buscarDadosAnuncios(empresa.contaDeAnuncio);
          if (dados && dados.data && Array.isArray(dados.data)) {
            const anunciosFiltrados = aplicarFiltrosLocais(dados.data, filtroNomeCampanha);
            if (anunciosFiltrados.length > 0) {
              const estrutura = organizarDadosSimplificados(anunciosFiltrados, empresa.nome);
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
          const estrutura = organizarDadosSimplificados(anunciosFiltrados, empresaSelecionadaObj.nome);
          dadosEstruturados.push(estrutura);
        }
      }
    }
    
    // Filtrar por data (se implementado na API)
    // Nota: A filtragem por data seria melhor implementada na API para melhor performance
    
    // Renderizar dados usando nova estrutura de cards
    renderizarCardsEmpresas(dadosEstruturados);
    
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
