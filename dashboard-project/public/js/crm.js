// Função principal para carregar leads da API
async function carregarLeadsCRM() {
    try {
        const response = await fetch('http://localhost:3001/api/v1/paginas/785063038017478/respostas');
        const data = await response.json();
        
        if (data.success && data.data) {
            // Limpar colunas antes de carregar
            limparColunasEContadores();
            
            // Processar todos os formulários e suas respostas
            data.data.forEach(formulario => {
                if (formulario.respostas && formulario.respostas.length > 0) {
                    formulario.respostas.forEach(resposta => {
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
    
    // Criar HTML do card
    const cardHTML = `
        <div class="lead-card" data-lead-id="${leadId}" draggable="true" ondragstart="drag(event)">
            <div class="lead-header">
                <h6 class="lead-name">${nome}</h6>
                <small class="lead-date">${dataFormatada}</small>
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
            </div>
            <div class="lead-actions">
                <button class="btn-action btn-edit" onclick="editarLead('${leadId}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-whatsapp" onclick="abrirWhatsApp('${telefone}', '${nome}')" title="WhatsApp">
                    <i class="fab fa-whatsapp"></i>
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
function abrirWhatsApp(telefone, nome) {
    const telefoneFormatado = telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
    const mensagem = `Olá ${nome}! Vi que você demonstrou interesse em nossos serviços. Como posso te ajudar?`;
    const url = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
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
