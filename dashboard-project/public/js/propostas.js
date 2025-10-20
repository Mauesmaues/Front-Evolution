// Sistema de Gerenciamento de Propostas
class PropostaManager {
    constructor() {
        this.propostas = [];
        this.aberturas = [];
        this.empresasDisponiveis = [];
        this.usuarioAtual = null; // Armazenar dados do usuário logado
        this.eventListenersConfigurados = false; // Evitar duplicação de event listeners
        this.inicializar();
    }

    async inicializar() {
        try {
            // Carregar dados do usuário atual primeiro
            await this.carregarUsuarioAtual();
            
            this.configurarEventListeners();
            
            // Se o usuário foi carregado com sucesso, continuar com a inicialização
            if (this.usuarioAtual) {
                await this.carregarEmpresasDisponiveis();
                await this.carregarPropostasDoServidor();
                this.carregarAberturasNaTabela();
            } else {
                console.log('PropostaManager: Usuário não carregado, aguardando...');
            }
        } catch (error) {
            console.error('Erro na inicialização do PropostaManager:', error);
        }
    }

    // Método para carregar dados do usuário atual
    async carregarUsuarioAtual() {
        try {
            const response = await fetch('/api/session-user');
            if (response.ok) {
                const data = await response.json();
                this.usuarioAtual = data.usuario;
                console.log('Usuário atual carregado:', this.usuarioAtual);
            } else if (response.status === 401) {
                // Só redireciona se realmente não estiver autenticado
                console.error('Usuário não autenticado - redirecionando para login');
                window.location.href = '/login.html';
            } else {
                console.error('Erro ao carregar usuário:', response.status);
                // Para outros erros, não redireciona, apenas registra o erro
            }
        } catch (error) {
            console.error('Erro ao carregar usuário atual:', error);
            // Em caso de erro de rede, não redireciona automaticamente
        }
    }

    configurarEventListeners() {
        // Verificar se já foram configurados para evitar duplicação
        if (this.eventListenersConfigurados) {
            return;
        }
        this.eventListenersConfigurados = true;

        // Botão para criar proposta
        document.getElementById('btnCriarProposta').addEventListener('click', () => {
            this.abrirModalCriacao();
        });

        // Sub-abas
        document.getElementById('abaPropostasGeradas').addEventListener('click', () => {
            this.mostrarAba('propostas');
        });

        document.getElementById('abaAberturas').addEventListener('click', () => {
            this.mostrarAba('aberturas');
        });

        // Filtro de empresas
        document.getElementById('empresaFiltroPropostas').addEventListener('change', () => {
            this.filtrarPropostas();
        });

        // Botão salvar proposta
        document.getElementById('btnSalvarProposta').addEventListener('click', () => {
            this.salvarProposta();
        });

        // Radio buttons para tipo de proposta
        document.querySelectorAll('input[name="tipoProposta"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.alternarCamposTipo();
            });
        });

        // Validação em tempo real
        this.configurarValidacaoTempoReal();
    }

    abrirModalCriacao() {
        // Limpar formulário
        document.getElementById('formCriarProposta').reset();
        document.getElementById('campoArquivo').style.display = 'none';
        document.getElementById('campoCanva').style.display = 'none';
        
        // Remover classes de validação
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });

        // Carregar empresas disponíveis no modal
        this.carregarEmpresasNoModal();

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalCriarProposta'));
        modal.show();
    }

    alternarCamposTipo() {
        const tipoSelecionado = document.querySelector('input[name="tipoProposta"]:checked');
        const campoArquivo = document.getElementById('campoArquivo');
        const campoCanva = document.getElementById('campoCanva');

        // Esconder ambos os campos primeiro
        campoArquivo.style.display = 'none';
        campoCanva.style.display = 'none';

        // Limpar valores dos campos ocultos
        document.getElementById('arquivoProposta').value = '';
        document.getElementById('linkCanva').value = '';

        if (tipoSelecionado) {
            if (tipoSelecionado.value === 'arquivo') {
                campoArquivo.style.display = 'block';
            } else if (tipoSelecionado.value === 'canva') {
                campoCanva.style.display = 'block';
            }
        }
    }

    configurarValidacaoTempoReal() {
        // Nome da proposta
        document.getElementById('nomeProposta').addEventListener('input', (e) => {
            this.validarCampo(e.target, e.target.value.trim() !== '');
        });

        // Empresa selecionada
        document.getElementById('empresaProposta').addEventListener('change', (e) => {
            this.validarCampo(e.target, e.target.value !== '');
        });

        // Link do Canva
        document.getElementById('linkCanva').addEventListener('input', (e) => {
            const isValid = this.validarLinkCanva(e.target.value);
            this.validarCampo(e.target, isValid);
        });

        // Arquivo
        document.getElementById('arquivoProposta').addEventListener('change', (e) => {
            this.validarCampo(e.target, e.target.files.length > 0);
        });
    }

    validarLinkCanva(url) {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('canva.com');
        } catch {
            return false;
        }
    }

    validarCampo(campo, isValido) {
        if (isValido) {
            campo.classList.remove('is-invalid');
            campo.classList.add('is-valid');
        } else {
            campo.classList.remove('is-valid');
            campo.classList.add('is-invalid');
        }
    }

    async salvarProposta() {
        // Validar formulário
        if (!this.validarFormulario()) {
            return;
        }

        // Mostrar loading no botão
        const btnSalvar = document.getElementById('btnSalvarProposta');
        const textoOriginal = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
        btnSalvar.disabled = true;

        try {
            // Criar objeto da proposta
            const dadosProposta = {
                nome: document.getElementById('nomeProposta').value.trim(),
                pedirWhatsapp: document.getElementById('pedirWhatsapp').checked,
                tipo: document.querySelector('input[name="tipoProposta"]:checked').value
            };

            // Adicionar dados específicos do tipo
            if (dadosProposta.tipo === 'arquivo') {
                const arquivoInput = document.getElementById('arquivoProposta');
                const arquivo = arquivoInput.files[0];
                
                if (!arquivo) {
                    throw new Error('Por favor, selecione um arquivo');
                }
                
                console.log('📤 Iniciando upload do arquivo:', arquivo.name);
                
                // Criar FormData para fazer upload do arquivo
                const formData = new FormData();
                formData.append('arquivo', arquivo);
                
                // Fazer upload do arquivo primeiro
                console.log('🔄 Enviando arquivo para /api/upload-arquivo...');
                const uploadResponse = await fetch('/api/upload-arquivo', {
                    method: 'POST',
                    body: formData
                });
                
                console.log('📡 Resposta do upload - Status:', uploadResponse.status);
                
                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    console.error('❌ Erro no upload:', errorText);
                    throw new Error(`Erro ao fazer upload do arquivo: ${errorText}`);
                }
                
                const uploadResult = await uploadResponse.json();
                console.log('✅ Upload realizado com sucesso:', uploadResult);
                
                if (!uploadResult.success || !uploadResult.data || !uploadResult.data.url) {
                    console.error('❌ Resposta inválida do upload:', uploadResult);
                    throw new Error('Erro ao processar upload do arquivo');
                }
                
                // Adicionar URL do arquivo aos dados da proposta
                dadosProposta.arquivo = {
                    nome: arquivo.name,
                    tamanho: arquivo.size,
                    tipo: arquivo.type,
                    url: uploadResult.data.url,
                    downloadUrl: uploadResult.data.url
                };
                
                console.log('📝 Dados do arquivo adicionados à proposta:', dadosProposta.arquivo);
                
            } else if (dadosProposta.tipo === 'canva') {
                dadosProposta.linkCanva = document.getElementById('linkCanva').value.trim();
            }

            // Adicionar empresa selecionada
            const empresaSelecionada = this.getEmpresaSelecionada();
            if (empresaSelecionada) {
                dadosProposta.empresas = [empresaSelecionada]; // Array com uma empresa
            }

            // Enviar para o backend
            const response = await fetch('/api/criarProposta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosProposta)
            });

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.message || 'Erro ao salvar proposta');
            }

            // Atualizar lista local
            await this.carregarPropostasDoServidor();

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCriarProposta'));
            modal.hide();

            // Mostrar sucesso
            this.mostrarToast('Proposta criada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao salvar proposta:', error);
            this.mostrarToast('Erro ao salvar proposta: ' + error.message, 'error');
        } finally {
            // Restaurar botão
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
        }
    }

    validarFormulario() {
        let isValido = true;

        // Nome da proposta
        const nome = document.getElementById('nomeProposta');
        if (!nome.value.trim()) {
            this.validarCampo(nome, false);
            isValido = false;
        }

        // Empresa selecionada
        const empresaSelect = document.getElementById('empresaProposta');
        if (!empresaSelect.value) {
            this.validarCampo(empresaSelect, false);
            isValido = false;
        }

        // Tipo da proposta
        const tipoSelecionado = document.querySelector('input[name="tipoProposta"]:checked');
        const tipoError = document.getElementById('tipoPropostaError');
        
        if (!tipoSelecionado) {
            if (tipoError) {
                tipoError.style.display = 'block';
            }
            console.log('Erro: Nenhum tipo de proposta selecionado');
            isValido = false;
        } else {
            if (tipoError) {
                tipoError.style.display = 'none';
            }
            console.log('Tipo selecionado:', tipoSelecionado.value);

            // Validar campo específico do tipo
            if (tipoSelecionado.value === 'arquivo') {
                const arquivo = document.getElementById('arquivoProposta');
                if (!arquivo.files || !arquivo.files.length) {
                    this.validarCampo(arquivo, false);
                    console.log('Erro: Nenhum arquivo selecionado');
                    isValido = false;
                } else {
                    this.validarCampo(arquivo, true);
                }
            } else if (tipoSelecionado.value === 'canva') {
                const linkCanva = document.getElementById('linkCanva');
                const linkValido = this.validarLinkCanva(linkCanva.value);
                if (!linkValido) {
                    this.validarCampo(linkCanva, false);
                    console.log('Erro: Link do Canva inválido');
                    isValido = false;
                } else {
                    this.validarCampo(linkCanva, true);
                }
            }
        }

        return isValido;
    }

    mostrarAba(aba) {
        // Atualizar botões das abas
        document.querySelectorAll('#subAbasPropostas .btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Esconder todo o conteúdo
        document.querySelectorAll('.sub-aba-content').forEach(content => {
            content.style.display = 'none';
        });

        if (aba === 'propostas') {
            document.getElementById('abaPropostasGeradas').classList.add('active');
            document.getElementById('conteudoPropostasGeradas').style.display = 'block';
        } else if (aba === 'aberturas') {
            document.getElementById('abaAberturas').classList.add('active');
            document.getElementById('conteudoAberturas').style.display = 'block';
        }
    }

    // Filtrar propostas por empresa
    filtrarPropostas() {
        const empresaSelecionada = document.getElementById('empresaFiltroPropostas').value;
        
        if (empresaSelecionada === 'todas') {
            // Mostrar todas as propostas
            this.carregarPropostasNaTabela();
            this.carregarAberturasNaTabela();
        } else {
            // Filtrar propostas pela empresa selecionada
            this.carregarPropostasNaTabelaFiltradas(parseInt(empresaSelecionada));
            this.carregarAberturasNaTabelaFiltradas(parseInt(empresaSelecionada));
        }
    }

    carregarPropostasNaTabela() {
        const tbody = document.getElementById('tabelaPropostasGeradas');
        
        if (this.propostas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        Nenhuma proposta criada ainda. Clique em "Criar Proposta" para começar.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.propostas.map(proposta => {
            // Extrair empresas vinculadas
            let empresasVinculadas = '';
            if (proposta.propostaempresa && proposta.propostaempresa.length > 0) {
                const nomes = proposta.propostaempresa
                    .map(pe => pe.empresas?.nome)
                    .filter(nome => nome)
                    .join(', ');
                empresasVinculadas = nomes || 'Não especificado';
            } else {
                empresasVinculadas = '<span class="text-muted">Todas as empresas</span>';
            }

            return `
                <tr>
                    <td>
                        <strong>${proposta.nome}</strong>
                        ${proposta.pedirWhatsapp ? '<br><small class="text-success"><i class="fab fa-whatsapp"></i> WhatsApp</small>' : ''}
                    </td>
                    <td>
                        <span class="badge ${proposta.tipo === 'arquivo' ? 'bg-danger' : 'bg-primary'}">
                            <i class="fas ${proposta.tipo === 'arquivo' ? 'fa-file-pdf' : 'fa-link'}"></i>
                            ${proposta.tipo === 'arquivo' ? 'Arquivo' : 'Link Canva'}
                        </span>
                    </td>
                    <td>
                        <small>${empresasVinculadas}</small>
                    </td>
                    <td>${this.formatarData(proposta.dataCriacao || proposta.data_criacao)}</td>
                    <td>
                        <span class="badge ${proposta.status === 'Aberta' ? 'bg-success' : 'bg-secondary'}">
                            <i class="fas ${proposta.status === 'Aberta' ? 'fa-eye' : 'fa-eye-slash'}"></i>
                            ${proposta.status}
                        </span>
                        ${proposta.visualizacoes > 0 ? `<br><small class="text-muted">${proposta.visualizacoes} visualizações</small>` : ''}
                    </td>
                    <td>${this.formatarData(proposta.dataCriacao || proposta.dataCriacao)}</td>
                    <td>
                        <span class="badge ${proposta.status === 'Aberta' ? 'bg-success' : 'bg-secondary'}">
                            <i class="fas ${proposta.status === 'Aberta' ? 'fa-eye' : 'fa-eye-slash'}"></i>
                            ${proposta.status}
                        </span>
                        ${proposta.visualizacoes > 0 ? `<br><small class="text-muted">${proposta.visualizacoes} visualizações</small>` : ''}
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="propostaManager.visualizarProposta('${proposta.id}')" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="propostaManager.copiarLink('${proposta.id}')" title="Copiar Link">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="propostaManager.excluirProposta('${proposta.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    carregarAberturasNaTabela() {
        const tbody = document.getElementById('tabelaAberturas');
        
        // Filtrar apenas propostas que foram abertas
        const propostasAbertas = this.propostas.filter(p => p.status === 'Aberta');
        
        if (propostasAbertas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="fas fa-chart-line fa-2x mb-2"></i><br>
                        Nenhuma abertura registrada ainda.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = propostasAbertas.map(proposta => {
            const aberturas = this.aberturas.filter(a => a.propostaId === proposta.id);
            const ultimaAbertura = aberturas.length > 0 ? 
                aberturas.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0] : null;

            return `
                <tr>
                    <td><strong>${proposta.nome}</strong></td>
                    <td>${ultimaAbertura ? this.formatarDataHora(ultimaAbertura.dataHora) : '-'}</td>
                    <td>
                        <span class="badge bg-info">${aberturas.length}</span>
                    </td>
                    <td>${ultimaAbertura ? this.formatarDataHora(ultimaAbertura.dataHora) : '-'}</td>
                </tr>
            `;
        }).join('');
    }

    // Carregar propostas na tabela filtradas por empresa
    carregarPropostasNaTabelaFiltradas(empresaId) {
        const tbody = document.getElementById('tabelaPropostasGeradas');
        
        // Filtrar propostas pela empresa
        const propostasFiltradas = this.propostas.filter(proposta => {
            if (!proposta.propostaempresa || proposta.propostaempresa.length === 0) {
                return false; // Propostas sem empresa vinculada não aparecem no filtro
            }
            return proposta.propostaempresa.some(pe => pe.id_empresas === empresaId);
        });

        if (propostasFiltradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-search fa-2x mb-2"></i><br>
                        Nenhuma proposta encontrada para a empresa selecionada.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = propostasFiltradas.map(proposta => {
            // Extrair empresas vinculadas
            let empresasVinculadas = '';
            if (proposta.propostaempresa && proposta.propostaempresa.length > 0) {
                const nomes = proposta.propostaempresa
                    .map(pe => pe.empresas?.nome)
                    .filter(nome => nome)
                    .join(', ');
                empresasVinculadas = nomes || 'Não especificado';
            } else {
                empresasVinculadas = '<span class="text-muted">Todas as empresas</span>';
            }

            return `
                <tr>
                    <td>
                        <strong>${proposta.nome}</strong>
                        ${proposta.pedirWhatsapp ? '<br><small class="text-success"><i class="fab fa-whatsapp"></i> WhatsApp</small>' : ''}
                    </td>
                    <td>
                        <span class="badge ${proposta.tipo === 'arquivo' ? 'bg-danger' : 'bg-primary'}">
                            <i class="fas ${proposta.tipo === 'arquivo' ? 'fa-file-pdf' : 'fa-link'}"></i>
                            ${proposta.tipo === 'arquivo' ? 'Arquivo' : 'Link Canva'}
                        </span>
                    </td>
                    <td>${this.formatarData(proposta.dataCriacao || proposta.created_at)}</td>
                    <td>
                        <span class="badge ${proposta.status === 'Aberta' ? 'bg-success' : 'bg-secondary'}">
                            <i class="fas ${proposta.status === 'Aberta' ? 'fa-eye' : 'fa-eye-slash'}"></i>
                            ${proposta.status}
                        </span>
                        ${proposta.visualizacoes > 0 ? `<br><small class="text-muted">${proposta.visualizacoes} visualizações</small>` : ''}
                    </td>
                    <td><small>${empresasVinculadas}</small></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="propostaManager.visualizarProposta(${proposta.id})" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="propostaManager.copiarLink(${proposta.id})" title="Copiar Link">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="propostaManager.excluirProposta(${proposta.id})" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Carregar aberturas na tabela filtradas por empresa
    carregarAberturasNaTabelaFiltradas(empresaId) {
        const tbody = document.getElementById('tabelaAberturas');
        
        // Filtrar propostas pela empresa primeiro
        const propostasFiltradas = this.propostas.filter(proposta => {
            if (!proposta.propostaempresa || proposta.propostaempresa.length === 0) {
                return false;
            }
            return proposta.propostaempresa.some(pe => pe.id_empresas === empresaId);
        });

        // Filtrar apenas propostas que foram abertas
        const propostasAbertas = propostasFiltradas.filter(p => p.status === 'Aberta');
        
        if (propostasAbertas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="fas fa-search fa-2x mb-2"></i><br>
                        Nenhuma abertura encontrada para a empresa selecionada.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = propostasAbertas.map(proposta => {
            const aberturas = this.aberturas.filter(a => a.propostaId === proposta.id);
            const ultimaAbertura = aberturas.length > 0 ? 
                aberturas.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0] : null;

            return `
                <tr>
                    <td><strong>${proposta.nome}</strong></td>
                    <td>${ultimaAbertura ? this.formatarDataHora(ultimaAbertura.dataHora) : '-'}</td>
                    <td>
                        <span class="badge bg-info">${aberturas.length}</span>
                    </td>
                    <td>${ultimaAbertura ? this.formatarDataHora(ultimaAbertura.dataHora) : '-'}</td>
                </tr>
            `;
        }).join('');
    }

    visualizarProposta(id) {
        const proposta = this.propostas.find(p => p.id === id);
        if (!proposta) return;

        if (proposta.tipo === 'canva') {
            window.open(proposta.linkCanva, '_blank');
        } else {
            // Para arquivos, você implementaria a lógica de visualização
            this.mostrarToast('Funcionalidade de visualização de arquivo em desenvolvimento', 'info');
        }

        // Registrar abertura
        this.registrarAbertura(id);
    }

    copiarLink(id) {
        // Gerar link simplificado - apenas com o ID
        // A página proposta.html buscará todas as informações do banco de dados
        const link = `${window.location.origin}/proposta.html?id=${id}`;
        
        navigator.clipboard.writeText(link).then(() => {
            this.mostrarToast('✅ Link copiado! Compartilhe com seus clientes: ' + link, 'success');
            console.log('🔗 Link da proposta copiado:', link);
        }).catch(() => {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.mostrarToast('✅ Link copiado! ' + link, 'success');
                console.log('🔗 Link da proposta copiado:', link);
            } catch (err) {
                this.mostrarToast('❌ Erro ao copiar. Link: ' + link, 'error');
                console.error('Erro ao copiar link:', err);
            }
            document.body.removeChild(textArea);
        });
    }

    async excluirProposta(id) {
        if (!confirm('Tem certeza que deseja excluir esta proposta?')) {
            return;
        }

        try {
            const response = await fetch(`/api/excluirProposta/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.message || 'Erro ao excluir proposta');
            }

            // Recarregar lista do servidor
            await this.carregarPropostasDoServidor();
            this.carregarAberturasNaTabela();
            
            this.mostrarToast('Proposta excluída com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao excluir proposta:', error);
            this.mostrarToast('Erro ao excluir proposta: ' + error.message, 'error');
        }
    }

    async registrarAbertura(propostaId) {
        try {
            // Enviar para o backend
            const response = await fetch('/api/registrarAberturaProposta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    propostaId: propostaId,
                    ip: 'localhost', // Em produção, será capturado automaticamente
                    userAgent: navigator.userAgent
                })
            });

            const resultado = await response.json();

            if (response.ok) {
                // Recarregar dados do servidor
                await this.carregarPropostasDoServidor();
                this.carregarAberturasNaTabela();
            }

        } catch (error) {
            console.error('Erro ao registrar abertura:', error);
            // Continuar mesmo com erro no registro
        }
    }

    // Carregar propostas do servidor com base nas permissões
    async carregarPropostasDoServidor() {
        try {
            const response = await fetch('/api/listarPropostas', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const resultado = await response.json();

            if (response.ok) {
                this.propostas = resultado.data || [];
                await this.carregarTodasAberturas(); // Carregar aberturas de todas as propostas
                this.carregarPropostasNaTabela();
            } else {
                console.error('Erro ao carregar propostas:', resultado.message);
                this.propostas = [];
                this.carregarPropostasNaTabela();
            }

        } catch (error) {
            console.error('Erro ao carregar propostas do servidor:', error);
            // Fallback para localStorage se o servidor não estiver disponível
            this.propostas = this.carregarPropostasLocal();
            this.carregarPropostasNaTabela();
        }
    }

    // Carregar aberturas de todas as propostas
    async carregarTodasAberturas() {
        try {
            console.log('🔄 Carregando aberturas de todas as propostas...');
            this.aberturas = [];

            // Carregar aberturas para cada proposta
            for (const proposta of this.propostas) {
                try {
                    const response = await fetch(`/api/proposta/${proposta.id}/aberturas`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const resultado = await response.json();
                        if (resultado.success && resultado.data) {
                            // Adicionar aberturas desta proposta ao array geral
                            const aberturasComPropostaId = resultado.data.map(abertura => ({
                                ...abertura,
                                propostaId: proposta.id,
                                dataHora: abertura.data_abertura
                            }));
                            this.aberturas.push(...aberturasComPropostaId);
                        }
                    }
                } catch (error) {
                    console.error(`Erro ao carregar aberturas da proposta ${proposta.id}:`, error);
                }
            }

            console.log(`✅ Total de ${this.aberturas.length} aberturas carregadas`);

        } catch (error) {
            console.error('Erro ao carregar aberturas:', error);
            this.aberturas = [];
        }
    }

    // Carregar empresas disponíveis para vincular baseado na permissão do usuário
    async carregarEmpresasDisponiveis() {
        try {
            if (!this.usuarioAtual) {
                console.error('Usuário não carregado');
                return;
            }

            const response = await fetch('/api/empresasDisponiveis', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const resultado = await response.json();

            if (response.ok) {
                this.empresasDisponiveis = resultado.data || [];
                this.popularSelectFiltroEmpresas();
                this.popularSelectEmpresasModal(); // Popular select no modal
            } else {
                console.error('Erro ao carregar empresas:', resultado.message);
                this.empresasDisponiveis = [];
            }

        } catch (error) {
            console.error('Erro ao carregar empresas do servidor:', error);
            this.empresasDisponiveis = [];
        }
    }

    // Popular select de empresas no modal baseado na permissão
    popularSelectEmpresasModal() {
        const select = document.getElementById('empresaProposta');
        if (!select) return;

        // Verificar permissão do usuário
        const isAdmin = this.usuarioAtual && (this.usuarioAtual.permissao === 'ADMIN' || this.usuarioAtual.permissao === 'GESTOR');
        
        // Limpar select
        select.innerHTML = '';
        
        if (this.empresasDisponiveis.length === 0) {
            select.innerHTML = '<option value="">Nenhuma empresa disponível</option>';
            return;
        }

        if (isAdmin) {
            // ADMIN e GESTOR: podem escolher entre todas as empresas
            select.innerHTML = '<option value="">Selecione uma empresa...</option>';
            
            this.empresasDisponiveis.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.id;
                option.textContent = empresa.nome;
                select.appendChild(option);
            });
        } else {
            // USER: só pode criar para suas empresas
            if (this.empresasDisponiveis.length === 1) {
                // Se tem apenas uma empresa, seleciona automaticamente
                const empresa = this.empresasDisponiveis[0];
                select.innerHTML = `<option value="${empresa.id}" selected>${empresa.nome}</option>`;
            } else {
                // Se tem múltiplas empresas, permite escolher
                select.innerHTML = '<option value="">Selecione uma empresa...</option>';
                this.empresasDisponiveis.forEach(empresa => {
                    const option = document.createElement('option');
                    option.value = empresa.id;
                    option.textContent = empresa.nome;
                    select.appendChild(option);
                });
            }
        }
    }

    // Popular o select de filtro de empresas
    popularSelectFiltroEmpresas() {
        const select = document.getElementById('empresaFiltroPropostas');
        if (!select) return;

        // Limpar opções existentes (exceto "Todas as empresas")
        select.innerHTML = '<option value="">Todas as empresas</option>';

        // Adicionar empresas disponíveis
        this.empresasDisponiveis.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            select.appendChild(option);
        });

        // Adicionar event listener para filtrar quando mudar a seleção
        select.addEventListener('change', () => {
            this.filtrarPropostas();
        });
    }

    // Carregar empresas no modal de criação
    carregarEmpresasNoModal() {
        // Usar o novo método que considera permissões
        this.popularSelectEmpresasModal();
    }

    // Obter empresa selecionada no modal
    getEmpresaSelecionada() {
        const select = document.getElementById('empresaProposta');
        return select ? parseInt(select.value) || null : null;
    }

    formatarData(dataISO) {
        return new Date(dataISO).toLocaleDateString('pt-BR');
    }

    formatarDataHora(dataISO) {
        return new Date(dataISO).toLocaleString('pt-BR');
    }

    mostrarToast(mensagem, tipo = 'success') {
        // Implementar sistema de toast ou usar o existente
        if (typeof toastSystem !== 'undefined') {
            toastSystem.show(tipo, '', mensagem);
        } else {
            alert(mensagem);
        }
    }

    // Métodos de persistência (localStorage como fallback)
    carregarPropostasLocal() {
        try {
            return JSON.parse(localStorage.getItem('propostas') || '[]');
        } catch {
            return [];
        }
    }

    salvarPropostasLocal() {
        localStorage.setItem('propostas', JSON.stringify(this.propostas));
    }

    carregarAberturasLocal() {
        try {
            return JSON.parse(localStorage.getItem('aberturas') || '[]');
        } catch {
            return [];
        }
    }

    salvarAberturasLocal() {
        localStorage.setItem('aberturas', JSON.stringify(this.aberturas));
    }

    // Métodos mantidos para compatibilidade (agora apenas aliases)
    carregarPropostas() {
        return this.carregarPropostasLocal();
    }

    salvarPropostas() {
        this.salvarPropostasLocal();
    }

    carregarAberturas() {
        return this.carregarAberturasLocal();
    }

    salvarAberturas() {
        this.salvarAberturasLocal();
    }

    // Método para filtrar propostas por empresa
    filtrarPropostas() {
        const empresaSelecionada = document.getElementById('empresaFiltroPropostas').value;
        
        if (!empresaSelecionada || empresaSelecionada === '') {
            // Se nenhuma empresa específica selecionada, mostra todas as propostas que o usuário tem permissão
            this.carregarPropostasNaTabela();
            this.carregarAberturasNaTabela();
        } else {
            // Filtra por empresa específica
            const empresaId = parseInt(empresaSelecionada);
            this.carregarPropostasNaTabelaFiltradas(empresaId);
            this.carregarAberturasNaTabelaFiltradas(empresaId);
        }
    }
}

// Função global para ser chamada pelo onChange do select
function filtrarPropostasGlobal() {
    if (window.propostaManager) {
        window.propostaManager.filtrarPropostas();
    }
}

// Instância global
let propostaManager;

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco mais para garantir que a sessão esteja estabelecida
    setTimeout(() => {
        const btnCriarProposta = document.getElementById('btnCriarProposta');
        if (btnCriarProposta) {
            console.log("Elemento btnCriarProposta encontrado, inicializando PropostaManager");
            propostaManager = new PropostaManager();
            // Armazenar a instância globalmente
            window.propostaManager = propostaManager;
        } else {
            console.log("Elemento btnCriarProposta não encontrado no carregamento inicial");
        }
    }, 1000); // Aumentar o tempo para 1 segundo
});