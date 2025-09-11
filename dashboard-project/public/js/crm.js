// Variável global para armazenar dados dos leads
window.leadsData = [];

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

// Variáveis globais para o CRM
window.leadsGlobais = [];
window.leadsData = [];

// Função principal para carregar leads do CRM
async function carregarLeadsCRM() {
    try {
        // Limpar colunas e reinicializar variáveis globais
        limparColunasEContadores();
        window.leadsGlobais = [];
        window.leadsData = [];
        
        console.log('Tentando carregar leads da API externa...');
        const response = await fetch('http://localhost:3001/api/v1/paginas/785063038017478/respostas');
        
        if (!response.ok) {
            throw new Error(`Erro da API: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            // Limpar dados anteriores
            window.leadsData = [];
            
            // Limpar colunas antes de carregar
            limparColunasEContadores();
            
            // Processar leads da API
            data.data.forEach(lead => {
                processarLead(lead);
            });
            
            // Atualizar contadores após carregar todos os leads
            atualizarContadoresColunas();
            
            console.log(`${data.data.length} leads carregados com sucesso!`);
        }
    } catch (error) {
        console.warn('API externa indisponível, carregando dados de exemplo:', error);
        carregarLeadsExemplo();
    }
}

// Função para carregar leads de exemplo quando a API não estiver disponível
function carregarLeadsExemplo() {
    // Limpar dados anteriores
    window.leadsData = [];
    window.leadsGlobais = [];
    
    // Limpar colunas antes de carregar
    limparColunasEContadores();
    
    // Dados de exemplo
    const leadsExemplo = [
        {
            id: 'lead_001',
            created_time: new Date().toISOString(),
            form_id: '123456789',
            field_data: [
                { name: 'full_name', values: ['João Silva'] },
                { name: 'email', values: ['joao@email.com'] },
                { name: 'phone_number', values: ['11999999999'] },
                { name: 'interesse', values: ['Produto A'] }
            ]
        },
        {
            id: 'lead_002',
            created_time: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
            form_id: '123456789',
            field_data: [
                { name: 'full_name', values: ['Maria Santos'] },
                { name: 'email', values: ['maria@email.com'] },
                { name: 'phone_number', values: ['11888888888'] },
                { name: 'empresa', values: ['Tech Corp'] }
            ]
        },
        {
            id: 'lead_003',
            created_time: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
            form_id: '123456789',
            field_data: [
                { name: 'full_name', values: ['Pedro Costa'] },
                { name: 'email', values: ['pedro@email.com'] },
                { name: 'phone_number', values: ['11777777777'] },
                { name: 'servico', values: ['Consultoria'] }
            ]
        }
    ];
    
    // Processar leads de exemplo
    leadsExemplo.forEach(lead => {
        processarLead(lead);
    });
    
    // Atualizar contadores após carregar todos os leads
    atualizarContadoresColunas();
    
    console.log(`${leadsExemplo.length} leads de exemplo carregados!`);
}

// Função para processar um lead individual
function processarLead(lead) {
    // Extrair dados dos campos do lead
    const fieldData = {};
    lead.field_data.forEach(field => {
        fieldData[field.name] = field.values[0] || '';
    });
    
    // Criar objeto do lead normalizado
    const leadData = {
        id: lead.id,
        created_time: lead.created_time,
        respostas: [
            { campo: 'nome', valor: fieldData.full_name || 'Nome não informado' },
            { campo: 'email', valor: fieldData.email || 'Email não informado' },
            { campo: 'telefone', valor: fieldData.phone_number || 'Telefone não informado' }
        ],
        formulario: { nome: 'Formulário de Contato', id: lead.form_id }
    };
    
    // Adicionar outros campos customizados
    Object.keys(fieldData).forEach(key => {
        if (!['full_name', 'email', 'phone_number'].includes(key)) {
            leadData.respostas.push({
                campo: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                valor: fieldData[key]
            });
        }
    });
    
    // Armazenar dados globalmente
    if (!window.leadsData) {
        window.leadsData = [];
    }
    if (!window.leadsGlobais) {
        window.leadsGlobais = [];
    }
    
    window.leadsData.push(leadData);
    window.leadsGlobais.push(leadData);
    
    // Criar objeto resposta simulado para compatibilidade
    const respostaSimulada = {
        id: lead.id,
        created_time: lead.created_time,
        nome: fieldData.full_name || 'Nome não informado',
        email: fieldData.email || 'Email não informado',
        telefone: fieldData.phone_number || 'Telefone não informado',
        respostas: fieldData
    };
    
    // Criar card visual
    criarCardLead(respostaSimulada, leadData.formulario);
}

// Função para limpar colunas e contadores
function limparColunasEContadores() {
    const colunas = document.querySelectorAll('.crm-column-body');
    colunas.forEach(coluna => {
        coluna.innerHTML = '';
    });
}

// Função para criar card individual do lead
function criarCardLead(resposta, formulario) {
    const leadId = resposta.id;
    
    // Verificar posição salva no localStorage
    const posicaoSalva = localStorage.getItem(`lead_position_${leadId}`) || 'entrou';
    
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
            
            // Salvar nova posição no localStorage
            const novaColuna = target.closest('.crm-column').getAttribute('data-stage');
            localStorage.setItem(`lead_position_${leadId}`, novaColuna);
            
            // Atualizar contadores
            atualizarContadoresColunas();
            
            console.log(`Lead ${leadId} movido para ${novaColuna}`);
            
            // Futuramente: salvar no banco
            // salvarPosicaoNoBanco(leadId, novaColuna);
        }
    }
}

// Função para atualizar contadores das colunas
function atualizarContadoresColunas() {
    const colunas = document.querySelectorAll('.crm-column');
    colunas.forEach(coluna => {
        const cards = coluna.querySelectorAll('.lead-card');
        const contador = coluna.querySelector('.column-counter');
        if (contador) {
            contador.textContent = cards.length;
        } else {
            // Criar contador se não existir
            const header = coluna.querySelector('.crm-column-header h6');
            if (header) {
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
    const telefoneFormatado = telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
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

// Função para expandir card em modal
function expandirCard(leadId) {
    const leadData = window.leadsData?.find(lead => lead.id === leadId);
    if (!leadData) {
        console.error('Lead não encontrado');
        return;
    }

    // Criar modal de expansão
    const modalHTML = `
        <div class="lead-modal-overlay" id="modal-${leadId}" onclick="fecharModal('${leadId}')">
            <div class="lead-modal-content" onclick="event.stopPropagation()">
                <div class="lead-modal-header">
                    <h4>${leadData.respostas.find(r => r.campo === 'nome')?.valor || 'Nome não informado'}</h4>
                    <button class="btn-close-modal" onclick="fecharModal('${leadId}')">&times;</button>
                </div>
                
                <div class="lead-modal-body">
                    <div class="lead-info-section">
                        <h6>Informações de Contato</h6>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>📧 Email:</strong> ${leadData.respostas.find(r => r.campo === 'email')?.valor || 'Não informado'}
                            </div>
                            <div class="info-item">
                                <strong>📱 Telefone:</strong> ${leadData.respostas.find(r => r.campo === 'telefone')?.valor || 'Não informado'}
                            </div>
                            <div class="info-item">
                                <strong>📅 Data do Lead:</strong> ${new Date(leadData.created_time).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    </div>

                    <div class="lead-responses-section">
                        <h6>Respostas do Formulário</h6>
                        <div class="responses-grid">
                            ${leadData.respostas.map(resposta => `
                                <div class="response-item">
                                    <strong>${resposta.campo}:</strong> ${resposta.valor}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="lead-comments-section">
                        <h6>💬 Comentários</h6>
                        <div class="comments-list" id="comments-list-${leadId}">
                            ${renderizarTodosComentarios(leadId)}
                        </div>
                        <div class="comment-input-section">
                            <textarea id="modal-comment-${leadId}" class="comment-input" placeholder="Adicionar comentário..."></textarea>
                            <button class="btn-add-comment" onclick="adicionarComentarioModal('${leadId}')" title="Adicionar comentário">
                                <i class="fas fa-paper-plane"></i> Adicionar Comentário
                            </button>
                        </div>
                    </div>
                </div>

                <div class="lead-modal-footer">
                    <button class="btn-whatsapp-main" onclick="chamarWhatsApp('${leadData.respostas.find(r => r.campo === 'telefone')?.valor}', '${leadData.respostas.find(r => r.campo === 'nome')?.valor}')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button class="btn-secondary" onclick="fecharModal('${leadId}')">Fechar</button>
                </div>
            </div>
        </div>
    `;

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function fecharModal(leadId) {
    const modal = document.getElementById(`modal-${leadId}`);
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

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
});

// Integração com a navegação existente
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'crm') {
        // Aguardar o painel ser exibido
        setTimeout(() => {
            const crmSection = document.getElementById('crmSection');
            if (crmSection && getComputedStyle(crmSection).display !== 'none') {
                carregarLeadsCRM();
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

// Expor funções globalmente para uso em outros arquivos
window.carregarLeadsCRM = carregarLeadsCRM;
window.recarregarLeads = recarregarLeads;
window.filtrarLeads = filtrarLeads;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
