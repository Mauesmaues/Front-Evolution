// Sistema de Gerenciamento de Notificações

class NotificacaoManager {
    constructor() {
        this.notificacoes = [];
        this.empresasDisponiveis = [];
        this.usuarioAtual = null;
        this.eventListenersConfigurados = false;
        this.inicializar();
    }

    async inicializar() {
        try {
            // Carregar dados do usuário atual primeiro
            await this.carregarUsuarioAtual();
            
            // Depois carregar empresas disponíveis
            await this.carregarEmpresasDisponiveis();
            
            // Carregar notificações
            await this.carregarNotificacoes();
            
            // Configurar event listeners apenas uma vez
            if (!this.eventListenersConfigurados) {
                this.configurarEventListeners();
                this.eventListenersConfigurados = true;
            }
            
            console.log('Sistema de notificações inicializado com sucesso');
        } catch (erro) {
            console.error('Erro ao inicializar sistema de notificações:', erro);
            this.exibirMensagemErro('Erro ao inicializar sistema de notificações');
        }
    }

    async carregarUsuarioAtual() {
        try {
            const response = await fetch('/api/session-user');
            if (response.ok) {
                const data = await response.json();
                this.usuarioAtual = data.usuario;
                console.log('Usuário atual carregado:', this.usuarioAtual);
            } else if (response.status === 401) {
                console.error('Usuário não autenticado - redirecionando para login');
                window.location.href = '/login.html';
            } else {
                console.error('Erro ao carregar usuário:', response.status);
            }
        } catch (error) {
            console.error('Erro ao carregar usuário atual:', error);
        }
    }

    async carregarEmpresasDisponiveis() {
        try {
            const resposta = await fetch('/api/empresasDisponiveis');
            if (!resposta.ok) {
                throw new Error('Erro ao carregar empresas');
            }
            const dados = await resposta.json();
            
            // Backend retorna { success: true, data: [...] }
            if (dados.success && Array.isArray(dados.data)) {
                this.empresasDisponiveis = dados.data;
                this.atualizarSelectEmpresas();
                this.atualizarFiltroEmpresas();
                console.log(`${this.empresasDisponiveis.length} empresas carregadas`);
            } else {
                console.error('Formato de resposta de empresas:', dados);
                throw new Error('Formato de resposta inválido');
            }
        } catch (erro) {
            console.error('Erro ao carregar empresas:', erro);
            this.exibirMensagemErro('Erro ao carregar lista de empresas');
        }
    }

    atualizarSelectEmpresas() {
        // Atualizar checkboxes de empresas no modal
        const checkboxContainer = document.getElementById('checkboxEmpresas');
        if (!checkboxContainer) return;

        checkboxContainer.innerHTML = '';
        
        this.empresasDisponiveis.forEach(empresa => {
            const div = document.createElement('div');
            div.className = 'form-check';
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${empresa.id}" id="empresa_${empresa.id}">
                <label class="form-check-label" for="empresa_${empresa.id}">
                    ${empresa.nome}
                </label>
            `;
            checkboxContainer.appendChild(div);
        });
    }

    atualizarFiltroEmpresas() {
        const filtroEmpresa = document.getElementById('empresaFiltroNotificacoes');
        if (!filtroEmpresa) return;

        filtroEmpresa.innerHTML = '<option value="">Todas as empresas</option>';
        
        this.empresasDisponiveis.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            filtroEmpresa.appendChild(option);
        });
    }

    configurarEventListeners() {
        // Botão adicionar notificação (no painel)
        const btnAdicionar = document.getElementById('btnCadastrarNotificacao');
        if (btnAdicionar) {
            btnAdicionar.addEventListener('click', () => this.abrirModal());
        }

        // Botão salvar no modal
        const btnSalvar = document.getElementById('salvarNotificacao');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => this.cadastrarNotificacao());
        }

        // Filtro de empresas
        const filtroEmpresa = document.getElementById('empresaFiltroNotificacoes');
        if (filtroEmpresa) {
            filtroEmpresa.addEventListener('change', () => this.filtrarNotificacoes());
        }

        // Validação em tempo real dos campos
        const campos = ['nomeNotificacao', 'numeroDestinatario', 'horarioNotificacao'];
        campos.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.addEventListener('input', () => this.validarCampo(campo));
                campo.addEventListener('blur', () => this.validarCampo(campo));
            }
        });

        console.log('Event listeners configurados');
    }

    validarCampo(campo) {
        const valor = campo.value.trim();
        const isValido = valor.length > 0;
        
        if (isValido) {
            campo.classList.remove('is-invalid');
            campo.classList.add('is-valid');
        } else {
            campo.classList.remove('is-valid');
            campo.classList.add('is-invalid');
        }
        
        return isValido;
    }

    validarFormulario() {
        const nome = document.getElementById('nomeNotificacao');
        const numero = document.getElementById('numeroDestinatario');
        const horario = document.getElementById('horarioNotificacao');

        const nomeValido = this.validarCampo(nome);
        const numeroValido = this.validarCampo(numero);
        const horarioValido = this.validarCampo(horario);

        // Validar se pelo menos uma empresa foi selecionada
        const checkboxes = document.querySelectorAll('#checkboxEmpresas input[type="checkbox"]:checked');
        const empresasValidas = checkboxes.length > 0;
        
        const empresasError = document.getElementById('empresasError');
        if (empresasValidas) {
            empresasError.style.display = 'none';
        } else {
            empresasError.style.display = 'block';
        }

        return nomeValido && numeroValido && horarioValido && empresasValidas;
    }

    limparValidacoes() {
        const campos = ['nomeNotificacao', 'numeroDestinatario', 'horarioNotificacao'];
        campos.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.classList.remove('is-valid', 'is-invalid');
            }
        });
        
        const empresasError = document.getElementById('empresasError');
        if (empresasError) {
            empresasError.style.display = 'none';
        }
    }

    abrirModal() {
        // Verificar se usuário está identificado
        if (!this.usuarioAtual) {
            this.exibirMensagemErro('Usuário não identificado');
            return;
        }

        // Limpar formulário
        this.limparFormulario();
        
        // Abrir modal Bootstrap
        const modalElement = document.getElementById('modalCadastroNotificacao');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    fecharModal() {
        const modalElement = document.getElementById('modalCadastroNotificacao');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        this.limparFormulario();
    }

    limparFormulario() {
        document.getElementById('nomeNotificacao').value = '';
        document.getElementById('numeroDestinatario').value = '41996616801';
        document.getElementById('horarioNotificacao').value = '09:00';
        document.getElementById('notificacaoAtiva').checked = true;
        
        // Desmarcar todos os checkboxes de empresas
        const checkboxes = document.querySelectorAll('#checkboxEmpresas input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
        
        this.limparValidacoes();
    }

    async cadastrarNotificacao() {
        if (!this.validarFormulario()) {
            this.exibirMensagemErro('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const nome = document.getElementById('nomeNotificacao').value.trim();
        const numero = document.getElementById('numeroDestinatario').value.trim();
        const horario = document.getElementById('horarioNotificacao').value;
        const ativo = document.getElementById('notificacaoAtiva').checked;
        
        // Coletar empresas selecionadas
        const checkboxes = document.querySelectorAll('#checkboxEmpresas input[type="checkbox"]:checked');
        const empresaIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

        const btnSalvar = document.getElementById('salvarNotificacao');
        const textoOriginal = btnSalvar.textContent;
        
        try {
            btnSalvar.disabled = true;
            btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';

            const resposta = await fetch('/api/criarNotificacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: nome,
                    numeroDestinatario: numero,
                    empresas: empresaIds,
                    horario: horario,
                    ativo: ativo
                })
            });

            const dados = await resposta.json();

            // Backend retorna { success: true, data: {...} }
            if (dados.success) {
                this.exibirMensagemSucesso('Notificação cadastrada com sucesso!');
                this.fecharModal();
                await this.carregarNotificacoes();
            } else {
                const mensagemErro = dados.error?.message || 'Erro ao cadastrar notificação';
                throw new Error(mensagemErro);
            }
        } catch (erro) {
            console.error('Erro ao cadastrar notificação:', erro);
            this.exibirMensagemErro(erro.message || 'Erro ao cadastrar notificação');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = textoOriginal;
        }
    }

    async carregarNotificacoes() {
        try {
            const resposta = await fetch('/api/buscarNotificacoes');
            
            console.log('Status da resposta:', resposta.status);
            
            if (!resposta.ok) {
                const erro = await resposta.text();
                console.error('Erro HTTP:', resposta.status, erro);
                throw new Error(`Erro ao carregar notificações: ${resposta.status}`);
            }

            const dados = await resposta.json();
            console.log('Dados recebidos:', dados);
            
            // Backend retorna { success: true, data: [...] }
            if (dados.success && Array.isArray(dados.data)) {
                this.notificacoes = dados.data;
                this.renderizarNotificacoes();
                console.log(`${this.notificacoes.length} notificações carregadas`);
            } else {
                console.error('Formato de resposta:', dados);
                throw new Error(dados.error?.message || 'Formato de resposta inválido');
            }
        } catch (erro) {
            console.error('Erro ao carregar notificações:', erro);
            this.exibirMensagemErro('Erro ao carregar notificações: ' + erro.message);
        }
    }

    filtrarNotificacoes() {
        const filtroEmpresaId = document.getElementById('empresaFiltroNotificacoes').value;
        this.renderizarNotificacoes(filtroEmpresaId);
    }

    renderizarNotificacoes(filtroEmpresaId = '') {
        const tbody = document.getElementById('tabelaNotificacoesBody');
        if (!tbody) return;

        // Filtrar notificações
        let notificacoesFiltradas = this.notificacoes;
        
        if (filtroEmpresaId) {
            // Filtrar por empresas relacionadas
            notificacoesFiltradas = this.notificacoes.filter(notif => {
                if (Array.isArray(notif.empresas)) {
                    return notif.empresas.some(emp => emp.id === parseInt(filtroEmpresaId));
                }
                return false;
            });
        }

        // Limpar tbody
        tbody.innerHTML = '';

        if (notificacoesFiltradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        Nenhuma notificação encontrada
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar notificações
        notificacoesFiltradas.forEach(notificacao => {
            const tr = document.createElement('tr');
            
            // Montar lista de empresas
            let empresasHtml = '';
            if (Array.isArray(notificacao.empresas) && notificacao.empresas.length > 0) {
                empresasHtml = notificacao.empresas.map(emp => 
                    `<span class="badge bg-info text-dark me-1">${this.escapeHtml(emp.nome)}</span>`
                ).join('');
            } else {
                empresasHtml = '<span class="text-muted">-</span>';
            }
            
            const statusBadge = notificacao.ativo 
                ? '<span class="badge bg-success">Ativa</span>' 
                : '<span class="badge bg-secondary">Inativa</span>';
            
            tr.innerHTML = `
                <td>${this.escapeHtml(notificacao.nome)}</td>
                <td>${this.escapeHtml(notificacao.numero_destinatario || '-')}</td>
                <td>${this.escapeHtml(notificacao.horario || '-')}</td>
                <td>${empresasHtml}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="notificacaoManager.excluirNotificacao(${notificacao.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });

        console.log(`${notificacoesFiltradas.length} notificações renderizadas`);
    }

    async excluirNotificacao(id) {
        if (!confirm('Tem certeza que deseja excluir esta notificação?')) {
            return;
        }

        try {
            const resposta = await fetch(`/api/excluirNotificacao/${id}`, {
                method: 'DELETE'
            });

            const dados = await resposta.json();

            // Backend retorna { success: true, data: {...} }
            if (dados.success) {
                this.exibirMensagemSucesso('Notificação excluída com sucesso!');
                await this.carregarNotificacoes();
            } else {
                const mensagemErro = dados.error?.message || 'Erro ao excluir notificação';
                throw new Error(mensagemErro);
            }
        } catch (erro) {
            console.error('Erro ao excluir notificação:', erro);
            this.exibirMensagemErro(erro.message || 'Erro ao excluir notificação');
        }
    }

    formatarData(dataString) {
        if (!dataString) return '-';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return '-';
            
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (erro) {
            console.error('Erro ao formatar data:', erro);
            return '-';
        }
    }

    escapeHtml(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    exibirMensagemSucesso(mensagem) {
        this.exibirMensagem(mensagem, 'success');
    }

    exibirMensagemErro(mensagem) {
        this.exibirMensagem(mensagem, 'danger');
    }

    exibirMensagem(mensagem, tipo = 'info') {
        // Remover mensagens antigas
        const mensagensAntigas = document.querySelectorAll('.alert-flutuante');
        mensagensAntigas.forEach(msg => msg.remove());

        // Criar nova mensagem
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show alert-flutuante`;
        alerta.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        alerta.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alerta);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            alerta.remove();
        }, 5000);
    }
}

// Inicializar quando o DOM estiver pronto
let notificacaoManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        notificacaoManager = new NotificacaoManager();
    });
} else {
    notificacaoManager = new NotificacaoManager();
}
