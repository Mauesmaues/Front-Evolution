// Variável global para armazenar dados dos leads
window.leadsData = [];
window.leadsGlobais = [];

// Variável global para armazenar empresas e filtro atual
window.empresasCRM = []; // ⭐ Array para armazenar empresas
window.empresaIdFiltroAtual = ''; // '' = todas, ou ID específico da empresa

// ⭐ Variável global para armazenar stages da empresa
window.stagesEmpresa = [];

// ========================================
// FUNÇÕES DE LOADING
// ========================================

/**
 * Mostra loading no container do CRM
 */
function mostrarLoadingCRM(mensagem = 'Carregando...') {
    const loadingContainer = document.getElementById('crmLoadingContainer');
    const loadingMessage = document.getElementById('crmLoadingMessage');
    const kanbanBoard = document.getElementById('crmKanbanBoard');
    
    if (loadingContainer) {
        if (loadingMessage) {
            loadingMessage.textContent = mensagem;
        }
        loadingContainer.style.display = 'flex'; // Usar flex ao invés de block
        
        // Esconder kanban board
        if (kanbanBoard) {
            kanbanBoard.style.opacity = '0.3';
        }
    }
    
    console.log(`⏳ [CRM] Loading exibido: ${mensagem}`);
}

/**
 * Esconde loading do container do CRM
 */
function esconderLoadingCRM() {
    const loadingContainer = document.getElementById('crmLoadingContainer');
    const kanbanBoard = document.getElementById('crmKanbanBoard');
    
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
        
        // Mostrar kanban board
        if (kanbanBoard) {
            kanbanBoard.style.opacity = '1';
        }
    }
    
    console.log('✅ [CRM] Loading escondido');
}

// ========================================
// FUNÇÕES DE STAGES DINÂMICOS
// ========================================

/**
 * Carrega stages da empresa atual
 * Retorna stages personalizados ou padrão
 */
async function carregarStagesEmpresa(empresaId) {
    try {
        console.log(`📋 [CRM] Carregando stages da empresa ${empresaId || 'padrão'}...`);
        
        // Se não tiver empresa, usar stages padrão
        if (!empresaId) {
            console.log('ℹ️ [CRM] Sem empresa selecionada, usando stages padrão');
            window.stagesEmpresa = getStagesPadrao();
            return window.stagesEmpresa;
        }
        
        const response = await fetch(`/api/stages/${empresaId}`);
        
        if (!response.ok) {
            console.warn('⚠️ [CRM] Erro ao buscar stages, usando padrão');
            window.stagesEmpresa = getStagesPadrao();
            return window.stagesEmpresa;
        }
        
        const resultado = await response.json();
        
        if (resultado.success && resultado.data && resultado.data.estagios) {
            window.stagesEmpresa = resultado.data.estagios;
            console.log(`✅ [CRM] ${window.stagesEmpresa.length} stages carregados`);
            return window.stagesEmpresa;
        } else {
            console.warn('⚠️ [CRM] Resposta inválida, usando stages padrão');
            window.stagesEmpresa = getStagesPadrao();
            return window.stagesEmpresa;
        }
    } catch (error) {
        console.error('❌ [CRM] Erro ao carregar stages:', error);
        window.stagesEmpresa = getStagesPadrao();
        return window.stagesEmpresa;
    }
}

/**
 * Retorna stages padrão
 */
function getStagesPadrao() {
    return [
        { id: 'entrou', nome: 'Entrou', cor: '#2196F3', ordem: 1 },
        { id: 'qualificado', nome: 'Qualificado', cor: '#FF9800', ordem: 2 },
        { id: 'conversao', nome: 'Conversão', cor: '#9C27B0', ordem: 3 },
        { id: 'ganho', nome: 'Ganho', cor: '#4CAF50', ordem: 4 }
    ];
}

/**
 * Renderiza as colunas do Kanban baseado nos stages
 */
function renderizarColunasKanban() {
    const kanbanContainer = document.querySelector('#crmKanbanBoard');
    
    if (!kanbanContainer) {
        console.error('❌ [CRM] Container do Kanban não encontrado');
        return;
    }
    
    console.log(`🎨 [CRM] Renderizando ${window.stagesEmpresa.length} colunas...`);
    
    // Ordenar stages
    const stagesOrdenados = [...window.stagesEmpresa].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    
    // Limpar container
    kanbanContainer.innerHTML = '';
    
    // Criar cada coluna
    stagesOrdenados.forEach(stage => {
        const coluna = criarColunaKanban(stage);
        kanbanContainer.appendChild(coluna);
    });
    
    // ⭐ Re-anexar event listeners de drag & drop
    const colunas = document.querySelectorAll('.crm-column-body');
    colunas.forEach(coluna => {
        coluna.addEventListener('dragover', allowDrop);
        coluna.addEventListener('drop', drop);
        coluna.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
    });
    
    console.log('✅ [CRM] Colunas renderizadas com event listeners');
}

/**
 * Cria elemento HTML de uma coluna do Kanban
 */
function criarColunaKanban(stage) {
    const colDiv = document.createElement('div');
    colDiv.className = 'crm-column';
    colDiv.setAttribute('data-stage', stage.id);
    
    colDiv.innerHTML = `
        <div class="crm-column-header text-white text-center p-3 rounded-top" style="background-color: ${stage.cor}">
            <h6 class="mb-0">${stage.nome}</h6>
            <small class="contador-stage">(0)</small>
        </div>
        <div class="crm-column-body bg-light p-3 rounded-bottom" 
             style="min-height: 400px;" 
             ondrop="drop(event)" 
             ondragover="allowDrop(event)">
            <!-- Cards serão adicionados aqui -->
        </div>
    `;
    
    return colDiv;
}

// ========================================
// FUNÇÕES DE FILTRO POR EMPRESA
// ========================================

/**
 * Carrega empresas disponíveis e popula o select
 * Segue o mesmo padrão do painel de notificações
 */
async function carregarEmpresasDisponiveisCRM() {
    const TIMEOUT_MS = 10000; // 10 segundos
    let timeoutId;
    try {
        console.log('🏢 [CRM] Carregando empresas disponíveis...');
        // Timeout para evitar loading infinito
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Tempo excedido ao carregar empresas')), TIMEOUT_MS);
        });
        // Fetch real
        const fetchPromise = (async () => {
            const resposta = await fetch('/api/buscarEmpresas');
            
            if (!resposta.ok) {
                if (resposta.status === 401) {
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(`Erro ao buscar empresas: ${resposta.status}`);
            }
            
            const dados = await resposta.json();
            console.log('📦 [CRM] Resposta da API:', dados);
            
            // Backend retorna { success: true, data: [...] }
            if (dados.success && Array.isArray(dados.data)) {
                window.empresasCRM = dados.data;
                console.log(`✅ [CRM] ${dados.data.length} empresas carregadas`);
                
                // Atualizar o select de filtro
                atualizarFiltroEmpresasCRM();
            } else {
                console.error('❌ [CRM] Formato de resposta inválido:', dados);
                throw new Error('Formato de resposta inválido');
            }
        })();
        // Corrida entre fetch e timeout
        await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);
    } catch (erro) {
        clearTimeout(timeoutId);
        console.error('❌ [CRM] Erro ao carregar empresas:', erro);
        const filtroEmpresa = document.getElementById('filtroEmpresaCRM');
        if (filtroEmpresa) {
            filtroEmpresa.innerHTML = '<option value="">Erro ao carregar empresas</option>';
        }
        mostrarLoadingCRM('Erro ao carregar empresas. Tente novamente mais tarde.');
        setTimeout(() => esconderLoadingCRM(), 4000);
        throw erro;
    }
}

/**
 * Atualiza o select de filtro com as empresas disponíveis
 * Segue exatamente o padrão de notificacoes.js
 */
function atualizarFiltroEmpresasCRM() {
    const filtroEmpresa = document.getElementById('filtroEmpresaCRM');
    
    if (!filtroEmpresa) {
        console.error('❌ [CRM] Select #filtroEmpresaCRM não encontrado');
        return;
    }
    
    console.log('🎨 [CRM] Atualizando select com empresas...');
    
    // Limpar e adicionar opção "Todas"
    filtroEmpresa.innerHTML = '<option value="">Todas as empresas</option>';
    
    // Adicionar cada empresa
    window.empresasCRM.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        filtroEmpresa.appendChild(option);
    });
    
    console.log(`✅ [CRM] Select populado com ${filtroEmpresa.options.length} opções`);
}

/**
 * Filtra os leads por empresa selecionada
 * Segue o padrão de notificacoes.js -> filtrarNotificacoes()
 * ⭐ ATUALIZADO: Recarrega stages ao mudar empresa
 */
async function filtrarLeadsPorEmpresaCRM() {
    const filtroEmpresaId = document.getElementById('filtroEmpresaCRM').value;
    console.log('🔄 [CRM] Filtrando por empresa:', filtroEmpresaId || 'TODAS');
    
    // ⚠️ Se "Todas empresas" selecionado, mostrar aviso
    if (!filtroEmpresaId || filtroEmpresaId === '') {
        console.log('⚠️ [CRM] Nenhuma empresa selecionada');
        esconderLoadingCRM();
        mostrarAvisoSelecaoEmpresa();
        return;
    }
    
    try {
        // ⏳ Mostrar loading enquanto carrega
        mostrarLoadingCRM('Carregando stages da empresa...');
        
        // ⭐ 1. Carregar stages da empresa selecionada
        await carregarStagesEmpresa(filtroEmpresaId);
        
        // ⭐ 2. Renderizar colunas com os stages
        renderizarColunasKanban();
        
        // ⏳ Atualizar mensagem de loading
        mostrarLoadingCRM('Carregando leads...');
        
        // ⭐ 3. Carregar leads se ainda não foram carregados
        if (window.leadsGlobais.length === 0) {
            await carregarLeadsCRM();
        }
        
        // ⭐ 4. Renderizar leads filtrados pela empresa
        renderizarLeadsCRM(filtroEmpresaId);
        
        // ✅ Esconder loading
        esconderLoadingCRM();
        
        console.log('✅ [CRM] Filtro aplicado com sucesso');
    } catch (error) {
        console.error('❌ [CRM] Erro ao filtrar:', error);
        esconderLoadingCRM();
        mostrarErroCarregamento();
    }
}

/**
 * Renderiza os leads no Kanban com filtro opcional de empresa
 * Segue o padrão de notificacoes.js -> renderizarNotificacoes()
 */
function renderizarLeadsCRM(filtroEmpresaId = '') {
    console.log('🎨 [CRM] Renderizando leads com filtro:', filtroEmpresaId || 'TODAS');
    
    // Filtrar leads se necessário
    let leadsFiltrados = window.leadsGlobais;
    
    if (filtroEmpresaId) {
        leadsFiltrados = window.leadsGlobais.filter(item => {
            const empresaIdLead = item.lead.empresa_id || 
                                  item.lead.dados_originais?.empresa_id;
            return empresaIdLead && empresaIdLead.toString() === filtroEmpresaId;
        });
        console.log(`📋 [CRM] ${leadsFiltrados.length} leads da empresa ${filtroEmpresaId}`);
    } else {
        console.log(`📋 [CRM] Exibindo TODOS os ${leadsFiltrados.length} leads`);
    }
    
    // Limpar colunas
    limparColunasEContadores();
    
    // Renderizar cada lead filtrado com seu stage correto
    leadsFiltrados.forEach(item => {
        // ⭐ Criar objeto resposta simulado
        const respostaSimulada = {
            id: item.lead.id,
            created_time: item.lead.created_time,
            nome: item.lead.nome,
            email: item.lead.email,
            telefone: item.lead.telefone,
            respostas: item.lead.respostas
        };
        
        // ⭐ Passar o stageSalva correto para posicionar o lead
        criarCardLead(respostaSimulada, item.lead.formulario, item.stageSalva);
        
        console.log(`📌 [CRM] Lead ${item.lead.nome} renderizado no stage: ${item.stageSalva}`);
    });
    
    // Atualizar contadores
    atualizarContadoresColunas();
    
    // Atualizar info de leads filtrados
    atualizarInfoLeadsFiltrados();
}

/**
 * Atualiza contador de leads filtrados
 */
function atualizarInfoLeadsFiltrados() {
    const totalElement = document.getElementById('totalLeadsFiltrados');
    
    if (totalElement) {
        // Contar cards visíveis em todas as colunas
        const todasColunas = document.querySelectorAll('.crm-column-body');
        let totalLeads = 0;
        
        todasColunas.forEach(coluna => {
            const cards = coluna.querySelectorAll('.lead-card');
            totalLeads += cards.length;
        });
        
        totalElement.textContent = totalLeads;
    }
}

// ========================================
// FIM - FUNÇÕES DE FILTRO POR EMPRESA
// ========================================

// Função para obter dados do usuário da sessão
async function obterUsuarioSessao() {
    try {
        const response = await fetch('/api/session-user');
        
        // Se não autenticado (401), redireciona para login
        if (response.status === 401) {
            console.log('Usuário não autenticado, redirecionando para login');
            window.location.href = '/login.html';
            return null;
        }
        
        const result = await response.json();
        if (result.usuario) {
            return result.usuario;
        } else {
            return { nome: 'Usuário Anônimo' };
        }
    } catch (error) {
        console.error('Erro ao obter usuário da sessão:', error);
        // Em caso de erro, redireciona para login
        window.location.href = '/login.html';
        return null;
    }
}

// Função principal para carregar leads do CRM
async function carregarLeadsCRM() {
    try {
        // Mostrar loading overlay
        LoadingUtils.showOverlay('Carregando leads do CRM...');
        
        // Limpar colunas e reinicializar variáveis globais
        limparColunasEContadores();
        window.leadsGlobais = [];
        window.leadsData = [];
        
        console.log('📥 [CRM] Buscando leads do banco de dados...');
        
        // Buscar leads do backend (já vêm filtrados por empresa se for USER)
        const response = await fetch('/api/leads');
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error(`Erro da API: ${response.status}`);
        }
        
        const resultado = await response.json();
        
        if (resultado.success && resultado.data) {
            const leads = resultado.data;
            console.log(`✅ [CRM] ${leads.length} leads recebidos do banco`);
            
            // Processar cada lead do banco
            leads.forEach(lead => {
                processarLeadDoBanco(lead);
            });
            
            // Atualizar contadores após carregar todos os leads
            atualizarContadoresColunas();
            
            // ⭐ Atualizar info de leads filtrados
            atualizarInfoLeadsFiltrados();
            
            LoadingUtils.hideOverlay();
            console.log(`✅ [CRM] ${leads.length} leads carregados e renderizados!`);
        } else {
            console.log('⚠️ [CRM] Nenhum lead encontrado');
            LoadingUtils.hideOverlay();
        }
    } catch (error) {
        LoadingUtils.hideOverlay();
        console.error('❌ [CRM] Erro ao carregar leads:', error);
        mostrarErroCarregamento();
    }
}

// Função para processar lead que veio do banco de dados
function processarLeadDoBanco(lead) {
    // Extrair informações principais
    const nome = lead.nome || 'Nome não informado';
    const email = lead.email || 'Email não informado';
    const telefone = lead.telefone || 'Telefone não informado';
    const stage = lead.stage || 'entrou';
    
    // Extrair dados extras do JSONB
    const dadosOriginais = lead.dados_originais || {};
    const empresa = dadosOriginais.empresa || 'Empresa não informada';
    const origem = dadosOriginais.origem || 'Origem não informada';
    const empresaId = dadosOriginais.empresa_id; // ⭐ Extrair empresa_id para filtro
    
    // Criar objeto do lead normalizado para compatibilidade com código existente
    const leadData = {
        id: lead.id,
        created_time: lead.created_at || lead.data_entrada,
        nome: nome,
        email: email,
        telefone: telefone,
        stage: stage,
        empresa: empresa,
        empresa_id: empresaId, // ⭐ Adicionar empresa_id ao leadData
        origem: origem,
        respostas: {
            full_name: [nome],
            email: [email],
            phone_number: [telefone]
        },
        dados_originais: dadosOriginais,
        formulario: { 
            nome: origem,
            id: 'banco_dados' 
        }
    };
    
    // Adicionar campos extras das respostas
    Object.keys(dadosOriginais).forEach(chave => {
        // Pular campos que já foram mapeados
        if (!['empresa_id', 'empresa', 'origem', 'criado_por', 'criado_por_id'].includes(chave)) {
            leadData.respostas[chave] = [dadosOriginais[chave]];
        }
    });
    
    // Armazenar dados globalmente (formato atualizado para suportar filtro)
    window.leadsData.push(leadData);
    window.leadsGlobais.push({
        lead: leadData,
        stageSalva: stage
    });
    
    // Criar objeto resposta simulado para compatibilidade
    const respostaSimulada = {
        id: lead.id,
        created_time: leadData.created_time,
        nome: nome,
        email: email,
        telefone: telefone,
        respostas: leadData.respostas
    };
    
    // Criar card visual
    criarCardLead(respostaSimulada, leadData.formulario, stage);
}

// Função para limpar colunas e contadores
function limparColunasEContadores() {
    const colunas = document.querySelectorAll('.crm-column-body');
    colunas.forEach(coluna => {
        coluna.innerHTML = '';
    });
}

// Função para criar card individual do lead
function criarCardLead(resposta, formulario, stageSalva = null) {
    const leadId = resposta.id;
    
    // PRIORIDADE: Stage do banco de dados (se vier do carregamento)
    // Se stageSalva for null, usa 'entrou' como padrão
    // localStorage NÃO é mais usado para posicionamento inicial
    const posicaoSalva = stageSalva || 'entrou';
    
    // Extrair informações principais
    const nome = resposta.respostas.full_name ? resposta.respostas.full_name[0] : 'Nome não informado';
    const email = resposta.respostas.email ? resposta.respostas.email[0] : 'Email não informado';
    const telefone = resposta.respostas.phone_number && resposta.respostas.phone_number.length > 0 
        ? resposta.respostas.phone_number[0] : 'Telefone não informado';
    
    // Formatear data
    const dataFormatada = new Date(resposta.created_time).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Carregar comentários salvos
    const comentarios = JSON.parse(localStorage.getItem(`lead_comments_${leadId}`)) || [];
    const ultimoComentario = comentarios.length > 0 ? comentarios[comentarios.length - 1] : null;
    
    // Criar HTML do card
    const cardHTML = `
        <div class="lead-card" data-lead-id="${leadId}" draggable="true" ondragstart="drag(event)">
            <div class="lead-header">
                <h6 class="lead-name">${nome}</h6>
                <div class="lead-header-actions">
                    <button class="btn-expand" onclick="expandirCard('${leadId}')" title="Expandir card">
                        <i class="fas fa-expand-alt"></i>
                    </button>
                    <small class="lead-date">${dataFormatada}</small>
                </div>
            </div>
            <div class="lead-contact">
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <span class="contact-text">${email}</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span class="contact-text">${telefone}</span>
                </div>
            </div>
            <div class="lead-details">
                ${criarDetalhesResposta(resposta.respostas)}
            </div>
            
            <div class="lead-footer">
                <small class="text-muted">Form: ${formulario.nome}</small>
                ${ultimoComentario ? `<small class="comment-indicator"><i class="fas fa-comment"></i> ${comentarios.length} comentário(s)</small>` : ''}
            </div>
            <div class="lead-actions">
                <button class="btn-comment" onclick="abrirPopupComentario('${leadId}')" title="Comentários">
                    <i class="fas fa-comments"></i>
                    ${comentarios.length > 0 ? `<span class="comment-badge">${comentarios.length}</span>` : ''}
                </button>
                <button class="btn-whatsapp-main" onclick="chamarWhatsApp('${telefone}', '${nome}')" title="Chamar no WhatsApp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-lead-qualificado" onclick="abrirModalLeadQualificado('${leadId}')" title="Marcar como lead qualificado">
                    <i class="fas fa-star"></i> Lead Qualificado
                </button>
            </div>
        </div>
    `;
    
    // Adicionar card na coluna correspondente
    const coluna = document.querySelector(`.crm-column[data-stage="${posicaoSalva}"] .crm-column-body`);
    if (coluna) {
        coluna.insertAdjacentHTML('beforeend', cardHTML);
    } else {
        // Se não encontrar a coluna salva, adicionar na coluna "entrou"
        const colunaEntrou = document.querySelector('.crm-column[data-stage="entrou"] .crm-column-body');
        if (colunaEntrou) {
            colunaEntrou.insertAdjacentHTML('beforeend', cardHTML);
        }
    }
}

// Função para criar detalhes da resposta (perguntas específicas)
function criarDetalhesResposta(respostas) {
    let detalhesHTML = '<div class="lead-custom-fields">';
    
    // Iterar sobre todas as respostas, exceto as básicas (nome, email, telefone)
    Object.keys(respostas).forEach(pergunta => {
        if (!['full_name', 'email', 'phone_number'].includes(pergunta)) {
            const resposta = respostas[pergunta];
            if (resposta && resposta.length > 0) {
                const perguntaLimpa = pergunta.replace(/_/g, ' ').replace(/\?/g, '').replace(/\b\w/g, l => l.toUpperCase());
                detalhesHTML += `
                    <div class="custom-field">
                        <strong>${perguntaLimpa}:</strong>
                        <span>${resposta[0]}</span>
                    </div>
                `;
            }
        }
    });
    
    detalhesHTML += '</div>';
    return detalhesHTML;
}

// Funções de Drag & Drop
function allowDrop(ev) {
    ev.preventDefault();
    const coluna = ev.target.closest('.crm-column-body');
    if (coluna) {
        coluna.classList.add('drag-over');
    }
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.getAttribute('data-lead-id'));
    ev.target.style.opacity = "0.5";
}

function drop(ev) {
    ev.preventDefault();
    const leadId = ev.dataTransfer.getData("text");
    const leadCard = document.querySelector(`[data-lead-id="${leadId}"]`);
    
    // Remover classe de drag-over
    const todasColunas = document.querySelectorAll('.crm-column-body');
    todasColunas.forEach(col => col.classList.remove('drag-over'));
    
    if (leadCard) {
        // Restaurar opacidade
        leadCard.style.opacity = "1";
        
        // Encontrar a coluna de destino
        let target = ev.target;
        while (target && !target.classList.contains('crm-column-body')) {
            target = target.parentNode;
        }
        
        if (target && target.classList.contains('crm-column-body')) {
            // Mover o card
            target.appendChild(leadCard);
            
            // Salvar nova posição no localStorage (apenas como backup temporário durante o drag)
            const novaColuna = target.closest('.crm-column').getAttribute('data-stage');
            localStorage.setItem(`lead_position_${leadId}`, novaColuna);
            
            // Atualizar contadores
            atualizarContadoresColunas();
            
            console.log(`Lead ${leadId} movido para ${novaColuna}`);
            
            // Salvar no banco de dados (fonte única da verdade)
            salvarPosicaoNoBanco(leadId, novaColuna);
        }
    }
}

/**
 * Salva a nova posição do lead no banco de dados
 * @param {string} leadId - ID do lead
 * @param {string} novoStage - Novo stage (entrou, qualificado, conversao, ganho)
 */
async function salvarPosicaoNoBanco(leadId, novoStage) {
    try {
        console.log(`💾 Salvando stage do lead ${leadId} no banco: ${novoStage}`);
        
        const response = await fetch(`/api/leads/${leadId}/stage`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stage: novoStage })
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || 'Erro ao atualizar stage');
        }

        console.log(`✅ Stage do lead ${leadId} atualizado com sucesso no banco`);
        
        // Limpar localStorage após salvar com sucesso no banco
        // O banco de dados é agora a fonte única da verdade
        localStorage.removeItem(`lead_position_${leadId}`);
        console.log(`🗑️ localStorage limpo para lead ${leadId}`);
        
        // Atualizar o stage no array global para manter sincronizado
        if (window.leadsGlobais) {
            const leadIndex = window.leadsGlobais.findIndex(item => item.lead.id === leadId);
            if (leadIndex !== -1) {
                window.leadsGlobais[leadIndex].stageSalva = novoStage;
                window.leadsGlobais[leadIndex].lead.stage = novoStage;
            }
        }
        
        // Opcional: mostrar feedback visual
        if (typeof mostrarToast === 'function') {
            mostrarToast('Lead movido com sucesso!', 'success');
        }

    } catch (error) {
        console.error('❌ Erro ao salvar posição no banco:', error);
        
        // Opcional: mostrar erro ao usuário
        if (typeof mostrarToast === 'function') {
            mostrarToast('Erro ao mover lead. Tente novamente.', 'error');
        }
        
        // Em caso de erro, manter no localStorage como backup
        console.log(`⚠️ Mantendo posição no localStorage como backup devido ao erro`);
    }
}

// Função para atualizar contadores das colunas
function atualizarContadoresColunas() {
    const colunas = document.querySelectorAll('.crm-column');
    colunas.forEach(coluna => {
        const cards = coluna.querySelectorAll('.lead-card');
        
        // ⭐ Atualizar contador no header (classe .contador-stage)
        const contadorStage = coluna.querySelector('.contador-stage');
        if (contadorStage) {
            contadorStage.textContent = `(${cards.length})`;
        }
        
        // ⭐ Fallback: suporte ao contador antigo (se existir)
        const contador = coluna.querySelector('.column-counter');
        if (contador) {
            contador.textContent = cards.length;
        } else {
            // Criar contador se não existir (compatibilidade)
            const header = coluna.querySelector('.crm-column-header h6');
            if (header && !contadorStage) {
                const badge = document.createElement('span');
                badge.className = 'column-counter badge bg-secondary ms-2';
                badge.textContent = cards.length;
                header.appendChild(badge);
            }
        }
    });
}

// Função para editar lead (modal ou formulário)
function editarLead(leadId) {
    console.log(`Editando lead ${leadId}`);
    // Implementar modal de edição
    alert(`Função de edição do lead ${leadId} será implementada`);
}

// Função para abrir WhatsApp
function chamarWhatsApp(telefone, nome) {
    const telefoneFormatado = telefone.replace(/\D/g, ''); // Removes non-numeric characters
    const mensagem = `Olá ${nome}! Vi que você demonstrou interesse em nossos serviços. Como posso te ajudar?`;
    const url = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

// Função para expandir card
function expandirCard(leadId) {
    const card = document.querySelector(`[data-lead-id="${leadId}"]`);
    if (!card) return;
    
    // Buscar dados completos do lead
    const nomeCompleto = card.querySelector('.lead-name').textContent;
    const email = card.querySelector('.contact-text').textContent;
    const telefone = card.querySelectorAll('.contact-text')[1].textContent;
    const comentarios = JSON.parse(localStorage.getItem(`lead_comments_${leadId}`)) || [];
    const posicaoAtual = card.closest('.crm-column').getAttribute('data-stage');
    
    // Criar modal expandido
    const modalHTML = `
        <div class="lead-modal-overlay" onclick="fecharModalExpandido()">
            <div class="lead-modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h4>${nomeCompleto}</h4>
                    <button class="btn-close-modal" onclick="fecharModalExpandido()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="lead-info-expanded">
                        <div class="info-group">
                            <label>Email:</label>
                            <span>${email}</span>
                        </div>
                        <div class="info-group">
                            <label>Telefone:</label>
                            <span>${telefone}</span>
                            <button class="btn-action btn-whatsapp-small" onclick="chamarWhatsApp('${telefone}', '${nomeCompleto}')" title="Chamar no WhatsApp">
                                <i class="fab fa-whatsapp"></i> Chamar
                            </button>
                        </div>
                        <div class="info-group">
                            <label>Status Atual:</label>
                            <span class="status-badge status-${posicaoAtual}">${obterNomeStatus(posicaoAtual)}</span>
                        </div>
                    </div>
                    
                    <div class="comments-section-expanded">
                        <h5>Histórico de Comentários</h5>
                        <div class="comments-list" id="commentsListModal">
                            ${comentarios.length > 0 ? comentarios.map(comment => `
                                <div class="comment-item-expanded">
                                    <div class="comment-content">
                                        <p>${comment.texto}</p>
                                    </div>
                                    <div class="comment-meta">
                                        <span class="comment-author">👤 ${comment.usuario}</span>
                                        <span class="comment-date">📅 ${comment.dataHora}</span>
                                        <span class="comment-column">📍 ${obterNomeStatus(comment.coluna)}</span>
                                    </div>
                                </div>
                            `).join('') : '<p class="no-comments">Nenhum comentário ainda.</p>'}
                        </div>
                        
                        <div class="add-comment-section">
                            <textarea id="modalCommentInput" placeholder="Adicionar novo comentário..." rows="3"></textarea>
                            <button class="btn-add-comment-modal" onclick="adicionarComentarioModal('${leadId}')">
                                <i class="fas fa-paper-plane"></i> Adicionar Comentário
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Função para fechar modal expandido
function fecharModalExpandido() {
    const modal = document.querySelector('.lead-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Função para obter nome do status
function obterNomeStatus(status) {
    const statusMap = {
        'entrou': 'Entrou!',
        'agendou': 'Agendou',
        'analisando': 'Analisando',
        'fechou': 'Fechou!'
    };
    return statusMap[status] || status;
}

// Funções wrapper para eventos onclick
async function adicionarComentarioSync(leadId) {
    await adicionarComentario(leadId);
}

async function handleCommentKeyPressSync(event, leadId) {
    await handleCommentKeyPress(event, leadId);
}

// Função para obter comentários de um lead
function obterComentarios(leadId) {
    return JSON.parse(localStorage.getItem(`lead_comments_${leadId}`)) || [];
}

// Função para adicionar comentário
async function adicionarComentario(leadId, textoPersonalizado = null) {
    const card = document.querySelector(`[data-lead-id="${leadId}"]`);
    let texto;
    
    if (textoPersonalizado) {
        texto = textoPersonalizado.trim();
    } else {
        const textarea = card.querySelector('.comment-input');
        if (!textarea) return;
        texto = textarea.value.trim();
    }
    
    if (!texto) return;
    
    // Obter informações do comentário
    const agora = new Date();
    const usuarioSessao = await obterUsuarioSessao();
    const usuario = usuarioSessao.nome || 'Usuário Anônimo';
    const coluna = obterNomeStatus(card.closest('.crm-column').getAttribute('data-stage'));
    
    // Criar objeto do comentário
    const comentario = {
        id: Date.now(),
        texto: texto,
        timestamp: agora.getTime(),
        usuario: usuario,
        coluna: coluna
    };
    
    // Salvar no localStorage
    const comentarios = obterComentarios(leadId);
    comentarios.push(comentario);
    localStorage.setItem(`lead_comments_${leadId}`, JSON.stringify(comentarios));
    
    // Atualizar interface
    if (!textoPersonalizado) {
        const textarea = card.querySelector('.comment-input');
        if (textarea) textarea.value = '';
    }
    
    atualizarAreaComentarios(leadId, comentarios);
}

// Função para adicionar comentário no modal
function adicionarComentarioModal(leadId) {
    const textarea = document.getElementById('modalCommentInput');
    const texto = textarea.value.trim();
    
    if (!texto) return;
    
    // Usar a mesma lógica da função principal
    adicionarComentario(leadId);
    
    // Atualizar lista no modal
    const comentarios = JSON.parse(localStorage.getItem(`lead_comments_${leadId}`)) || [];
    const commentsList = document.getElementById('commentsListModal');
    
    if (comentarios.length > 0) {
        commentsList.innerHTML = comentarios.map(comment => `
            <div class="comment-item-expanded">
                <div class="comment-content">
                    <p>${comment.texto}</p>
                </div>
                <div class="comment-meta">
                    <span class="comment-author">👤 ${comment.usuario}</span>
                    <span class="comment-date">📅 ${comment.dataHora}</span>
                    <span class="comment-column">📍 ${obterNomeStatus(comment.coluna)}</span>
                </div>
            </div>
        `).join('');
    }
    
    textarea.value = '';
}

// Função para atualizar área de comentários no card
function atualizarAreaComentarios(leadId, comentarios) {
    const card = document.querySelector(`[data-lead-id="${leadId}"]`);
    const commentsArea = card.querySelector('.lead-comments-area');
    const ultimoComentario = comentarios.length > 0 ? comentarios[comentarios.length - 1] : null;
    
    // Atualizar apenas a seção de último comentário
    const lastCommentSection = commentsArea.querySelector('.last-comment');
    if (lastCommentSection) {
        lastCommentSection.remove();
    }
    
    if (ultimoComentario) {
        const lastCommentHTML = `
            <div class="last-comment">
                <span class="comment-text">${ultimoComentario.texto}</span>
                <i class="fas fa-info-circle comment-info-icon" 
                   onclick="mostrarInfoComentario('${leadId}')" 
                   title="Ver informações do comentário"></i>
            </div>
        `;
        commentsArea.insertAdjacentHTML('beforeend', lastCommentHTML);
    }
}

// Função para mostrar informações do comentário
function mostrarInfoComentario(leadId) {
    const comentarios = obterComentarios(leadId);
    if (comentarios.length === 0) {
        alert('Nenhum comentário encontrado para este lead.');
        return;
    }

    const ultimoComentario = comentarios[comentarios.length - 1];
    const data = new Date(ultimoComentario.timestamp);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    alert(`Informações do comentário:
    
👤 Usuário: ${ultimoComentario.usuario}
📅 Data: ${dataFormatada}
🕒 Hora: ${horaFormatada}
📍 Coluna: ${ultimoComentario.coluna}
📝 Total de comentários: ${comentarios.length}
    
💬 Comentário: "${ultimoComentario.texto}"`);
}

// Função expandirCard já definida anteriormente (linha 558)
// Removida duplicação

function renderizarTodosComentarios(leadId) {
    const comentarios = obterComentarios(leadId);
    if (comentarios.length === 0) {
        return '<p class="no-comments">💭 Nenhum comentário ainda.</p>';
    }

    return comentarios.map(comentario => {
        const data = new Date(comentario.timestamp);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="comment-item">
                <div class="comment-header">
                    <strong>👤 ${comentario.usuario}</strong>
                    <span class="comment-meta">📅 ${dataFormatada} às ${horaFormatada} • 📍 ${comentario.coluna}</span>
                </div>
                <div class="comment-text">${comentario.texto}</div>
            </div>
        `;
    }).join('');
}

async function adicionarComentarioModal(leadId) {
    const textarea = document.getElementById(`modal-comment-${leadId}`);
    const texto = textarea.value.trim();
    
    if (!texto) {
        alert('Por favor, digite um comentário.');
        return;
    }

    // Adicionar comentário
    await adicionarComentario(leadId, texto);
    
    // Limpar textarea
    textarea.value = '';
    
    // Atualizar lista de comentários no modal
    const commentsList = document.getElementById(`comments-list-${leadId}`);
    commentsList.innerHTML = renderizarTodosComentarios(leadId);
    
    // Atualizar card na tela principal
    carregarLeadsCRM();
}

// Função para handle do Enter no textarea
async function handleCommentKeyPress(event, leadId) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        await adicionarComentario(leadId);
    }
}

// Função para mostrar erro de carregamento
function mostrarErroCarregamento() {
    const colunaEntrou = document.querySelector('.crm-column[data-stage="entrou"] .crm-column-body');
    if (colunaEntrou) {
        colunaEntrou.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Erro ao carregar leads. 
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="carregarLeadsCRM()">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// Função para recarregar leads (útil para botão de refresh)
function recarregarLeads() {
    limparColunasEContadores();
    carregarLeadsCRM();
}

// Função para filtrar leads por texto
function filtrarLeads(termo) {
    const cards = document.querySelectorAll('.lead-card');
    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        if (texto.includes(termo.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar event listeners para evitar conflitos de drag
    const colunas = document.querySelectorAll('.crm-column-body');
    colunas.forEach(coluna => {
        coluna.addEventListener('dragover', allowDrop);
        coluna.addEventListener('drop', drop);
        coluna.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
    });
    
    // ⭐ Event listener para filtro de empresa (igual notificações)
    const filtroEmpresa = document.getElementById('filtroEmpresaCRM');
    if (filtroEmpresa) {
        filtroEmpresa.addEventListener('change', function() {
            filtrarLeadsPorEmpresaCRM();
        });
        console.log('✅ [CRM] Event listener do filtro configurado no DOMContentLoaded');
    } else {
        console.warn('⚠️ [CRM] Select de filtro não encontrado no DOM');
    }
});

// Integração com a navegação existente
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'crm') {
        // Aguardar o painel ser exibido
        setTimeout(async () => {
            const crmSection = document.getElementById('crmSection');
            if (crmSection && getComputedStyle(crmSection).display !== 'none') {
                try {
                    // ⏳ Mostrar loading inicial
                    mostrarLoadingCRM('Carregando empresas disponíveis...');
                    
                    // ⚡ ETAPA 1: Carregar APENAS empresas (super rápido)
                    await carregarEmpresasDisponiveisCRM();
                    
                    // ⚡ ETAPA 2: Criar colunas padrão vazias
                    await carregarStagesEmpresa(null);
                    renderizarColunasKanban();
                    
                    // ⚡ ETAPA 3: Esconder loading e mostrar aviso
                    esconderLoadingCRM();
                    mostrarAvisoSelecaoEmpresa();
                    
                    console.log('✅ [CRM] Interface pronta - aguardando seleção de empresa');
                    console.log('💡 [CRM] Stages e leads serão carregados quando empresa for selecionada');
                    
                } catch (error) {
                    console.error('❌ [CRM] Erro na inicialização:', error);
                    esconderLoadingCRM();
                    mostrarErroCarregamento();
                }
            }
        }, 100);
    }
});

// Função para abrir pop-up de comentários
function abrirPopupComentario(leadId) {
    const leadData = window.leadsGlobais?.find(lead => lead.id === leadId);
    if (!leadData) {
        console.error('Lead não encontrado');
        return;
    }

    const comentarios = obterComentarios(leadId);
    const nomeCompleto = leadData.respostas.find(r => r.campo === 'nome')?.valor || 'Lead sem nome';

    // Criar pop-up de comentários
    const popupHTML = `
        <div class="comment-popup-overlay" id="comment-popup-${leadId}" onclick="fecharPopupComentario('${leadId}')">
            <div class="comment-popup-content" onclick="event.stopPropagation()">
                <div class="comment-popup-header">
                    <h5><i class="fas fa-comments"></i> Comentários - ${nomeCompleto}</h5>
                    <button class="btn-close-popup" onclick="fecharPopupComentario('${leadId}')">&times;</button>
                </div>
                
                <div class="comment-popup-body">
                    <div class="comments-list" id="popup-comments-list-${leadId}">
                        ${renderizarComentariosPopup(leadId)}
                    </div>
                    
                    <div class="comment-input-section-popup">
                        <textarea id="popup-comment-${leadId}" class="comment-input-popup" placeholder="Digite seu comentário..."></textarea>
                        <button class="btn-add-comment-popup" onclick="adicionarComentarioPopup('${leadId}')" title="Adicionar comentário">
                            <i class="fas fa-paper-plane"></i> Comentar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Adicionar pop-up ao body
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    document.body.style.overflow = 'hidden';
    
    // Focar no textarea
    setTimeout(() => {
        const textarea = document.getElementById(`popup-comment-${leadId}`);
        if (textarea) textarea.focus();
    }, 100);
}

function fecharPopupComentario(leadId) {
    const popup = document.getElementById(`comment-popup-${leadId}`);
    if (popup) {
        popup.remove();
        document.body.style.overflow = 'auto';
    }
}

function renderizarComentariosPopup(leadId) {
    const comentarios = obterComentarios(leadId);
    if (comentarios.length === 0) {
        return '<div class="no-comments-popup">💭 Nenhum comentário ainda. Seja o primeiro a comentar!</div>';
    }

    return comentarios.map(comentario => {
        const data = new Date(comentario.timestamp);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="comment-item-popup">
                <div class="comment-header-popup">
                    <div class="comment-user-info">
                        <i class="fas fa-user-circle"></i>
                        <strong>${comentario.usuario}</strong>
                    </div>
                    <span class="comment-meta-popup">
                        <i class="fas fa-calendar"></i> ${dataFormatada} 
                        <i class="fas fa-clock"></i> ${horaFormatada} 
                        <i class="fas fa-tag"></i> ${comentario.coluna}
                    </span>
                </div>
                <div class="comment-text-popup">${comentario.texto}</div>
            </div>
        `;
    }).join('');
}

async function adicionarComentarioPopup(leadId) {
    const textarea = document.getElementById(`popup-comment-${leadId}`);
    const texto = textarea.value.trim();
    
    if (!texto) {
        alert('Por favor, digite um comentário.');
        return;
    }

    try {
        // Obter usuário da sessão
        const usuario = await obterUsuarioSessao();
        const nomeUsuario = usuario?.nome || 'Usuário';

        // Obter coluna atual do lead
        const leadCard = document.querySelector(`[data-lead-id="${leadId}"]`);
        const coluna = leadCard?.closest('.crm-column')?.getAttribute('data-stage') || 'desconhecida';

        const comentario = {
            texto: texto,
            timestamp: Date.now(),
            usuario: nomeUsuario,
            coluna: coluna
        };

        // Salvar comentário
        const comentarios = obterComentarios(leadId);
        comentarios.push(comentario);
        localStorage.setItem(`lead_comments_${leadId}`, JSON.stringify(comentarios));

        // Limpar textarea
        textarea.value = '';

        // Atualizar lista no pop-up
        const commentsList = document.getElementById(`popup-comments-list-${leadId}`);
        commentsList.innerHTML = renderizarComentariosPopup(leadId);

        // Scroll para o último comentário
        commentsList.scrollTop = commentsList.scrollHeight;

        // Atualizar card principal
        carregarLeadsCRM();

        console.log('Comentário adicionado com sucesso');
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        alert('Erro ao adicionar comentário. Tente novamente.');
    }
}

/**
 * Abre modal de confirmação para marcar lead como qualificado
 * @param {string} leadId - ID do lead
 */
function abrirModalLeadQualificado(leadId) {
    // Busca robusta: aceita string ou número
    const leadObj = window.leadsGlobais?.find(item => String(item.lead.id) === String(leadId));
    if (!leadObj) {
        console.error('Lead não encontrado', leadId, window.leadsGlobais.map(x => x.lead.id));
        return;
    }
    const leadData = leadObj.lead;
    const nome = leadData.nome || 'Lead sem nome';

    // Criar modal de confirmação
    const modalHTML = `
        <div class="modal-overlay-qualificado" id="modal-qualificado-${leadId}" onclick="fecharModalLeadQualificado('${leadId}')">
            <div class="modal-content-qualificado" onclick="event.stopPropagation()">
                <div class="modal-header-qualificado">
                    <h4><i class="fas fa-star text-warning"></i> Lead Qualificado</h4>
                    <button class="btn-close-modal" onclick="fecharModalLeadQualificado('${leadId}')">&times;</button>
                </div>
                
                <div class="modal-body-qualificado">
                    <div class="lead-info-qualificado">
                        <p class="lead-name-qualificado">
                            <i class="fas fa-user"></i> <strong>${nome}</strong>
                        </p>
                    </div>
                    
                    <div class="confirmacao-message">
                        <i class="fas fa-question-circle text-info fa-3x mb-3"></i>
                        <p class="text-center fs-5">
                            <strong>Realmente deseja enviar o lead para o META como qualificado?</strong>
                        </p>
                        <p class="text-muted text-center">
                            Ao fazer isso sua campanha será otimizada para buscar perfis semelhantes a este marcado como qualificado.
                        </p>
                    </div>
                    
                    <div class="beneficios-qualificacao">
                        <h6><i class="fas fa-check-circle text-success"></i> Benefícios:</h6>
                        <ul>
                            <li><i class="fas fa-bullseye"></i> Melhora o targeting dos anúncios</li>
                            <li><i class="fas fa-chart-line"></i> Otimiza a performance das campanhas</li>
                            <li><i class="fas fa-users"></i> Atrai leads com perfil semelhante</li>
                            <li><i class="fas fa-dollar-sign"></i> Reduz custo por lead qualificado</li>
                        </ul>
                    </div>
                </div>
                
                <div class="modal-footer-qualificado">
                    <button class="btn-cancelar-qualificado" onclick="fecharModalLeadQualificado('${leadId}')">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirmar-qualificado" onclick="confirmarLeadQualificado('${leadId}')">
                        <i class="fas fa-star"></i> Confirmar e Otimizar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha modal de lead qualificado
 * @param {string} leadId - ID do lead
 */
function fecharModalLeadQualificado(leadId) {
    const modal = document.getElementById(`modal-qualificado-${leadId}`);
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Confirma marcação do lead como qualificado e envia para backend
 * @param {string} leadId - ID do lead
 */
async function confirmarLeadQualificado(leadId) {
    try {
        console.log(`⭐ Marcando lead ${leadId} como qualificado`);

        // Mostrar loading no botão
        const btnConfirmar = document.querySelector(`#modal-qualificado-${leadId} .btn-confirmar-qualificado`);
        if (btnConfirmar) {
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }

        // Enviar para o backend
        const response = await fetch(`/api/leads/${leadId}/qualificado`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                qualificado: true,
                timestamp: new Date().toISOString()
            })
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.message || 'Erro ao marcar lead como qualificado');
        }

        console.log('✅ Lead marcado como qualificado com sucesso');

        // Fechar modal
        fecharModalLeadQualificado(leadId);

        // Mostrar mensagem de sucesso
        mostrarToastQualificado('Lead marcado como qualificado! A plataforma irá otimizar para encontrar leads semelhantes.', 'success');

        // Adicionar badge visual no card
        const leadCard = document.querySelector(`[data-lead-id="${leadId}"]`);
        if (leadCard && !leadCard.querySelector('.badge-qualificado')) {
            const header = leadCard.querySelector('.lead-header');
            if (header) {
                header.insertAdjacentHTML('beforeend', '<span class="badge-qualificado" title="Lead Qualificado"><i class="fas fa-star"></i></span>');
            }
        }

        // Opcional: Recarregar leads
        // await carregarLeadsCRM();

    } catch (error) {
        console.error('❌ Erro ao marcar lead como qualificado:', error);
        mostrarToastQualificado('Erro ao marcar lead como qualificado. Tente novamente.', 'error');
        
        // Restaurar botão
        const btnConfirmar = document.querySelector(`#modal-qualificado-${leadId} .btn-confirmar-qualificado`);
        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="fas fa-star"></i> Confirmar e Otimizar';
        }
    }
}

/**
 * Mostra aviso quando "Todas empresas" está selecionado
 */
function mostrarAvisoSelecaoEmpresa() {
    const kanbanContainer = document.querySelector('#crmKanbanBoard');
    
    if (!kanbanContainer) return;
    
    // Limpar conteúdo atual
    kanbanContainer.innerHTML = `
        <div style="
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            text-align: center;
            gap: 1.5rem;
        ">
            <div style="
                font-size: 4rem;
                color: var(--text-secondary);
                opacity: 0.5;
            ">
                <i class="fas fa-building"></i>
            </div>
            <div>
                <h4 style="color: var(--text-primary); margin-bottom: 0.5rem;">
                    Selecione uma empresa
                </h4>
                <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 500px;">
                    Para visualizar os leads do CRM, por favor selecione uma empresa específica no filtro acima.
                </p>
            </div>
            <div style="
                background: var(--bg-card-2);
                border-left: 4px solid var(--primary);
                padding: 1rem 1.5rem;
                border-radius: 8px;
                max-width: 600px;
            ">
                <p style="
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.6;
                ">
                    <i class="fas fa-info-circle" style="color: var(--primary); margin-right: 0.5rem;"></i>
                    <strong>Dica:</strong> Cada empresa pode ter etapas personalizadas. 
                    Selecione uma empresa para ver as etapas específicas do CRM dela.
                </p>
            </div>
        </div>
    `;
    
    console.log('⚠️ [CRM] Aviso "Selecione uma empresa" exibido');
}

/**
 * Mostra toast de feedback
 * @param {string} mensagem - Mensagem a exibir
 * @param {string} tipo - Tipo do toast (success, error, info)
 */
function mostrarToastQualificado(mensagem, tipo = 'info') {
    // Verificar se já existe um toast
    const toastExistente = document.querySelector('.toast-qualificado');
    if (toastExistente) {
        toastExistente.remove();
    }

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const colorMap = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };

    const toastHTML = `
        <div class="toast-qualificado toast-${tipo}" style="background-color: ${colorMap[tipo]}">
            <i class="fas ${iconMap[tipo]}"></i>
            <span>${mensagem}</span>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', toastHTML);

    // Remover após 5 segundos
    setTimeout(() => {
        const toast = document.querySelector('.toast-qualificado');
        if (toast) {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Trackeamento Avançado - Modal e lógica
// Abrir modal

const btnTrackeamento = document.getElementById('btnTrackeamentoAvancado');
if (btnTrackeamento) {
    btnTrackeamento.addEventListener('click', async () => {
        const modal = document.getElementById('modalTrackeamentoAvancado');
        const input = document.getElementById('inputApiPixelMeta');
        const selectEmpresa = document.getElementById('filtroEmpresaCRM');
        let empresaId = selectEmpresa ? selectEmpresa.value : null;
        input.value = '';
        if (empresaId) {
            try {
                const resp = await fetch(`/api/trackeamento/${empresaId}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.api_pixel_meta) {
                        input.value = data.api_pixel_meta;
                    }
                }
            } catch (e) {
                // Silencioso: não impede abrir modal
            }
        }
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
}

// Fechar modal
function fecharModalTrackeamento() {
    document.getElementById('modalTrackeamentoAvancado').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Salvar chave (agora salva no backend por empresa)
async function salvarChaveTrackeamento() {
    const chave = document.getElementById('inputApiPixelMeta').value.trim();
    const selectEmpresa = document.getElementById('filtroEmpresaCRM');
    const empresaId = selectEmpresa ? selectEmpresa.value : null;
    if (!empresaId) {
        alert('Selecione uma empresa para salvar a chave!');
        return;
    }
    if (!chave) {
        alert('Informe a chave da API do Pixel Meta!');
        return;
    }
    try {
        const resp = await fetch(`/api/trackeamento/${empresaId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_pixel_meta: chave })
        });
        const resultado = await resp.json();
        if (resp.ok && resultado.success) {
            fecharModalTrackeamento();
            alert('Chave salva com sucesso!');
        } else {
            throw new Error(resultado.message || 'Erro ao salvar chave');
        }
    } catch (err) {
        alert('Erro ao salvar chave: ' + err.message);
    }
}
