window.addEventListener('DOMContentLoaded', function() {

// Elementos do modal
const modal = document.getElementById('modalCadastroNotificacao');
const btnCadastrar = document.getElementById('btnCadastrarNotificacao');
const btnFechar = document.getElementById('btnFecharModal');
const btnCancelar = document.getElementById('btnCancelarCadastro');

// Gerenciamento do modal de cadastro
if (btnCadastrar) {
    btnCadastrar.addEventListener('click', function(ev) {
        ev.preventDefault();
        abrirModalCadastro();
    });
}

if (btnFechar) {
    btnFechar.addEventListener('click', function(ev) {
        ev.preventDefault();
        fecharModalCadastro();
    });
}

if (btnCancelar) {
    btnCancelar.addEventListener('click', function(ev) {
        ev.preventDefault();
        fecharModalCadastro();
    });
}

// Fechar modal ao clicar no overlay
if (modal) {
    modal.addEventListener('click', function(ev) {
        if (ev.target === modal) {
            fecharModalCadastro();
        }
    });
}

// Fechar modal com tecla ESC
document.addEventListener('keydown', function(ev) {
    if (ev.key === 'Escape' && modal && modal.style.display === 'flex') {
        fecharModalCadastro();
    }
});

function abrirModalCadastro() {
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Impede scroll da página
        carregarEmpresasCheckbox(); // Carregar empresas quando abrir o modal
        limparFormulario(); // Limpar campos do formulário
    }
}

function fecharModalCadastro() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaura scroll da página
    }
}

function limparFormulario() {
    document.getElementById('nomeNotificacao').value = '';
    document.getElementById('numeroDestinatario').value = '';
    document.getElementById('horarioNotificacao').value = '09:00';
    document.getElementById('notificacaoAtiva').checked = true;
    
    // Limpar checkboxes das empresas
    const checkboxes = document.querySelectorAll('#checkboxEmpresas input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// Carregar empresas para checkboxes
async function carregarEmpresasCheckbox() {
    try {
        LoadingUtils.showContainer('checkboxEmpresas', 'Carregando empresas...');
        
        const response = await fetch('/api/buscarEmpresas');
        const resultado = await response.json();
        const empresas = Array.isArray(resultado.data) ? resultado.data : [];
        
        const container = document.getElementById('checkboxEmpresas');
        container.innerHTML = '';
        
        if (empresas.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma empresa encontrada.</p>';
            return;
        }
        
        // Checkbox "Selecionar Todas"
        const divSelectAll = document.createElement('div');
        divSelectAll.className = 'form-check mb-2';
        divSelectAll.innerHTML = `
            <input type="checkbox" id="selectAllEmpresas" class="form-check-input">
            <label for="selectAllEmpresas" class="form-check-label fw-bold">Selecionar Todas</label>
        `;
        container.appendChild(divSelectAll);
        
        // Checkboxes individuais das empresas
        empresas.forEach(empresa => {
            const div = document.createElement('div');
            div.className = 'form-check';
            div.innerHTML = `
                <input type="checkbox" id="empresa_${empresa.id}" class="form-check-input empresa-checkbox" value="${empresa.id}">
                <label for="empresa_${empresa.id}" class="form-check-label">${empresa.nome}</label>
            `;
            container.appendChild(div);
        });
        
        // Funcionalidade "Selecionar Todas"
        document.getElementById('selectAllEmpresas').addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.empresa-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
        
        // Atualizar "Selecionar Todas" quando checkboxes individuais mudam
        document.querySelectorAll('.empresa-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const totalCheckboxes = document.querySelectorAll('.empresa-checkbox').length;
                const checkedCheckboxes = document.querySelectorAll('.empresa-checkbox:checked').length;
                const selectAllCheckbox = document.getElementById('selectAllEmpresas');
                
                if (checkedCheckboxes === 0) {
                    selectAllCheckbox.indeterminate = false;
                    selectAllCheckbox.checked = false;
                } else if (checkedCheckboxes === totalCheckboxes) {
                    selectAllCheckbox.indeterminate = false;
                    selectAllCheckbox.checked = true;
                } else {
                    selectAllCheckbox.indeterminate = true;
                }
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        document.getElementById('checkboxEmpresas').innerHTML = 
            '<p class="text-danger">Erro ao carregar empresas.</p>';
    }
}

// Salvar notificação
document.getElementById('salvarNotificacao').addEventListener('click', async function(ev) {
    ev.preventDefault();
    
    // Mostrar loading no botão
    LoadingUtils.buttonLoading(this, true);
    
    const nomeNotificacao = document.getElementById('nomeNotificacao').value;
    const numeroDestinatario = document.getElementById('numeroDestinatario').value;
    const horarioNotificacao = document.getElementById('horarioNotificacao').value;
    const notificacaoAtiva = document.getElementById('notificacaoAtiva').checked;
    
    // Coletar empresas selecionadas
    const empresasSelecionadas = [];
    document.querySelectorAll('.empresa-checkbox:checked').forEach(checkbox => {
        empresasSelecionadas.push(parseInt(checkbox.value));
    });
    
    // Validações
    if (!nomeNotificacao.trim()) {
        LoadingUtils.buttonLoading(this, false);
        mostrarMensagem('Por favor, insira o nome da notificação.', 'danger');
        return;
    }
    
    if (!numeroDestinatario.trim()) {
        LoadingUtils.buttonLoading(this, false);
        mostrarMensagem('Por favor, insira o número do destinatário.', 'danger');
        return;
    }
    
    if (empresasSelecionadas.length === 0) {
        LoadingUtils.buttonLoading(this, false);
        mostrarMensagem('Por favor, selecione pelo menos uma empresa.', 'danger');
        return;
    }
    
    try {
        const response = await fetch('/api/criarNotificacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: nomeNotificacao,
                numeroDestinatario: numeroDestinatario,
                empresas: empresasSelecionadas,
                horario: horarioNotificacao,
                ativo: notificacaoAtiva
            })
        });
        
        const resultado = await response.json();
        
        LoadingUtils.buttonLoading(this, false);
        
        if (response.ok) {
            mostrarMensagem('Notificação cadastrada com sucesso!', 'success');
            limparFormulario();
            fecharModalCadastro();
            carregarListaNotificacoes(); // Recarregar a lista
        } else {
            mostrarMensagem(resultado.message || 'Erro ao cadastrar notificação.', 'danger');
        }
        
    } catch (error) {
        console.error('Erro ao salvar notificação:', error);
        mostrarMensagem('Erro interno do servidor.', 'danger');
    }
});

// Carregar lista de notificações
async function carregarListaNotificacoes() {
    try {
        LoadingUtils.showContainer('listaNotificacoes', 'Carregando notificações...');
        
        const response = await fetch('/api/buscarNotificacoes');
        const resultado = await response.json();
        const notificacoes = Array.isArray(resultado.data) ? resultado.data : [];
        
        const container = document.getElementById('listaNotificacoes');
        
        if (notificacoes.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma notificação cadastrada.</p>';
            return;
        }
        
        let html = `
            <table class="tabela-empresas">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Número</th>
                        <th>Horário</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        notificacoes.forEach(notificacao => {
            const status = notificacao.ativo ? 
                '<span class="badge bg-success">Ativa</span>' : 
                '<span class="badge bg-secondary">Inativa</span>';
                
            html += `
                <tr>
                    <td>${notificacao.nome}</td>
                    <td>${parseInt(notificacao.numeroDestinatario)}</td>
                    <td>${notificacao.horario}</td>
                    <td>${status}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editarNotificacao(${notificacao.id})">
                            Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirNotificacao(${notificacao.id})">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        document.getElementById('listaNotificacoes').innerHTML = 
            '<p class="text-danger">Erro ao carregar notificações.</p>';
    }
}

// Funções auxiliares
function mostrarMensagem(mensagem, tipo) {
    const container = document.getElementById('mensagemNotificacao');
    container.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function limparFormulario() {
    document.getElementById('nomeNotificacao').value = '';
    document.getElementById('numeroDestinatario').value = '';
    document.getElementById('horarioNotificacao').value = '09:00';
    document.getElementById('notificacaoAtiva').checked = true;
    
    // Desmarcar todas as empresas
    document.querySelectorAll('.empresa-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('selectAllEmpresas').checked = false;
    document.getElementById('selectAllEmpresas').indeterminate = false;
}

// Funções para editar/excluir (placeholder)
window.editarNotificacao = function(id) {
    // Implementar edição
    console.log('Editar notificação:', id);
    mostrarMensagem('Funcionalidade de edição em desenvolvimento.', 'info');
};

window.excluirNotificacao = async function(id) {
    if (confirm('Tem certeza que deseja excluir esta notificação?')) {
        try {
            const response = await fetch(`/api/excluirNotificacao/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                mostrarMensagem('Notificação excluída com sucesso!', 'success');
                carregarListaNotificacoes();
            } else {
                mostrarMensagem('Erro ao excluir notificação.', 'danger');
            }
        } catch (error) {
            console.error('Erro ao excluir notificação:', error);
            mostrarMensagem('Erro interno do servidor.', 'danger');
        }
    }
};

// Carregar empresas quando o painel for ativado
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            const painelNotificacoes = document.getElementById('painelNotificacoes');
            if (painelNotificacoes.dataset.theme === 'ativo') {
                console.log('Painel de notificações ativado');
                carregarEmpresasCheckbox();
                mostrarSubAbaNotificacao('cadastro'); // Mostrar aba de cadastro por padrão
            }
        }
    });
});

observer.observe(document.getElementById('painelNotificacoes'), {
    attributes: true,
    attributeFilter: ['data-theme']
});

// Carregar lista de notificações quando o painel for ativado
setTimeout(() => {
    const painelNotificacoes = document.getElementById('painelNotificacoes');
    if (painelNotificacoes && painelNotificacoes.dataset.theme === 'ativo') {
        carregarListaNotificacoes();
    }
}, 100);

// Observar mudanças no painel para carregar a lista automaticamente
const painelNotificacoes = document.getElementById('painelNotificacoes');
if (painelNotificacoes) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'data-theme' && 
                painelNotificacoes.dataset.theme === 'ativo') {
                carregarListaNotificacoes();
            }
        });
    });
    
    observer.observe(painelNotificacoes, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

});