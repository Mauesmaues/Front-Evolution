// Variável global para armazenar dados dos leads
window.leadsData = [];

// Função principal para carregar leads da API
async function carregarLeadsCRM() {
    try {
        const response = await fetch('http://localhost:3001/api/v1/paginas/785063038017478/respostas');
        const data = await response.json();
        
        if (data.success && data.data) {
            // Limpar dados anteriores
            window.leadsData = [];
            
            // Limpar colunas antes de carregar
            limparColunasEContadores();
            
            // Processar todos os formulários e suas respostas
            data.data.forEach(formulario => {
                if (formulario.respostas && formulario.respostas.length > 0) {
                    formulario.respostas.forEach(resposta => {
                        // Criar objeto do lead com dados completos
                        const leadData = {
                            id: resposta.id,
                            created_time: resposta.created_time,
                            respostas: [
                                { campo: 'nome', valor: resposta.nome || 'Nome não informado' },
                                { campo: 'email', valor: resposta.email || 'Email não informado' },
                                { campo: 'telefone', valor: resposta.telefone || 'Telefone não informado' }
                            ],
                            formulario: formulario.formulario
                        };
                        
                        // Adicionar outras respostas customizadas
                        if (resposta.respostas) {
                            Object.keys(resposta.respostas).forEach(pergunta => {
                                if (!['full_name', 'email', 'phone_number'].includes(pergunta)) {
                                    const resposta_valor = resposta.respostas[pergunta];
                                    if (resposta_valor && resposta_valor.length > 0) {
                                        leadData.respostas.push({
                                            campo: pergunta.replace(/_/g, ' ').replace(/\?/g, '').replace(/\b\w/g, l => l.toUpperCase()),
                                            valor: resposta_valor[0]
                                        });
                                    }
                                }
                            });
                        }
                        
                        // Armazenar dados globalmente
                        window.leadsData.push(leadData);
                        
                        // Criar card visual
                        criarCardLead(resposta, formulario.formulario);
                    });
                }
            });
            
            // Atualizar contadores das colunas
            atualizarContadoresColunas();
        }
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        mostrarErroCarregamento();
    }
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
            
            <!-- Área de Comentários -->
            <div class="lead-comments-area">
                <div class="comment-input-section">
                    <textarea class="comment-input" placeholder="Adicionar comentário..." 
                              onkeypress="handleCommentKeyPress(event, '${leadId}')"></textarea>
                    <button class="btn-add-comment" onclick="adicionarComentario('${leadId}')" title="Adicionar comentário">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                ${ultimoComentario ? `
                    <div class="last-comment">
                        <span class="comment-text">${ultimoComentario.texto}</span>
                        <i class="fas fa-info-circle comment-info-icon" 
                           onclick="mostrarInfoComentario('${leadId}')" 
                           title="Informações do comentário"></i>
                    </div>
                ` : ''}
            </div>
            
            <div class="lead-footer">
                <small class="text-muted">Form: ${formulario.nome}</small>
            </div>
            <div class="lead-actions">
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

// Função para obter comentários de um lead
function obterComentarios(leadId) {
    return JSON.parse(localStorage.getItem(`lead_comments_${leadId}`)) || [];
}

// Função para adicionar comentário
function adicionarComentario(leadId, textoPersonalizado = null) {
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
    const usuario = 'Usuário Atual'; // Aqui você pode pegar do sistema de login
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

function adicionarComentarioModal(leadId) {
    const textarea = document.getElementById(`modal-comment-${leadId}`);
    const texto = textarea.value.trim();
    
    if (!texto) {
        alert('Por favor, digite um comentário.');
        return;
    }

    // Adicionar comentário
    adicionarComentario(leadId, texto);
    
    // Limpar textarea
    textarea.value = '';
    
    // Atualizar lista de comentários no modal
    const commentsList = document.getElementById(`comments-list-${leadId}`);
    commentsList.innerHTML = renderizarTodosComentarios(leadId);
    
    // Atualizar card na tela principal
    carregarLeadsCRM();
}

// Função para handle do Enter no textarea
function handleCommentKeyPress(event, leadId) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        adicionarComentario(leadId);
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

// Expor funções globalmente para uso em outros arquivos
window.carregarLeadsCRM = carregarLeadsCRM;
window.recarregarLeads = recarregarLeads;
window.filtrarLeads = filtrarLeads;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
