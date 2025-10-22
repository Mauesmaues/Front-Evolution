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

        document.getElementById('abaVisuais').addEventListener('click', () => {
            this.mostrarAba('visuais');
        });

        // Filtro de empresas
        const filtroEmpresas = document.getElementById('empresaFiltroPropostas');
        if (filtroEmpresas) {
            filtroEmpresas.addEventListener('change', () => {
                console.log('Filtro de empresas mudou:', filtroEmpresas.value);
                this.filtrarPropostas();
            });
        } else {
            console.warn('Elemento empresaFiltroPropostas não encontrado');
        }

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
        } else if (aba === 'visuais') {
            document.getElementById('abaVisuais').classList.add('active');
            document.getElementById('conteudoVisuais').style.display = 'block';
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
            // Extrair empresa vinculada (backend retorna como 'empresas' devido ao alias no select)
            let empresaNome = '';
            if (proposta.empresas && proposta.empresas.nome) {
                empresaNome = proposta.empresas.nome;
            } else if (proposta.empresa && proposta.empresa.nome) {
                empresaNome = proposta.empresa.nome;
            } else if (proposta.empresa_id) {
                // Buscar nome da empresa pelo ID se disponível
                const empresaEncontrada = this.empresasDisponiveis.find(e => e.id === proposta.empresa_id);
                empresaNome = empresaEncontrada ? empresaEncontrada.nome : 'Empresa não encontrada';
            } else {
                empresaNome = '<span class="text-muted">Não vinculada</span>';
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
                        <small>${empresaNome}</small>
                    </td>
                    <td>${this.formatarData(proposta.dataCriacao || proposta.data_criacao || proposta.created_at)}</td>
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
        
        console.log('🔍 Filtrando propostas pela empresa ID:', empresaId);
        
        // Filtrar propostas pela empresa usando empresa_id
        const propostasFiltradas = this.propostas.filter(proposta => {
            return proposta.empresa_id === empresaId;
        });
        
        console.log(`✅ ${propostasFiltradas.length} propostas encontradas para a empresa ${empresaId}`);

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
            // Extrair empresa vinculada (backend retorna como 'empresas' devido ao alias no select)
            let empresaNome = '';
            if (proposta.empresas && proposta.empresas.nome) {
                empresaNome = proposta.empresas.nome;
            } else if (proposta.empresa && proposta.empresa.nome) {
                empresaNome = proposta.empresa.nome;
            } else if (proposta.empresa_id) {
                // Buscar nome da empresa pelo ID se disponível
                const empresaEncontrada = this.empresasDisponiveis.find(e => e.id === proposta.empresa_id);
                empresaNome = empresaEncontrada ? empresaEncontrada.nome : 'Empresa não encontrada';
            } else {
                empresaNome = '<span class="text-muted">Não vinculada</span>';
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
                    <td><small>${empresaNome}</small></td>
                    <td>${this.formatarData(proposta.dataCriacao || proposta.data_criacao || proposta.created_at)}</td>
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

    // Carregar aberturas na tabela filtradas por empresa
    carregarAberturasNaTabelaFiltradas(empresaId) {
        const tbody = document.getElementById('tabelaAberturas');
        
        // Filtrar propostas pela empresa primeiro usando empresa_id
        const propostasFiltradas = this.propostas.filter(proposta => {
            return proposta.empresa_id === empresaId;
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
        
        console.log('🔍 Tentando copiar link:', {
            link,
            temClipboard: !!navigator.clipboard,
            isSecureContext: window.isSecureContext,
            protocolo: window.location.protocol
        });
        
        // Verificar se a API Clipboard está disponível (requer HTTPS em produção)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(link).then(() => {
                this.mostrarToast('✅ Link copiado! Compartilhe com seus clientes: ' + link, 'success');
                console.log('🔗 Link da proposta copiado:', link);
            }).catch((err) => {
                console.error('Erro ao copiar via Clipboard API:', err);
                this.copiarLinkFallback(link);
            });
        } else {
            console.log('⚠️ Clipboard API não disponível, usando fallback');
            // Usar método alternativo para ambientes sem HTTPS ou navegadores antigos
            this.copiarLinkFallback(link);
        }
    }

    copiarLinkFallback(link) {
        // Método alternativo que funciona em qualquer contexto
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.mostrarToast('✅ Link copiado! Compartilhe com seus clientes: ' + link, 'success');
                console.log('🔗 Link da proposta copiado (fallback):', link);
            } else {
                throw new Error('Comando copy falhou');
            }
        } catch (err) {
            console.error('Erro ao copiar link:', err);
            // Última alternativa: mostrar um prompt para copiar manualmente
            this.mostrarLinkParaCopiaManual(link);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    mostrarLinkParaCopiaManual(link) {
        // Criar modal/alert para usuário copiar manualmente
        const mensagem = `Não foi possível copiar automaticamente. Por favor, copie o link abaixo:\n\n${link}`;
        
        // Tentar usar prompt para facilitar a cópia
        if (window.prompt) {
            window.prompt('Copie o link da proposta:', link);
        } else {
            alert(mensagem);
        }
        
        console.log('🔗 Link para cópia manual:', link);
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
        if (!select) {
            console.warn('Select de filtro de empresas não encontrado');
            return;
        }

        // Limpar opções existentes (exceto "Todas as empresas")
        select.innerHTML = '<option value="">Todas as empresas</option>';

        // Adicionar empresas disponíveis
        this.empresasDisponiveis.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            select.appendChild(option);
        });

        console.log(`✅ ${this.empresasDisponiveis.length} empresas adicionadas ao filtro`);
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
        if (!dataISO) return '-';
        
        try {
            const data = new Date(dataISO);
            if (isNaN(data.getTime())) {
                console.warn('Data inválida:', dataISO);
                return '-';
            }
            return data.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data:', error, dataISO);
            return '-';
        }
    }

    formatarDataHora(dataISO) {
        if (!dataISO) return '-';
        
        try {
            const data = new Date(dataISO);
            if (isNaN(data.getTime())) {
                console.warn('Data/hora inválida:', dataISO);
                return '-';
            }
            return data.toLocaleString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data/hora:', error, dataISO);
            return '-';
        }
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
        
        // Inicializar gerenciador de visuais
        inicializarGerenciadorVisuais();
    }, 1000); // Aumentar o tempo para 1 segundo
});

// ===== GERENCIADOR DE VISUAIS =====
function inicializarGerenciadorVisuais() {
    const logoUpload = document.getElementById('logoUpload');
    const btnRemoverLogo = document.getElementById('btnRemoverLogo');
    const corObjetosFlutuantes = document.getElementById('corObjetosFlutuantes');
    const corObjetosFlutuantesHex = document.getElementById('corObjetosFlutuantesHex');
    const corFundoPainelEsquerdo = document.getElementById('corFundoPainelEsquerdo');
    const corFundoPainelEsquerdoHex = document.getElementById('corFundoPainelEsquerdoHex');
    const btnSalvarVisuais = document.getElementById('btnSalvarVisuais');
    const btnResetarVisuais = document.getElementById('btnResetarVisuais');
    const abaVisuais = document.getElementById('abaVisuais');
    const empresaFiltroVisuais = document.getElementById('empresaFiltroVisuais');
    const containerFormularioVisuais = document.getElementById('containerFormularioVisuais');

    if (!logoUpload) return;

    // Variável global para armazenar empresa selecionada
    let empresaSelecionadaVisuais = null;

    // Popular select de empresas
    popularSelectEmpresasVisuais();

    // Listener para mudança de empresa
    if (empresaFiltroVisuais) {
        empresaFiltroVisuais.addEventListener('change', function(e) {
            const empresaId = e.target.value;
            
            if (!empresaId || empresaId === '') {
                // Nenhuma empresa selecionada - esconder formulário
                containerFormularioVisuais.style.display = 'none';
                empresaSelecionadaVisuais = null;
            } else {
                // Empresa selecionada - mostrar formulário e carregar dados
                empresaSelecionadaVisuais = parseInt(empresaId);
                containerFormularioVisuais.style.display = 'block';
                carregarConfiguracoesVisuaisPorEmpresa(empresaSelecionadaVisuais);
            }
        });
    }

    // Upload de Logo
    logoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validar tamanho (2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Arquivo muito grande! Tamanho máximo: 2MB');
                logoUpload.value = '';
                return;
            }

            // Validar tipo
            if (!file.type.match('image.*')) {
                alert('Apenas imagens são permitidas!');
                logoUpload.value = '';
                return;
            }

            // Mostrar preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const logoPreview = document.getElementById('logoPreview');
                const logoPreviewImg = document.getElementById('logoPreviewImg');
                const previewLogoImg = document.getElementById('previewLogoImg');
                
                logoPreviewImg.src = e.target.result;
                previewLogoImg.src = e.target.result;
                logoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Remover Logo
    if (btnRemoverLogo) {
        btnRemoverLogo.addEventListener('click', function() {
            logoUpload.value = '';
            document.getElementById('logoPreview').style.display = 'none';
            document.getElementById('previewLogoImg').src = './img/BULBOX.png';
        });
    }

    // Sincronizar cor dos objetos flutuantes
    if (corObjetosFlutuantes && corObjetosFlutuantesHex) {
        corObjetosFlutuantes.addEventListener('input', function(e) {
            const cor = e.target.value;
            corObjetosFlutuantesHex.value = cor;
            atualizarPreviewCoresObjetos(cor);
        });

        corObjetosFlutuantesHex.addEventListener('input', function(e) {
            const cor = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(cor)) {
                corObjetosFlutuantes.value = cor;
                atualizarPreviewCoresObjetos(cor);
            }
        });
    }

    // Sincronizar cor de fundo
    if (corFundoPainelEsquerdo && corFundoPainelEsquerdoHex) {
        corFundoPainelEsquerdo.addEventListener('input', function(e) {
            const cor = e.target.value;
            corFundoPainelEsquerdoHex.value = cor;
            atualizarPreviewCorFundo(cor);
        });

        corFundoPainelEsquerdoHex.addEventListener('input', function(e) {
            const cor = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(cor)) {
                corFundoPainelEsquerdo.value = cor;
                atualizarPreviewCorFundo(cor);
            }
        });
    }

    // Salvar configurações
    if (btnSalvarVisuais) {
        btnSalvarVisuais.addEventListener('click', async function() {
            if (!empresaSelecionadaVisuais) {
                alert('❌ Por favor, selecione uma empresa primeiro');
                return;
            }
            await salvarConfiguracoesVisuais(empresaSelecionadaVisuais);
        });
    }

    // Resetar para padrão
    if (btnResetarVisuais) {
        btnResetarVisuais.addEventListener('click', function() {
            if (!empresaSelecionadaVisuais) {
                alert('❌ Por favor, selecione uma empresa primeiro');
                return;
            }
            if (confirm('Deseja resetar para as configurações padrão?')) {
                resetarConfiguracoesVisuais();
            }
        });
    }

    // Gerenciar mudança de abas
    if (abaVisuais) {
        abaVisuais.addEventListener('click', function() {
            popularSelectEmpresasVisuais();
        });
    }
}

// Popular select de empresas para visuais
function popularSelectEmpresasVisuais() {
    const select = document.getElementById('empresaFiltroVisuais');
    if (!select) return;

    // Limpar select
    select.innerHTML = '<option value="">Selecione uma empresa...</option>';

    // Usar a lista de empresas disponíveis do PropostaManager
    if (window.propostaManager && window.propostaManager.empresasDisponiveis) {
        const empresas = window.propostaManager.empresasDisponiveis;
        
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nome;
            select.appendChild(option);
        });

        console.log(`✅ ${empresas.length} empresas adicionadas ao seletor de visuais`);
    } else {
        console.warn('⚠️ PropostaManager ou empresas não disponíveis ainda');
    }
}

function atualizarPreviewCoresObjetos(cor) {
    const shapes = document.querySelectorAll('.preview-shape');
    shapes.forEach(shape => {
        shape.style.background = cor;
    });
}

function atualizarPreviewCorFundo(cor) {
    const painelEsquerdo = document.getElementById('previewPainelEsquerdo');
    if (painelEsquerdo) {
        painelEsquerdo.style.background = cor;
    }
}

async function carregarConfiguracoesVisuais() {
    // Função mantida para compatibilidade - agora usa carregarConfiguracoesVisuaisPorEmpresa
    console.log('⚠️ carregarConfiguracoesVisuais() chamada - use carregarConfiguracoesVisuaisPorEmpresa()');
}

async function carregarConfiguracoesVisuaisPorEmpresa(empresaId) {
    try {
        console.log('🎨 Carregando visual da empresa ID:', empresaId);
        
        const response = await fetch(`/api/configuracoes/visuais/${empresaId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                aplicarConfiguracoesVisuais(data.data);
            } else {
                // Aplicar padrão se não encontrado
                resetarConfiguracoesVisuais();
            }
        } else {
            console.log('⚠️ Visual não encontrado, usando padrão');
            resetarConfiguracoesVisuais();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar visual:', error);
        resetarConfiguracoesVisuais();
    }
}

function aplicarConfiguracoesVisuais(config) {
    // Accept both camelCase and snake_case from backend
    const logoUrl = config.logoUrl || config.logo_url || null;
    const corObjetos = config.corObjetosFlutuantes || config.cor_objetos_flutuantes || null;
    const corFundo = config.corFundoPainelEsquerdo || config.cor_fundo_painel_esquerdo || null;

    // Aplicar logo
    if (logoUrl) {
        const preview = document.getElementById('previewLogoImg');
        const previewImg = document.getElementById('logoPreviewImg');
        if (preview) preview.src = logoUrl;
        if (previewImg) previewImg.src = logoUrl;
        const logoPreviewContainer = document.getElementById('logoPreview');
        if (logoPreviewContainer) logoPreviewContainer.style.display = 'block';
    }

    // Aplicar cores
    if (corObjetos) {
        const input = document.getElementById('corObjetosFlutuantes');
        const inputHex = document.getElementById('corObjetosFlutuantesHex');
        if (input) input.value = corObjetos;
        if (inputHex) inputHex.value = corObjetos;
        atualizarPreviewCoresObjetos(corObjetos);
    }

    if (corFundo) {
        const input = document.getElementById('corFundoPainelEsquerdo');
        const inputHex = document.getElementById('corFundoPainelEsquerdoHex');
        if (input) input.value = corFundo;
        if (inputHex) inputHex.value = corFundo;
        atualizarPreviewCorFundo(corFundo);
    }
}

async function salvarConfiguracoesVisuais(empresaId) {
    const btnSalvar = document.getElementById('btnSalvarVisuais');
    const textoOriginal = btnSalvar.innerHTML;

    try {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';

        if (!empresaId) {
            throw new Error('ID da empresa não informado');
        }

        const logoUpload = document.getElementById('logoUpload');
        const formData = new FormData();

        // Adicionar empresa_id ao FormData
        formData.append('empresaId', empresaId);

        // Adicionar logo se houver
        if (logoUpload.files[0]) {
            formData.append('logo', logoUpload.files[0]);
        }

        // Adicionar cores
        formData.append('corObjetosFlutuantes', document.getElementById('corObjetosFlutuantes').value);
        formData.append('corFundoPainelEsquerdo', document.getElementById('corFundoPainelEsquerdo').value);

        const response = await fetch('/api/configuracoes/visuais', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            if (typeof propostaManager !== 'undefined' && propostaManager.mostrarToast) {
                propostaManager.mostrarToast('✅ Configurações salvas com sucesso!', 'success');
            } else {
                alert('✅ Configurações salvas com sucesso!');
            }
            
            // Recarregar configurações para mostrar dados salvos
            await carregarConfiguracoesVisuaisPorEmpresa(empresaId);
        } else {
            throw new Error(data.error?.message || data.message || 'Erro ao salvar');
        }

    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        if (typeof propostaManager !== 'undefined' && propostaManager.mostrarToast) {
            propostaManager.mostrarToast('❌ Erro ao salvar configurações: ' + error.message, 'error');
        } else {
            alert('❌ Erro ao salvar configurações: ' + error.message);
        }
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = textoOriginal;
    }
}

function resetarConfiguracoesVisuais() {
    // Resetar logo
    document.getElementById('logoUpload').value = '';
    document.getElementById('logoPreview').style.display = 'none';
    document.getElementById('previewLogoImg').src = './img/BULBOX.png';

    // Resetar cores
    document.getElementById('corObjetosFlutuantes').value = '#00bcd4';
    document.getElementById('corObjetosFlutuantesHex').value = '#00bcd4';
    atualizarPreviewCoresObjetos('#00bcd4');

    document.getElementById('corFundoPainelEsquerdo').value = '#070707';
    document.getElementById('corFundoPainelEsquerdoHex').value = '#070707';
    atualizarPreviewCorFundo('#070707');
}
