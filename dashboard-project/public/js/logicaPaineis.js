window.addEventListener('DOMContentLoaded', function() {
// Verificar permissões do usuário e configurar interface
verificarPermissoesEConfigurarInterface();

// Carregar saldos e verificar notificações logo ao iniciar
carregarSaldosParaNotificacoes();

// ====== SISTEMA DE NOTIFICAÇÕES DE SALDO BAIXO ======
const LIMIAR_SALDO_BAIXO = 90; // R$ 90
let notificacoesSaldoBaixo = [];

function verificarSaldosBaixos(empresas) {
    notificacoesSaldoBaixo = [];
    
    if (!empresas || empresas.length === 0) return;
    
    empresas.forEach(emp => {
        // Ignorar saldos tipo "cartão"
        if (isSaldoCartao(emp.saldo)) return;
        
        const valorSaldo = extrairValorSaldo(emp.saldo);
        
        // Se o saldo for válido e menor que o limiar
        if (!isNaN(valorSaldo) && valorSaldo < LIMIAR_SALDO_BAIXO) {
            notificacoesSaldoBaixo.push({
                empresa: emp.empresa,
                contaDeAnuncio: emp.contaDeAnuncio,
                saldo: emp.saldo,
                valorNumerico: valorSaldo,
                timestamp: new Date()
            });
        }
    });
    
    atualizarInterfaceNotificacoes();
    
    // Se houver saldos baixos, enviar notificações
    if (notificacoesSaldoBaixo.length > 0) {
        enviarNotificacoesSaldoBaixoAutomatico();
    }
}

// Função para enviar notificações automáticas de saldo baixo
let ultimoEnvioNotificacao = null;
async function enviarNotificacoesSaldoBaixoAutomatico() {
    // Evitar enviar múltiplas vezes na mesma sessão
    const agora = new Date();
    const hoje = agora.toDateString();
    
    if (ultimoEnvioNotificacao === hoje) {
        console.log('⏭️ Notificações já enviadas hoje');
        return;
    }
    
    try {
        console.log('📲 Enviando notificações automáticas de saldo baixo...');
        
        const response = await fetch('/api/enviar-notificacoes-saldo-baixo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            ultimoEnvioNotificacao = hoje;
            console.log('✅ Notificações enviadas:', resultado.message);
        } else {
            console.log('⚠️ Notificações não enviadas:', resultado.message);
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar notificações automáticas:', error);
    }
}

function atualizarInterfaceNotificacoes() {
    const badge = document.getElementById('badgeNotificacoes');
    const listaContainer = document.getElementById('listaNotificacoesSaldo');
    const iconeSino = document.getElementById('iconeSinoNotificacoes');
    
    const qtdNotificacoes = notificacoesSaldoBaixo.length;
    
    // Atualizar badge
    if (qtdNotificacoes > 0) {
        badge.textContent = qtdNotificacoes;
        badge.style.display = 'block';
        
        // Animar o sino
        iconeSino.style.color = '#dc3545'; // vermelho
        iconeSino.classList.add('fa-shake'); // animação de shake (FontAwesome 6)
    } else {
        badge.style.display = 'none';
        iconeSino.style.color = '#333';
        iconeSino.classList.remove('fa-shake');
    }
    
    // Renderizar lista de notificações
    if (qtdNotificacoes === 0) {
        listaContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6c757d;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #28a745; margin-bottom: 12px;"></i>
                <p style="margin: 0; font-size: 14px;">Nenhum alerta no momento</p>
                <small>Todos os saldos estão adequados</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    notificacoesSaldoBaixo
        .sort((a, b) => a.valorNumerico - b.valorNumerico) // Do menor para o maior
        .forEach((notif, index) => {
            const urgencia = notif.valorNumerico < 50 ? 'danger' : 'warning';
            const iconUrgencia = notif.valorNumerico < 50 ? 'fa-exclamation-circle' : 'fa-exclamation-triangle';
            
            html += `
                <div class="notification-item" style="padding: 12px; border-bottom: 1px solid #eee; ${index === 0 ? 'border-top: 1px solid #eee;' : ''} transition: background 0.2s;" 
                     onmouseover="this.style.background='#f8f9fa'" 
                     onmouseout="this.style.background='white'">
                    <div style="display: flex; align-items: start; gap: 10px;">
                        <i class="fas ${iconUrgencia} text-${urgencia}" style="font-size: 20px; margin-top: 2px;"></i>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 13px; color: #333; margin-bottom: 4px;">
                                ${notif.empresa}
                            </div>
                            <div style="font-size: 12px; color: #6c757d; margin-bottom: 6px;">
                                Conta: ${notif.contaDeAnuncio}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="badge bg-${urgencia}" style="font-size: 11px;">
                                    Saldo: ${notif.saldo}
                                </span>
                                ${notif.valorNumerico < 50 ? '<span class="badge bg-danger" style="font-size: 10px;"><i class="fas fa-bolt"></i> URGENTE</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    
    listaContainer.innerHTML = html;
}

// Toggle do dropdown de notificações
const iconeSinoNotificacoes = document.getElementById('iconeSinoNotificacoes');
const dropdownNotificacoes = document.getElementById('dropdownNotificacoesSaldo');

if (iconeSinoNotificacoes && dropdownNotificacoes) {
    iconeSinoNotificacoes.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = dropdownNotificacoes.style.display === 'block';
        dropdownNotificacoes.style.display = isVisible ? 'none' : 'block';
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!dropdownNotificacoes.contains(e.target) && e.target !== iconeSinoNotificacoes) {
            dropdownNotificacoes.style.display = 'none';
        }
    });
}

// Botão de configuração de números no dropdown
const btnConfigNotificacoes = document.getElementById('btnConfigNotificacoes');
if (btnConfigNotificacoes) {
    btnConfigNotificacoes.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownNotificacoes.style.display = 'none'; // Fechar dropdown
        const modal = new bootstrap.Modal(document.getElementById('modalConfigNumeros'));
        modal.show();
        carregarNumerosNotificacao(); // Carregar números ao abrir modal
    });
}

// Função para carregar números cadastrados
async function carregarNumerosNotificacao() {
    try {
        const response = await fetch('/api/numeros-notificacao');
        const resultado = await response.json();
        
        const tbody = document.getElementById('tabelaNumerosBody');
        
        if (!resultado.success || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-4">
                        <i class="fas fa-phone-slash fa-2x mb-2"></i><br>
                        Nenhum número cadastrado ainda.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        resultado.data.forEach(num => {
            const ultimaNoti = num.ultimanoti 
                ? new Date(num.ultimanoti).toLocaleDateString('pt-BR') 
                : 'Nunca';
            
            html += `
                <tr>
                    <td><i class="fas fa-phone text-success me-2"></i>${num.numero}</td>
                    <td><small class="text-muted">${ultimaNoti}</small></td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="excluirNumeroNotificacao(${num.id}, '${num.numero}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar números:', error);
        showToast('Erro ao carregar números de notificação', 'error');
    }
}

// Formulário para adicionar número
const formAdicionarNumero = document.getElementById('formAdicionarNumero');
if (formAdicionarNumero) {
    formAdicionarNumero.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const numeroInput = document.getElementById('numeroTelefone');
        const numero = numeroInput.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        
        if (numero.length < 10) {
            showToast('Número inválido. Digite um número com DDD.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/numeros-notificacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ numero })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                showToast('Número cadastrado com sucesso!', 'success');
                numeroInput.value = '';
                carregarNumerosNotificacao(); // Recarregar lista
            } else {
                showToast(resultado.message || 'Erro ao cadastrar número', 'error');
            }
            
        } catch (error) {
            console.error('Erro ao adicionar número:', error);
            showToast('Erro ao cadastrar número', 'error');
        }
    });
}

// Função para excluir número
async function excluirNumeroNotificacao(id, numero) {
    if (!confirm(`Deseja realmente excluir o número ${numero}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/numeros-notificacao/${id}`, {
            method: 'DELETE'
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            showToast('Número excluído com sucesso!', 'success');
            carregarNumerosNotificacao(); // Recarregar lista
        } else {
            showToast(resultado.message || 'Erro ao excluir número', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao excluir número:', error);
        showToast('Erro ao excluir número', 'error');
    }
}

// Função para carregar saldos e verificar notificações (sem renderizar tabela)
async function carregarSaldosParaNotificacoes() {
    try {
        console.log('🔔 Carregando saldos para verificar notificações...');
        
        // 1. Verificar se há usuário logado
        const usuarioResponse = await fetch('/api/session-user');
        if (usuarioResponse.status === 401) {
            return; // Não está logado, não faz nada
        }
        
        const { usuario } = await usuarioResponse.json();
        if (!usuario) return;

        // 2. Buscar empresas
        const resEmpresas = await fetch("/api/buscarEmpresas");
        const resultado = await resEmpresas.json();
        const empresas = Array.isArray(resultado.data) ? resultado.data : [];

        if (empresas.length === 0) {
            console.log('⚠️ Nenhuma empresa encontrada');
            return;
        }

        // 3. Buscar saldos de cada empresa
        const promessas = empresas.map(async (emp) => {
            try {
                const resSaldo = await fetch(`http://162.240.157.62:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/saldo`);
                const saldo = await resSaldo.json();
                
                return {
                    id: emp.id,
                    empresa: emp.nome,
                    contaDeAnuncio: emp.contaDeAnuncio,
                    saldo: saldo?.data?.saldoOriginal || 0
                };
            } catch (err) {
                console.error(`Erro ao buscar saldo da empresa ${emp.nome}:`, err);
                return {
                    id: emp.id,
                    empresa: emp.nome,
                    contaDeAnuncio: emp.contaDeAnuncio,
                    saldo: 0
                };
            }
        });

        const dadosComSaldos = (await Promise.all(promessas)).filter(Boolean);
        
        // 4. Verificar saldos baixos e atualizar notificações
        verificarSaldosBaixos(dadosComSaldos);
        console.log('✅ Notificações de saldo atualizadas');

    } catch (err) {
        console.error("Erro ao carregar saldos para notificações:", err);
    }
}

//Seleção de painel
const painelMonitoramento = document.getElementById('painelMonitoramento');
const painelAdministracao = document.getElementById('painelAdministracao');
const painelCRM = document.getElementById('crmSection');
const painelNotificacoes = document.getElementById('painelNotificacoes');
const painelMetricasVideo = document.getElementById('painelMetricasVideo');
const painelProposta = document.getElementById('painelProposta');

const btnDashboard = document.getElementById('dashboard');
const btnAdministracao = document.getElementById('administracao');
const btnCRM = document.getElementById('crm');
const btnNotificacoes = document.getElementById('Notificacoes');
const btnMetricasVideo = document.getElementById('metricasVideo');
const btnProposta = document.getElementById('proposta');

// Função centralizada para esconder todos os painéis
function esconderTodosPaineis() {
  // Esconder painéis
  painelMonitoramento.style.setProperty('display', 'none');
  painelMonitoramento.dataset.theme = "default";
  
  painelAdministracao.style.setProperty('display', 'none');
  painelAdministracao.dataset.theme = "default";
  
  painelCRM.style.setProperty('display', 'none');
  painelCRM.dataset.theme = "default";
  
  painelNotificacoes.style.setProperty('display', 'none');
  painelNotificacoes.dataset.theme = "default";
  
  painelMetricasVideo.style.setProperty('display', 'none');
  painelMetricasVideo.dataset.theme = "default";

  //Resetar Proposta
  if (painelProposta) {
    painelProposta.style.setProperty('display', 'none');
    painelProposta.dataset.theme = "default";
  }

  // Resetar botões - remover background-color E classe active
  btnDashboard.style.setProperty('background-color', 'transparent');
  btnDashboard.classList.remove('active');

  if (btnAdministracao) {
    btnAdministracao.style.setProperty('background-color', 'transparent');
    btnAdministracao.classList.remove('active');
  }

  if (btnCRM) {
    btnCRM.style.setProperty('background-color', 'transparent');
    btnCRM.classList.remove('active');
  }

  if (btnNotificacoes) {
    btnNotificacoes.style.setProperty('background-color', 'transparent');
    btnNotificacoes.classList.remove('active');
  }

  if (btnMetricasVideo) {
    btnMetricasVideo.style.setProperty('background-color', 'transparent');
    btnMetricasVideo.classList.remove('active');
  }

  if (btnProposta) {
    btnProposta.style.setProperty('background-color', 'transparent');
    btnProposta.classList.remove('active');
  }

  // Esconder formulários
  const formEmpresa = document.getElementById('FormCadastroEmpresa');
  const formUsuario = document.getElementById('FormCadastroUsuario');
  if (formEmpresa) formEmpresa.style.display = 'none';
  if (formUsuario) formUsuario.style.display = 'none';
}

//Painel administrção
document.getElementById('administracao').addEventListener('click', function(ev) {
  ev.preventDefault();
  
  if(painelAdministracao.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelAdministracao.dataset.theme = "ativo";
    painelAdministracao.style.setProperty('display', 'flex');
    btnAdministracao.style.setProperty('background-color', '#dde9f5ff');
    btnAdministracao.classList.add('active');

    // Inicializar com aba de empresas ativa
    document.getElementById('subAbaUsuario').style.display = 'none';
    document.getElementById('subAbaEmpresas').style.display = 'flex';
    
    // Configurar botão para modo empresa
    const btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    btnAdicionarSubAbaAdmin.innerHTML = '<i class="fas fa-plus"></i>Adicionar Empresa';
    btnAdicionarSubAbaAdmin.dataset.theme = "empresa";
    
    // Ativar visualmente a aba empresa
    document.getElementById('abaEmpresas').classList.add('active');
    document.getElementById('abaUsuario').classList.remove('active');

    carregarEmpresasCadastradas();
    refreshDados("cadastradas");
  }
});

//Painel DashBoard
document.getElementById('dashboard').addEventListener('click', function(ev) {
  ev.preventDefault();
  console.log("função ativa");

  if(painelMonitoramento.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelMonitoramento.dataset.theme = "ativo";
    painelMonitoramento.style.setProperty('display', 'flex');
    btnDashboard.style.setProperty('background-color', '#dde9f5ff');
    btnDashboard.classList.add('active');
  }
});

this.document.getElementById('metricasVideo').addEventListener('click', function(ev) {
  ev.preventDefault();

  if(painelMetricasVideo.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelMetricasVideo.dataset.theme = "ativo";
    painelMetricasVideo.style.setProperty('display', 'flex');
    btnMetricasVideo.style.setProperty('background-color', '#dde9f5ff');
    btnMetricasVideo.classList.add('active');
  }
});

document.getElementById('proposta').addEventListener('click', function(ev){
  ev.preventDefault();
  console.log("Botão Proposta clicado - função ativa");

  if(painelProposta && painelProposta.dataset.theme === "default") {
    esconderTodosPaineis();

    painelProposta.dataset.theme = "ativo";
    painelProposta.style.setProperty('display', 'flex');
    if (btnProposta) {
      btnProposta.style.setProperty('background-color', '#dde9f5ff');
      btnProposta.classList.add('active');
    }
    
    // Inicializar sistema de propostas se não estiver inicializado
    setTimeout(() => {
      if (typeof propostaManager === 'undefined' || !propostaManager) {
        if (typeof PropostaManager !== 'undefined') {
          propostaManager = new PropostaManager();
          console.log("Sistema de propostas inicializado");
        } else {
          console.error("Classe PropostaManager não encontrada");
        }
      }
    }, 100);
    
    console.log("Painel Proposta ativado");
  } else {
    console.log("Painel Proposta já está ativo ou elemento não encontrado");
  }
});

//Painel CRM
document.getElementById('crm').addEventListener('click', function(ev) {

  ev.preventDefault();
  console.log("função ativa");

  if(painelCRM.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelCRM.dataset.theme = "ativo";
    painelCRM.style.setProperty('display', 'flex');
    btnCRM.style.setProperty('background-color', '#dde9f5ff');
    btnCRM.classList.add('active');
    
    // Adicionar header do CRM se não existir
    adicionarHeaderCRM();
    
    // Carregar leads após exibir o painel
    setTimeout(() => {
      if (typeof carregarLeadsCRM === 'function') {
        carregarLeadsCRM();
      }
    }, 100);
  }
});

//Painel Notificações
document.getElementById('Notificacoes').addEventListener('click', function(ev) {
  ev.preventDefault();

  console.log("função ativa");
  if(painelNotificacoes.dataset.theme === "default") {
    esconderTodosPaineis();
    
    painelNotificacoes.dataset.theme = "ativo";
    painelNotificacoes.style.setProperty('display', 'flex');
    btnNotificacoes.style.setProperty('background-color', '#dde9f5ff');
    btnNotificacoes.classList.add('active');
  }
});

document.getElementById('abaUsuario').addEventListener('click', function(ev){
    ev.preventDefault();
    let btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    let subAbaEmpresas = document.getElementById('subAbaEmpresas');
    let subAbaUsuario = document.getElementById('subAbaUsuario');
    
    // Sempre alterar para mode usuário, independente do estado atual
    btnAdicionarSubAbaAdmin.innerHTML = '<i class="fas fa-plus"></i>Adicionar Usuario';
    btnAdicionarSubAbaAdmin.dataset.theme = "usuario";

    // Esconder aba de empresas e mostrar aba de usuários
    subAbaEmpresas.style.setProperty('display', 'none');
    subAbaUsuario.style.setProperty('display', 'flex');
    
    // Ativar estilo do botão usuário
    document.getElementById('abaUsuario').classList.add('active');
    document.getElementById('abaEmpresas').classList.remove('active');
    
    // Carregar lista de usuários quando a aba for ativada
    carregarUsuariosCadastrados();
})

document.getElementById('abaEmpresas').addEventListener('click', function(ev){
    ev.preventDefault();
    let btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
    let subAbaUsuario = document.getElementById('subAbaUsuario');
    let subAbaEmpresas = document.getElementById('subAbaEmpresas');

    // Sempre alterar para mode empresa, independente do estado atual
    btnAdicionarSubAbaAdmin.innerHTML = '<i class="fas fa-plus"></i>Adicionar Empresa';
    btnAdicionarSubAbaAdmin.dataset.theme = "empresa";
    
    // Esconder aba de usuários e mostrar aba de empresas
    subAbaUsuario.style.setProperty('display', 'none');
    subAbaEmpresas.style.setProperty('display', 'flex');
    
    // Ativar estilo do botão empresa
    document.getElementById('abaEmpresas').classList.add('active');
    document.getElementById('abaUsuario').classList.remove('active');
    
    // Carregar lista de empresas
    carregarEmpresasCadastradas();
    refreshDados("cadastradas");
})

async function carregarEmpresasSelect() {
    try {
      LoadingUtils.showOverlay('Carregando empresas...');
      
      // A API /api/buscarEmpresas já considera as permissões do usuário logado
      const response = await fetch('/api/buscarEmpresas', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const resultado = await response.json();
      const empresas = Array.isArray(resultado.data) ? resultado.data : [];

      const select = document.getElementById('empresaSelect');
      // Limpar opções existentes
      select.innerHTML = '<option value="">Selecione uma empresa</option>';
      
      empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        select.appendChild(option);
      });
      
      LoadingUtils.hideOverlay();
    } catch (error) {
      LoadingUtils.hideOverlay();
      console.error('Erro ao carregar empresas:', error);
    }
}

const PermissaoEnum = {
    ADMIN: 'ADMIN',
    GESTOR: 'GESTOR',
    USER: 'USER'
  };

// Variável global para armazenar a permissão do usuário logado
let permissaoUsuarioLogado = null;

// ====== ESTADO E UTILITÁRIOS PARA ORDENAÇÃO POR "SALDO [META]" ======
let saldoMetaSort = 0; // 0 = sem ordenação, 1 = asc (menor->maior), -1 = desc (maior->menor)
let ultimoDadosEmpresas = []; // guarda os últimos dados para re-render quando ordenar

function isSaldoCartao(saldo) {
    if (saldo === null || saldo === undefined) return false;
    const saldoStr = String(saldo).toLowerCase();
    return saldoStr.includes('cartão') || saldoStr.includes('cartao') || saldoStr.includes('card');
}

function extrairValorSaldo(saldo) {
    if (saldo === null || saldo === undefined) return NaN;
    if (typeof saldo === 'number') return saldo;

    let s = String(saldo).trim();
    if (!s) return NaN;

    // Se contém indicação de cartão, marcar como NaN (irá para o fim)
    if (isSaldoCartao(s)) return NaN;

    // Remover símbolos de moeda e letras, manter dígitos, ponto e vírgula e sinal
    let clean = s.replace(/[^\d.,-]/g, '');

    if (!clean) return NaN;

    // Tratar formatos BR e EN de forma mais inteligente:
    
    // Caso 1: Contém AMBOS ponto e vírgula (ex: 1.029,61 ou 1,029.61)
    if (clean.indexOf('.') !== -1 && clean.indexOf(',') !== -1) {
        // Verificar qual vem primeiro
        const posVirgula = clean.indexOf(',');
        const posPonto = clean.indexOf('.');
        
        if (posPonto < posVirgula) {
            // Ponto vem antes: formato BR (1.029,61)
            // Remover pontos (separador de milhar) e trocar vírgula por ponto (decimal)
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            // Vírgula vem antes: formato EN (1,029.61)
            // Remover vírgulas (separador de milhar) e manter ponto (decimal)
            clean = clean.replace(/,/g, '');
        }
    }
    // Caso 2: Só vírgula (formato BR: 1029,61 ou 10,50)
    else if (clean.indexOf(',') !== -1 && clean.indexOf('.') === -1) {
        // Trocar vírgula por ponto para parseFloat
        clean = clean.replace(',', '.');
    }
    // Caso 3: Só ponto - AQUI ESTÁ O PROBLEMA!
    else if (clean.indexOf('.') !== -1 && clean.indexOf(',') === -1) {
        // Verificar se é separador de milhar (formato BR) ou decimal (formato EN)
        const partes = clean.split('.');
        
        // Se tem mais de 2 partes (ex: 1.029.450), é definitivamente separador de milhar BR
        if (partes.length > 2) {
            clean = clean.replace(/\./g, '');
        }
        // Se tem exatamente 2 partes, verificar o tamanho da parte decimal
        else if (partes.length === 2) {
            const parteDecimal = partes[1];
            // Se a parte depois do ponto tem exatamente 3 dígitos (ex: 1.029), é separador de milhar BR
            // Se tem 1 ou 2 dígitos (ex: 10.5 ou 10.50), é separador decimal EN
            if (parteDecimal.length === 3) {
                // Formato BR: 1.029 -> remover o ponto
                clean = clean.replace('.', '');
            }
            // else: manter como está (formato EN decimal)
        }
    }
    
    const num = parseFloat(clean);
    return isNaN(num) ? NaN : num;
}

// Função para verificar permissões e configurar interface
async function verificarPermissoesEConfigurarInterface() {
  try {
    const response = await fetch('/api/session-user');
    if (response.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    
    const { usuario } = await response.json();
    if (!usuario) {
      window.location.href = '/login.html';
      return;
    }

    // Armazenar permissão globalmente
    permissaoUsuarioLogado = usuario.permissao;

    // Configurar interface baseado na permissão
    configurarInterfacePorPermissao(usuario.permissao);
    
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    // Em caso de erro de rede, não redireciona automaticamente
  }
}

// Função para configurar interface baseado na permissão
function configurarInterfacePorPermissao(permissao) {
  const administracaoLi = document.getElementById('administracao');
  const subAbasAdmin = document.getElementById('subAbasAdmin');
  const btnAdicionarSubAbaAdmin = document.getElementById('btnAdicionarSubAbaAdmin');
  const notificacoesLi = document.getElementById('Notificacoes');
  const propostaLi = document.getElementById('proposta');
  
  if (permissao === 'USER') {
    // USER: Agora pode ver todas as abas
    if (administracaoLi) {
      administracaoLi.style.display = 'block';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'block';
    }
    if (propostaLi) {
      propostaLi.style.display = 'block';
    }
    // Ocultar apenas a aba de criação de usuários para USER
    const abaUsuario = document.getElementById('abaUsuario');
    if (abaUsuario) {
      abaUsuario.style.display = 'none';
    }
    // Ocultar botão de adicionar empresa para USER
    if (btnAdicionarSubAbaAdmin) {
      btnAdicionarSubAbaAdmin.style.display = 'none';
    }
  } else if (permissao === 'GESTOR') {
    // GESTOR: Mostrar administração, notificações e proposta, mas ocultar criação de usuários
    if (administracaoLi) {
      administracaoLi.style.display = 'block';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'block';
    }
    if (propostaLi) {
      propostaLi.style.display = 'block';
    }
    // Ocultar aba de usuários para gestores
    const abaUsuario = document.getElementById('abaUsuario');
    if (abaUsuario) {
      abaUsuario.style.display = 'none';
    }
  } else if (permissao === 'ADMIN') {
    // ADMIN: Acesso total
    if (administracaoLi) {
      administracaoLi.style.display = 'block';
    }
    if (notificacoesLi) {
      notificacoesLi.style.display = 'block';
    }
    if (propostaLi) {
      propostaLi.style.display = 'block';
    }
  }
}

  function carregarPermissoes() {
    const select = document.getElementById('permissaoSelect');
    Object.entries(PermissaoEnum).forEach(([key, value]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = key.charAt(0) + key.slice(1).toLowerCase(); // Ex: Admin, Gestor...
      select.appendChild(option);
    });
  }


document.getElementById('btnAdicionarSubAbaAdmin').addEventListener('click', function(ev) {
    console.log("botão adicionar em sub aba admin foi ativo");
    console.log("Theme:", ev.currentTarget.dataset.theme);
    
    if(ev.currentTarget.dataset.theme === "empresa"){
        // Abrir modal de criar empresa
        console.log("Abrindo modal de empresa");
        const modalElement = document.getElementById('modalCriarEmpresa');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error("Modal de empresa não encontrado");
        }
    }else{
        // Abrir modal de criar usuário
        console.log("Abrindo modal de usuário");
        const modalElement = document.getElementById('modalCriarUsuario');
        if (modalElement) {
            try {
                carregarEmpresasUsuarioModal();
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } catch (error) {
                console.error("Erro ao abrir modal de usuário:", error);
            }
        } else {
            console.error("Modal de usuário não encontrado");
        }
    }
});

// Event listeners para os novos modais
document.getElementById('btnSalvarEmpresa').addEventListener('click', async function(ev) {
    try {
        ev.preventDefault();
        console.log("função de salvar empresa ativa");

        // Mostrar loading no botão
        const btnOriginal = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
        this.disabled = true;


    let nome = document.getElementById('nomeEmpresaModal').value;
    let contaDeAnuncio = document.getElementById('idContaAnuncioModal').value;

    if (!nome || !contaDeAnuncio) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    let empresa = {
      nome: nome,
      contaDeAnuncio: contaDeAnuncio
    };

        const response = await fetch('/api/criarEmpresa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(empresa)
        });

        const data = await response.json();

        if (response.ok) {
            toastUtils.showToast('Empresa criada com sucesso!', 'success');
            // Limpar formulário
            document.getElementById('formCriarEmpresa').reset();
            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCriarEmpresa')).hide();
            // Recarregar lista
            carregarEmpresas();
        } else {
            throw new Error(data.erro || 'Erro ao criar empresa');
        }

    } catch (error) {
        console.error('Erro ao salvar empresa:', error);
        toastUtils.showToast(error.message || 'Erro ao salvar empresa', 'error');
    } finally {
        // Restaurar botão
        this.innerHTML = btnOriginal;
        this.disabled = false;
    }
});

document.getElementById('btnSalvarUsuario').addEventListener('click', async function(ev) {
    try {
        ev.preventDefault();
        console.log("função de salvar usuário ativa");

        // Mostrar loading no botão
        const btnOriginal = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
        this.disabled = true;

        let nome = document.getElementById('nomeUsuarioModal').value;
        let email = document.getElementById('emailUsuarioModal').value;
        let senha = document.getElementById('senhaUsuarioModal').value;
        let permissao = document.getElementById('permissaoUsuarioModal').value;

        if (!nome || !email || !senha || !permissao) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Coletar empresas selecionadas
        const empresasCheckboxes = document.querySelectorAll('#empresasUsuarioCheckboxes input[type="checkbox"]:checked');
        const empresas = Array.from(empresasCheckboxes).map(cb => parseInt(cb.value));

        if (permissao !== 'ADMIN' && empresas.length === 0) {
            alert('Usuários não administradores devem ter pelo menos uma empresa vinculada');
            return;
        }

        let usuario = {
            nome: nome,
            email: email,
            senha: senha,
            permissao: permissao,
            empresas: empresas
        };

        const response = await fetch('/api/criarUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuario)
        });

        const data = await response.json();

        if (response.ok) {
            toastUtils.showToast('Usuário criado com sucesso!', 'success');
            // Limpar formulário
            document.getElementById('formCriarUsuario').reset();
            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCriarUsuario')).hide();
            // Recarregar lista (se houver)
            // carregarUsuarios(); // Implementar se necessário
        } else {
            throw new Error(data.erro || 'Erro ao criar usuário');
        }

    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        toastUtils.showToast(error.message || 'Erro ao salvar usuário', 'error');
    } finally {
        // Restaurar botão
        this.innerHTML = btnOriginal;
        this.disabled = false;
    }
});

// Função para carregar empresas no modal de usuário
function carregarEmpresasUsuarioModal() {
    const container = document.getElementById('empresasUsuarioCheckboxes');
    
    fetch('/api/buscarEmpresas')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                let html = '';
                data.data.forEach(empresa => {
                    html += `
                        <div class="form-check mb-2" style="position:relative;z-index:1;">
                            <input class="form-check-input" type="checkbox" value="${empresa.id}" id="empresa_user_${empresa.id}" style="cursor:pointer;pointer-events:auto;position:relative;z-index:2;">
                            <label class="form-check-label" for="empresa_user_${empresa.id}" style="cursor:pointer;user-select:none;">
                                <i class="fas fa-building me-1"></i>
                                ${empresa.nome}
                            </label>
                        </div>
                    `;
                });
                container.innerHTML = html || '<div class="text-muted">Nenhuma empresa encontrada</div>';
                console.log('✅ Checkboxes de empresas carregados:', data.data.length);
                
                // Garantir que os checkboxes funcionem após carregamento
                setTimeout(() => {
                    document.querySelectorAll('#empresasUsuarioCheckboxes .form-check-input').forEach(checkbox => {
                        checkbox.addEventListener('click', function(e) {
                            e.stopPropagation();
                            console.log('Checkbox clicado:', this.id, 'Marcado:', this.checked);
                        });
                    });
                    
                    // Garantir que clicar no label também marque o checkbox
                    document.querySelectorAll('#empresasUsuarioCheckboxes .form-check-label').forEach(label => {
                        label.addEventListener('click', function(e) {
                            const checkboxId = this.getAttribute('for');
                            const checkbox = document.getElementById(checkboxId);
                            if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                console.log('Label clicado, checkbox:', checkboxId, 'Marcado:', checkbox.checked);
                            }
                        });
                    });
                    
                    // Funcionalidade "Selecionar Todas"
                    const selecionarTodas = document.getElementById('selecionarTodasEmpresas');
                    if (selecionarTodas) {
                        selecionarTodas.addEventListener('change', function() {
                            const checkboxes = document.querySelectorAll('#empresasUsuarioCheckboxes .form-check-input');
                            checkboxes.forEach(cb => {
                                cb.checked = this.checked;
                            });
                            console.log(this.checked ? '✅ Todas as empresas selecionadas' : '❌ Todas as empresas desmarcadas');
                        });
                    }
                }, 100);
            } else {
                container.innerHTML = '<div class="text-danger">Erro ao carregar empresas</div>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
            container.innerHTML = '<div class="text-danger">Erro ao carregar empresas</div>';
        });
}

document.getElementById('salvarEmpresa').addEventListener('click', async function(ev) {
  try {
    ev.preventDefault();
    console.log("função de salvar empresa ativa");

    // Mostrar loading no botão
    LoadingUtils.buttonLoading(this, true);

    let nome = document.getElementById('nomeEmpresa').value;
    let contaDeAnuncio = document.getElementById('idContaAnuncio').value;

    console.log("Nome da empresa:", nome);
    console.log("Conta de anúncio:", contaDeAnuncio);

    const response = await fetch('/api/criarEmpresa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, contaDeAnuncio })
    });
    const data = await response.json();

    LoadingUtils.buttonLoading(this, false);

    if (data.error) {
      console.error('[MetaAdsService] Erro retornado pela API:', data.error);
      alert('Erro ao salvar empresa: ' + data.error);
    } else {
      alert('Empresa salva com sucesso!');
    }
    
    refreshDados("cadastradas");
    document.getElementById('FormCadastroEmpresa').style.display = 'none';
  } catch (error) {
    LoadingUtils.buttonLoading(this, false);
    console.error('Erro ao salvar empresa:', error);
    alert('Erro ao salvar empresa');
  }
});

async function carregarEmpresasCadastradas() {
  // Mostrar loading no container das empresas
  LoadingUtils.showContainer('subAbaEmpresas', 'Carregando empresas cadastradas...');
  
  try {
    // 1. Verificar se há usuário logado
    const usuarioResponse = await fetch('/api/session-user');
    if (usuarioResponse.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    
    const { usuario } = await usuarioResponse.json();
    if (!usuario) {
      window.location.href = '/login.html';
      return;
    }

    // 2. Buscar empresas baseado na permissão do usuário
    console.log('📡 Buscando empresas...');
    const resEmpresas = await fetch("/api/buscarEmpresas");
    console.log('📡 Status da resposta:', resEmpresas.status);
    
    if (!resEmpresas.ok) {
      const errorText = await resEmpresas.text();
      console.error('❌ Erro ao buscar empresas:', errorText);
      throw new Error(`Erro ${resEmpresas.status}: ${errorText}`);
    }
    
    const resultado = await resEmpresas.json();
    console.log('✅ Resultado da API buscarEmpresas:', resultado);

    const empresas = Array.isArray(resultado.data) ? resultado.data : [];
    console.log('📊 Total de empresas retornadas:', empresas.length);

    // 3. Criar promessas para cada empresa
    const promessas = empresas.map(async (emp) => {
      try {
        console.log(`Processando empresa:`, emp);
        
        const [resMetrica, resSaldo] = await Promise.all([
          fetch(`http://162.240.157.62:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/insights`),
          fetch(`http://162.240.157.62:3001/api/v1/metrics/account/${emp.contaDeAnuncio}/saldo`)
        ]);

        const metricas = await resMetrica.json();
        const saldo = await resSaldo.json();
        
        console.log(`Métricas para ${emp.nome}:`, metricas);
        console.log(`Saldo para ${emp.nome}:`, saldo);

        if (metricas?.data?.length > 0) {
          const resultado = {
            id: emp.id,
            empresa: emp.nome,
            contaDeAnuncio: emp.contaDeAnuncio,
            cliques: metricas.data[0].cliques || 0,
            impressoes: metricas.data[0].impressoes || 0,
            alcance: metricas.data[0].alcance || 0,
            gasto: metricas.data[0].gasto || 0,
            ctr: metricas.data[0].ctr || 0,
            cpc: metricas.data[0].cpc || 0,
            cpr: metricas.data[0].cpr || 0,
            saldo: saldo?.data?.saldoOriginal || 0,
            // Incluir dados manuais
            ultima_recarga: emp.ultima_recarga || null,
            saldo_diario: emp.saldo_diario || null,
            recorrencia: emp.recorrencia || null,
            orcamento: emp.orcamento || null
          };
          console.log(`Resultado final para ${emp.nome}:`, resultado);
          return resultado;
        } else {
          // Se não há métricas, retornar apenas os dados básicos da empresa
          console.log(`⚠️ Sem métricas para ${emp.nome}, retornando dados básicos`);
          return {
            id: emp.id,
            empresa: emp.nome,
            contaDeAnuncio: emp.contaDeAnuncio,
            cliques: 0,
            impressoes: 0,
            alcance: 0,
            gasto: 0,
            ctr: 0,
            cpc: 0,
            cpr: 0,
            saldo: 0,
            // Incluir dados manuais
            ultima_recarga: emp.ultima_recarga || null,
            saldo_diario: emp.saldo_diario || null,
            recorrencia: emp.recorrencia || null,
            orcamento: emp.orcamento || null
          };
        }
      } catch (err) {
        console.error(`Erro ao buscar métricas da empresa ${emp.nome}:`, err);
        // Retornar dados básicos mesmo em caso de erro
        return {
          id: emp.id,
          empresa: emp.nome,
          contaDeAnuncio: emp.contaDeAnuncio,
          cliques: 0,
          impressoes: 0,
          alcance: 0,
          gasto: 0,
          ctr: 0,
          cpc: 0,
          cpr: 0,
          saldo: 0,
          // Incluir dados manuais
          ultima_recarga: emp.ultima_recarga || null,
          saldo_diario: emp.saldo_diario || null,
          recorrencia: emp.recorrencia || null,
          orcamento: emp.orcamento || null
        };
      }
    });

    // 4. Aguardar todas as promessas de uma vez
    const dadosComMetricas = (await Promise.all(promessas)).filter(Boolean);
    console.log('✅ Total de empresas processadas:', dadosComMetricas.length);
    console.log('📊 Dados completos:', dadosComMetricas);

    // 5. Guardar dados e renderizar tabela (remove o loading)
    ultimoDadosEmpresas = dadosComMetricas.slice();
    console.log('🎨 Chamando renderTabelaEmpresas...');
    renderTabelaEmpresas(dadosComMetricas);
    console.log('✅ Tabela renderizada');
    
    // 6. Verificar saldos baixos e atualizar notificações
    verificarSaldosBaixos(dadosComMetricas);

  } catch (err) {
    console.error("❌ Erro ao carregar empresas e métricas:", err);
    document.getElementById("subAbaEmpresas").innerHTML =
      "<p style='color:red'>Erro ao carregar dados: " + err.message + "</p>";
  }
}

// Função para calcular se o saldo está crítico
function calcularAlertaSaldo(ultimaRecarga, recorrencia, saldoAtual, saldoDiario, orcamentoTotal) {
  // Verificar se todos os campos necessários estão preenchidos e não são zero
  if (!ultimaRecarga || (ultimaRecarga == 0) || !recorrencia || (recorrencia == 0) || !saldoAtual || (saldoAtual == 0) || !saldoDiario || (saldoDiario == 0) || !orcamentoTotal || (orcamentoTotal == 0)) {
    return { critico: false, impulsionar: false, info: null };
  }

  // Se algum campo for zero, não aplicar nenhuma regra
  if (
    recorrencia == 0 || saldoAtual == 0 || saldoDiario == 0 || orcamentoTotal == 0
  ) {
    return { critico: false, impulsionar: false, info: null };
  }

  try {
    // Converter última recarga para Date
    const dataUltimaRecarga = new Date(ultimaRecarga);
    const hoje = new Date();
    
    // Calcular próxima recarga baseado na recorrência
    let proximaRecarga = new Date(dataUltimaRecarga);
    
    // Se recorrência for número, usar como dias direto
    const recorrenciaDias = typeof recorrencia === 'number' ? recorrencia : parseInt(recorrencia);
    
    if (!isNaN(recorrenciaDias) && recorrenciaDias > 0) {
      // Recorrência numérica - adicionar dias
      proximaRecarga.setDate(proximaRecarga.getDate() + recorrenciaDias);
    } else {
      return { critico: false, info: 'Recorrência não reconhecida' };
    }

    // Calcular dias restantes até a próxima recarga
    const diffTime = proximaRecarga - hoje;
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Se já passou da data, não calcular
    if (diasRestantes <= 0) {
      return { 
        critico: true, 
        info: 'Recarga atrasada!',
        diasRestantes: diasRestantes,
        proximaRecarga: proximaRecarga,
        saldoPorDia: 0
      };
    }

    // Extrair valor numérico do saldo
    const saldoNumerico = extrairValorSaldo(saldoAtual);
    const saldoDiarioNumerico = parseFloat(saldoDiario);
    const orcamentoTotalNumerico = parseFloat(orcamentoTotal);
    
    if (isNaN(saldoNumerico) || isNaN(saldoDiarioNumerico) || isNaN(orcamentoTotalNumerico)) {
      return { critico: false, info: null };
    }

    // NOVA LÓGICA: Calcular se irá sobrar 15% do orçamento
    // 1. Calcular margem de 15% do orçamento
    const margem15Porcento = orcamentoTotalNumerico * 0.15;
    
    // 2. Calcular gasto esperado até a próxima recarga
    const gastoEsperado = saldoDiarioNumerico * diasRestantes;
    
    // 3. Calcular quanto sobrará do saldo META atual após o gasto
    const saldoRestante = saldoNumerico - gastoEsperado;
    
    // 4. Verificar se o saldo restante será menor que 15% do orçamento
    const critico = saldoRestante < margem15Porcento;
    
    // Calcular percentual de sobra em relação ao orçamento
    const percentualSobra = (saldoRestante / orcamentoTotalNumerico) * 100;

    // Impulsionar: Se sobrar mais de 40% do orçamento, pode impulsionar
    const impulsionar = percentualSobra > 40;

    console.log('Cálculo de alerta:', {
      diasRestantes,
      saldoMETAAtual: saldoNumerico,
      saldoDiarioNumerico,
      gastoEsperado,
      orcamentoTotal: orcamentoTotalNumerico,
      margem15Porcento,
      saldoRestante,
      percentualSobra: percentualSobra.toFixed(2) + '%',
      critico,
      impulsionar
    });
    
    return {
      critico: critico,
      impulsionar: impulsionar,
      info: `${diasRestantes} dias até recarga | Gasto previsto: R$ ${gastoEsperado.toFixed(2)} | Sobra: R$ ${saldoRestante.toFixed(2)} (${percentualSobra.toFixed(1)}%) ${critico ? '⚠️' : '✓'}`,
      diasRestantes: diasRestantes,
      proximaRecarga: proximaRecarga,
      gastoPrevisto: gastoEsperado,
      saldoRestante: saldoRestante,
      percentualSobra: percentualSobra,
      saldoDiarioEsperado: saldoDiarioNumerico
    };

  } catch (err) {
    console.error('Erro ao calcular alerta de saldo:', err);
    return { critico: false, info: null };
  }
}

// Função de renderizar tabela de empresas
function renderTabelaEmpresas(dados) {
  console.log('🎨 renderTabelaEmpresas iniciada');
  console.log('📊 Dados recebidos:', dados);
  const container = document.getElementById("subAbaEmpresas");
  
  if (!container) {
    console.error('❌ Container subAbaEmpresas não encontrado!');
    return;
  }
  console.log('✅ Container encontrado:', container);

  // Guardar últimos dados para reuso (re-render ao trocar ordenação)
  ultimoDadosEmpresas = Array.isArray(dados) ? dados.slice() : [];
  console.log('📦 ultimoDadosEmpresas atualizado:', ultimoDadosEmpresas.length, 'empresas');

  // Aplicar ordenação se solicitada
  let dadosParaRender = ultimoDadosEmpresas.slice();

  if (saldoMetaSort !== 0) {
      dadosParaRender.sort((a, b) => {
          // Priorizar não-cartão antes de cartão
          const aIsCard = isSaldoCartao(a.saldo);
          const bIsCard = isSaldoCartao(b.saldo);
          if (aIsCard && !bIsCard) return 1;
          if (!aIsCard && bIsCard) return -1;

          // Ambos cartão ou ambos não-cartão -> comparar valor numérico
          const va = extrairValorSaldo(a.saldo);
          const vb = extrairValorSaldo(b.saldo);

          // Valores não numéricos vão para o fim (após numéricos, antes dos cartões já tratados)
          const aNaN = isNaN(va);
          const bNaN = isNaN(vb);
          if (aNaN && bNaN) return 0;
          if (aNaN && !bNaN) return 1;
          if (!aNaN && bNaN) return -1;

          // Comparação padrão
          return (va - vb) * (saldoMetaSort === 1 ? 1 : -1);
      });
  }

  if (!dadosParaRender || dadosParaRender.length === 0) {
    console.log('⚠️ Nenhum dado para renderizar');
    container.innerHTML = "<p>Nenhuma empresa cadastrada.</p>";
    return;
  }
  
  console.log('📋 Renderizando', dadosParaRender.length, 'empresas');

  // Verificar se deve mostrar botões de ação (somente para GESTOR e ADMIN)
  const mostrarBotoesAcao = permissaoUsuarioLogado !== 'USER';


  let tabela = `
    <div class="tabela-empresas-container">
      <table class="tabela-empresas table table-striped">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Última Recarga</th>
            <th>Saldo Diário</th>
            <th>Recorrência</th>
            <th>Orçamento</th>
            <th>Salvar</th>
            <th>Saldo D/Atual</th>
            <th id="thSaldoMeta" class="sortable" style="cursor:pointer; user-select:none;">
              Saldo [META] <i class="fas fa-sort" style="margin-left:8px"></i>
            </th>
            <th>Saldo [GOOGLE]</th>
            ${mostrarBotoesAcao ? '<th>Ações</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  dadosParaRender.forEach(emp => {
    // Formatar data para o input type="date" (YYYY-MM-DD)
    const dataFormatada = emp.ultima_recarga ? emp.ultima_recarga.split('T')[0] : '';
    
    // Calcular se o saldo está crítico
    const alertaSaldo = calcularAlertaSaldo(
      emp.ultima_recarga, 
      emp.recorrencia, 
      emp.saldo, 
      emp.saldo_diario,
      emp.orcamento
    );
    console.log(`Empresa: ${emp.empresa} | Crítico: ${alertaSaldo.critico} | Impulsionar: ${alertaSaldo.impulsionar}`);
    // Aplicar classe CSS se estiver crítico ou impulsionar
    let classeLinha = '';
    let iconeStatus = '';
    if (alertaSaldo.critico) {
      classeLinha = 'table-danger';
      iconeStatus = `<i class="fas fa-exclamation-triangle text-danger ms-2 info-icon-critico" style="cursor:pointer"></i>`;
      console.log(`Linha vermelha aplicada para empresa: ${emp.empresa}`);
    } else if (alertaSaldo.impulsionar) {
      classeLinha = 'table-success linha-impulsionar';
      iconeStatus = `<i class="fas fa-arrow-up text-success ms-2 seta-pulsando info-icon-impulsionar " style="cursor:pointer"></i>`;
      console.log(`Linha verde impulsionar aplicada para empresa: ${emp.empresa}`);
    }
  // Adicionar popover customizado leve para os ícones de alerta
  if (!document.getElementById('popoverInfoAlertaSaldo')) {
    const popoverDiv = document.createElement('div');
    popoverDiv.id = 'popoverInfoAlertaSaldo';
    popoverDiv.style.position = 'absolute';
    popoverDiv.style.zIndex = '9999';
    popoverDiv.style.background = '#fff';
    popoverDiv.style.border = '1px solid #ccc';
    popoverDiv.style.borderRadius = '6px';
    popoverDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    popoverDiv.style.padding = '8px 14px';
    popoverDiv.style.fontSize = '13px';
    popoverDiv.style.color = '#333';
    popoverDiv.style.display = 'none';
    popoverDiv.style.maxWidth = '350px';
    document.body.appendChild(popoverDiv);
  }

  setTimeout(() => {
    const popover = document.getElementById('popoverInfoAlertaSaldo');
    function showPopover(text, icon) {
      popover.innerHTML = text;
      popover.style.display = 'block';
      const rect = icon.getBoundingClientRect();
      popover.style.top = (rect.bottom + window.scrollY + 6) + 'px';
      popover.style.left = (rect.left + window.scrollX - 10) + 'px';
    }
    function hidePopover() {
      popover.style.display = 'none';
    }
    document.querySelectorAll('.info-icon-critico').forEach(icon => {
      icon.removeAttribute('title');
      icon.addEventListener('mouseenter', function() {
        const info = icon.closest('tr').getAttribute('title') || '';
        showPopover(`<b>${info}</b><br>O gasto previsto até a próxima recarga não deixará sobrar 15% do orçamento total da conta.<br><span style='color:#d9534f'>⚠️ Atenção: Considere reduzir o orçamento diário ou fazer recarga antecipada.</span>`, icon);
      });
      icon.addEventListener('mouseleave', hidePopover);
    });
    document.querySelectorAll('.info-icon-impulsionar').forEach(icon => {
      icon.removeAttribute('title');
      icon.addEventListener('mouseenter', function() {
        const info = icon.closest('tr').getAttribute('title') || '';
        showPopover(`<b>${info}</b><br>O gasto previsto deixará sobrar mais de 40% do orçamento total.<br>✨ <b>Oportunidade:</b> Você pode aumentar o orçamento diário para impulsionar suas campanhas mantendo margem de segurança.`, icon);
      });
      icon.addEventListener('mouseleave', hidePopover);
    });
  }, 300);
    const tituloAlerta = alertaSaldo.info ? `title="${alertaSaldo.info}"` : '';
    
    tabela += `
      <tr data-empresa-id="${emp.id}" class="${classeLinha}" ${tituloAlerta}>
        <td>${emp.empresa}</td>
        <td>
          <input type="date" 
                 class="form-control form-control-sm campo-manual" 
                 data-field="ultima_recarga"
                 data-empresa-id="${emp.id}"
                 value="${dataFormatada}"
                 style="max-width: 150px;"
                 ${mostrarBotoesAcao ? '' : 'disabled'}>
        </td>
        <td>
          <input type="number" 
                 step="0.01" 
                 class="form-control form-control-sm campo-manual" 
                 data-field="saldo_diario"
                 data-empresa-id="${emp.id}"
                 value="${emp.saldo_diario != null ? emp.saldo_diario : ''}"
                 placeholder="0.00"
                 style="max-width: 120px;"
                 ${mostrarBotoesAcao ? '' : 'disabled'}>
        </td>
        <td>
          <input type="number" 
                 class="form-control form-control-sm campo-manual" 
                 data-field="recorrencia"
                 data-empresa-id="${emp.id}"
                 value="${emp.recorrencia || ''}"
                 placeholder="Ex: 30 (dias)"
                 style="max-width: 150px;"
                 ${mostrarBotoesAcao ? '' : 'disabled'}>
        </td>
        <td>
          <input type="number" 
                 step="0.01"
                 class="form-control form-control-sm campo-manual" 
                 data-field="orcamento"
                 data-empresa-id="${emp.id}"
                 value="${emp.orcamento != null ? emp.orcamento : ''}"
                 placeholder="0.00"
                 style="max-width: 150px;"
                 ${mostrarBotoesAcao ? '' : 'disabled'}>
        </td>
        ${mostrarBotoesAcao ? `
          <td style="text-align:center;">
            <button class="btn btn-sm btn-success btn-salvar-campos" 
                    data-empresa-id="${emp.id}" 
                    title="Salvar alterações">
              <i class="fas fa-save"></i>
            </button>
          </td>
        ` : '<td></td>'}
        <td class="valor">
          R$ ${emp.orcamentoTotal ? parseFloat(emp.orcamentoTotal).toFixed(2) : '0.00'}
        </td>
        <td class="valor">
          ${emp.saldo}
          ${iconeStatus}
        </td>
        <td class="valor">SaldoGoogle</td>
        ${mostrarBotoesAcao ? `
          <td>
            <button class="btn btn-sm btn-primary me-1" onclick="editarEmpresa(${emp.id}, '${emp.empresa}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="excluirEmpresa(${emp.id}, '${emp.empresa}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        ` : ''}
      </tr>
    `;
  });

  tabela += `</tbody></table></div>`;
  console.log('✅ HTML da tabela montado, tamanho:', tabela.length, 'caracteres');
  container.innerHTML = tabela;
  console.log('✅ HTML inserido no container');

  // Adicionar event listeners para os botões de salvar
  if (mostrarBotoesAcao) {
    const botoesSalvar = container.querySelectorAll('.btn-salvar-campos');
    
    botoesSalvar.forEach(botao => {
      botao.addEventListener('click', async function() {
        const empresaId = this.dataset.empresaId;
        const row = this.closest('tr');
        
        // Buscar todos os campos da linha
        const inputUltimaRecarga = row.querySelector('[data-field="ultima_recarga"]');
        const inputSaldoDiario = row.querySelector('[data-field="saldo_diario"]');
        const inputRecorrencia = row.querySelector('[data-field="recorrencia"]');
        const inputOrcamento = row.querySelector('[data-field="orcamento"]');
        
        // Validar se todos os campos foram preenchidos
        if (!inputUltimaRecarga.value || !inputSaldoDiario.value || !inputRecorrencia.value || !inputOrcamento.value) {
          if (typeof toastUtils !== 'undefined') {
            toastUtils.showToast('Por favor, preencha todos os campos antes de salvar', 'warning');
          } else {
            alert('Por favor, preencha todos os campos antes de salvar');
          }
          return;
        }
        
        console.log('💾 Salvando todos os campos para empresa:', empresaId);
        
        // Salvar todos os campos de uma vez
        await salvarCamposManuaisEmpresa(empresaId, {
          ultima_recarga: inputUltimaRecarga.value,
          saldo_diario: inputSaldoDiario.value,
          recorrencia: inputRecorrencia.value,
          orcamento: inputOrcamento.value
        }, this);
      });
    });
    
    // Adicionar validação visual quando os campos são preenchidos
    const camposManuais = container.querySelectorAll('.campo-manual');
    camposManuais.forEach(campo => {
      campo.addEventListener('input', function() {
        const row = this.closest('tr');
        const btnSalvar = row.querySelector('.btn-salvar-campos');
        
        // Verificar se todos os 4 campos estão preenchidos
        const inputUltimaRecarga = row.querySelector('[data-field="ultima_recarga"]');
        const inputSaldoDiario = row.querySelector('[data-field="saldo_diario"]');
        const inputRecorrencia = row.querySelector('[data-field="recorrencia"]');
        const inputOrcamento = row.querySelector('[data-field="orcamento"]');
        
        const todosCamposPreenchidos = inputUltimaRecarga.value && inputSaldoDiario.value && inputRecorrencia.value && inputOrcamento.value;
        
        // Destacar botão quando todos os campos estiverem preenchidos
        if (todosCamposPreenchidos) {
          btnSalvar.classList.add('btn-pulse');
          btnSalvar.style.animation = 'pulse 1s infinite';
        } else {
          btnSalvar.classList.remove('btn-pulse');
          btnSalvar.style.animation = '';
        }
      });
    });
  }

  // Atualizar ícone de ordenação conforme estado e anexar listener ao header
  const thSaldo = document.getElementById('thSaldoMeta');
  if (thSaldo) {
      const icone = thSaldo.querySelector('i');
      if (icone) {
          if (saldoMetaSort === 1) {
              icone.className = 'fas fa-sort-amount-down-alt'; // menor->maior
          } else if (saldoMetaSort === -1) {
              icone.className = 'fas fa-sort-amount-up'; // maior->menor
          } else {
              icone.className = 'fas fa-sort';
          }
      }

      // Garantir que o listener não seja duplicado
      if (!thSaldo._sortableAttached) {
          thSaldo.addEventListener('click', function() {
              // Alterna 0 -> 1 -> -1 -> 1 ...
              if (saldoMetaSort === 0 || saldoMetaSort === -1) {
                  saldoMetaSort = 1;
              } else if (saldoMetaSort === 1) {
                  saldoMetaSort = -1;
              }
              // Re-render com último conjunto de dados
              renderTabelaEmpresas(ultimoDadosEmpresas);
          });
          thSaldo._sortableAttached = true;
      }
  }
}

// Função para salvar todos os campos manuais de uma empresa
async function salvarCamposManuaisEmpresa(empresaId, campos, botaoElement) {
  try {
    console.log('🔄 Iniciando salvamento para empresa:', empresaId);
    console.log('📋 Campos a serem salvos:', campos);
    
    // Adicionar indicador visual de salvamento no botão
    const originalHTML = botaoElement.innerHTML;
    botaoElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    botaoElement.disabled = true;
    
    // Preparar dados convertendo recorrência para número
    const dados = {
      id_empresa: parseInt(empresaId),
      ultima_recarga: campos.ultima_recarga,
      saldo_diario: parseFloat(campos.saldo_diario),
      recorrencia: parseInt(campos.recorrencia),
      orcamento: parseFloat(campos.orcamento)
    };
    
    console.log('📤 Enviando dados convertidos para API:', dados);
    console.log('🔍 Tipos dos dados:', {
      id_empresa: typeof dados.id_empresa,
      ultima_recarga: typeof dados.ultima_recarga,
      saldo_diario: typeof dados.saldo_diario,
      recorrencia: typeof dados.recorrencia,
      orcamento: typeof dados.orcamento
    });
    
    const response = await fetch('/api/empresa/manuais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    
    console.log('📡 Resposta recebida - Status:', response.status);
    
    const data = await response.json();
    console.log('📦 Dados da resposta:', data);
    
    if (data.success) {
      console.log('✅ Campos salvos com sucesso');
      
      // Indicador visual de sucesso
      botaoElement.innerHTML = '<i class="fas fa-check"></i>';
      botaoElement.classList.remove('btn-success');
      botaoElement.classList.remove('btn-pulse');
      botaoElement.style.animation = '';
      botaoElement.classList.add('btn-success-checked');
      
      setTimeout(() => {
        botaoElement.innerHTML = originalHTML;
        botaoElement.classList.remove('btn-success-checked');
        botaoElement.classList.add('btn-success');
        botaoElement.style.animation = '';
      }, 2000);
      
      // Recalcular o alerta de saldo para essa linha
      const row = botaoElement.closest('tr');
      setTimeout(() => {
        atualizarAlertaLinhaEmpresa(row, empresaId);
      }, 100);
      
      // Toast de sucesso
      if (typeof toastUtils !== 'undefined') {
        toastUtils.showToast('Dados salvos com sucesso!', 'success');
      }
    } else {
      console.error('❌ Erro ao salvar:', data.message);
      
      // Indicador visual de erro
      botaoElement.innerHTML = '<i class="fas fa-times"></i>';
      botaoElement.classList.remove('btn-success');
      botaoElement.classList.add('btn-danger');
      
      setTimeout(() => {
        botaoElement.innerHTML = originalHTML;
        botaoElement.classList.remove('btn-danger');
        botaoElement.classList.add('btn-success');
      }, 2000);
      
      if (typeof toastUtils !== 'undefined') {
        toastUtils.showToast(data.message || 'Erro ao salvar campos', 'error');
      } else {
        alert('Erro ao salvar: ' + (data.message || 'Erro desconhecido'));
      }
    }
    
  } catch (err) {
    console.error('❌ Erro na requisição:', err);
    console.error('❌ Stack trace:', err.stack);
    
    botaoElement.innerHTML = '<i class="fas fa-times"></i>';
    botaoElement.classList.remove('btn-success');
    botaoElement.classList.add('btn-danger');
    
    setTimeout(() => {
      botaoElement.innerHTML = '<i class="fas fa-save"></i>';
      botaoElement.classList.remove('btn-danger');
      botaoElement.classList.add('btn-success');
    }, 2000);
    
    if (typeof toastUtils !== 'undefined') {
      toastUtils.showToast('Erro ao salvar campos', 'error');
    } else {
      alert('Erro ao salvar campos: ' + err.message);
    }
  } finally {
    botaoElement.disabled = false;
  }
}

// Função para salvar campo manual individual
async function salvarCampoManualIndividual(empresaId, field, valor, inputElement) {
  try {
    console.log('🔍 Iniciando salvarCampoManualIndividual');
    console.log('Empresa ID:', empresaId);
    console.log('Campo:', field);
    console.log('Valor:', valor);

    // Adicionar indicador visual de salvamento
    const originalBorder = inputElement.style.border;
    inputElement.style.border = '2px solid #ffc107'; // Amarelo - salvando
    inputElement.disabled = true;

    // Buscar todos os valores atuais da linha para enviar completo
    const row = inputElement.closest('tr');
    console.log('Linha da tabela:', row);

    const inputs = row.querySelectorAll('.campo-manual');
    console.log('Inputs encontrados na linha:', inputs);

    const dados = {
      id_empresa: empresaId,
      ultima_recarga: null,
      saldo_diario: null,
      recorrencia: null,
      orcamento: null
    };

    inputs.forEach(input => {
      const fieldName = input.dataset.field;
      let valorCampo = input.value || null;
      
      // Converter tipos apropriados
      if (fieldName === 'saldo_diario' && valorCampo) {
        valorCampo = parseFloat(valorCampo);
      } else if (fieldName === 'recorrencia' && valorCampo) {
        valorCampo = parseInt(valorCampo);
      } else if (fieldName === 'orcamento' && valorCampo) {
        valorCampo = parseFloat(valorCampo);
      }
      
      dados[fieldName] = valorCampo;
      console.log(`Campo ${fieldName}:`, input.value, '-> Convertido para:', valorCampo);
    });

    console.log('📤 Dados preparados para envio:', dados);
    console.log('🔍 Tipos dos dados:', {
      id_empresa: typeof dados.id_empresa,
      ultima_recarga: typeof dados.ultima_recarga,
      saldo_diario: typeof dados.saldo_diario,
      recorrencia: typeof dados.recorrencia,
      orcamento: typeof dados.orcamento
    });

    const response = await fetch('/api/empresa/manuais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    console.log('Resposta da API recebida:', response);

    const data = await response.json();
    console.log('Dados da resposta da API:', data);

    if (data.success) {
      console.log('✅ Campo salvo com sucesso');
      // Indicador visual de sucesso
      inputElement.style.border = '2px solid #28a745'; // Verde - sucesso
      setTimeout(() => {
        inputElement.style.border = originalBorder;
      }, 1000);

      // Recalcular o alerta de saldo para essa linha
      setTimeout(() => {
        atualizarAlertaLinhaEmpresa(row, empresaId);
      }, 100);

      // Toast de sucesso (opcional)
      if (typeof toastUtils !== 'undefined') {
        toastUtils.showToast(`${field === 'ultima_recarga' ? 'Última Recarga' : field === 'saldo_diario' ? 'Saldo Diário' : 'Recorrência'} salvo!`, 'success');
      }
    } else {
      console.error('❌ Erro ao salvar:', data.message);
      // Indicador visual de erro
      inputElement.style.border = '2px solid #dc3545'; // Vermelho - erro
      setTimeout(() => {
        inputElement.style.border = originalBorder;
      }, 2000);

      if (typeof toastUtils !== 'undefined') {
        toastUtils.showToast(data.message || 'Erro ao salvar campo', 'error');
      } else {
        alert('Erro ao salvar: ' + (data.message || 'Erro desconhecido'));
      }
    }

  } catch (err) {
    console.error('❌ Erro na requisição:', err);
    const originalBorder = inputElement.style.border;
    inputElement.style.border = '2px solid #dc3545';
    setTimeout(() => {
      inputElement.style.border = originalBorder;
    }, 2000);

    if (typeof toastUtils !== 'undefined') {
      toastUtils.showToast('Erro ao salvar campo', 'error');
    } else {
      alert('Erro ao salvar campo');
    }
  } finally {
    console.log('🔚 Finalizando salvarCampoManualIndividual');
    inputElement.disabled = false;
  }
}

// Função para atualizar o alerta visual de uma linha específica
function atualizarAlertaLinhaEmpresa(row, empresaId) {
  try {
    // Buscar os dados da empresa nos dados em memória
    const empresa = ultimoDadosEmpresas.find(e => e.id == empresaId);
    if (!empresa) {
      console.warn('Empresa não encontrada para atualizar alerta');
      return;
    }
    
    // Buscar valores atuais dos inputs da linha
    const inputUltimaRecarga = row.querySelector('[data-field="ultima_recarga"]');
    const inputSaldoDiario = row.querySelector('[data-field="saldo_diario"]');
    const inputRecorrencia = row.querySelector('[data-field="recorrencia"]');
    const inputOrcamento = row.querySelector('[data-field="orcamento"]');
    
    const ultimaRecarga = inputUltimaRecarga?.value;
    const saldoDiario = inputSaldoDiario?.value;
    const recorrencia = inputRecorrencia?.value;
    const orcamento = inputOrcamento?.value;
    
    // Recalcular alerta
    const alertaSaldo = calcularAlertaSaldo(
      ultimaRecarga, 
      recorrencia, 
      empresa.saldo, 
      saldoDiario,
      orcamento
    );
    
    // Atualizar classe da linha e ícone
    row.classList.remove('table-danger', 'table-success', 'linha-impulsionar');
    row.removeAttribute('title');
    const tdSaldo = row.querySelector('.valor');
    if (tdSaldo) {
      // Remover ícones existentes
      const iconeCritico = tdSaldo.querySelector('.fa-exclamation-triangle');
      if (iconeCritico) iconeCritico.remove();
      const iconeImpulsionar = tdSaldo.querySelector('.fa-arrow-up');
      if (iconeImpulsionar) iconeImpulsionar.remove();
    }

    if (alertaSaldo.critico) {
      row.classList.add('table-danger');
      row.setAttribute('title', alertaSaldo.info || '');
      if (tdSaldo && alertaSaldo.info) {
        const icone = document.createElement('i');
        icone.className = 'fas fa-exclamation-triangle text-danger ms-2 info-icon-critico';
        icone.setAttribute('title', alertaSaldo.info);
        tdSaldo.appendChild(icone);
      }
    } else if (alertaSaldo.impulsionar) {
      row.classList.add('table-success', 'linha-impulsionar');
      row.setAttribute('title', alertaSaldo.info || '');
      if (tdSaldo && alertaSaldo.info) {
        const icone = document.createElement('i');
        icone.className = 'fas fa-arrow-up text-success ms-2 seta-pulsando info-icon-impulsionar';
        icone.setAttribute('title', alertaSaldo.info);
        tdSaldo.appendChild(icone);
      }
    }
    
    console.log('✅ Alerta atualizado para empresa', empresaId, '- Crítico:', alertaSaldo.critico, 'Impulsionar:' , alertaSaldo.impulsionar);
    
  } catch (err) {
    console.error('Erro ao atualizar alerta da linha:', err);
  }
}

function refreshDados(tipo = "cadastradas") {
  if (tipo === "cadastradas") {
    // O loading será mostrado dentro da função carregarEmpresasCadastradas
    carregarEmpresasCadastradas();
  } else if (tipo === "metricas") {
    // O loading será mostrado dentro da função carregarEmpresasCadastradas
    carregarEmpresasCadastradas();
  }
}

// Função para adicionar header do CRM com ações
function adicionarHeaderCRM() {
  const crmSection = document.getElementById('crmSection');
  if (crmSection) {
    const cardBody = crmSection.querySelector('.card-body');
    if (cardBody && !cardBody.querySelector('.crm-header-actions')) {
      const headerActions = document.createElement('div');
      headerActions.className = 'crm-header-actions d-flex justify-content-between align-items-center mb-3';
      headerActions.innerHTML = `
        <h5 class="mb-0">Gestão de Leads</h5>
        <div class="crm-actions">
          <button class="btn btn-outline-primary btn-sm me-2" onclick="recarregarLeads()">
            <i class="fas fa-sync-alt"></i> Atualizar
          </button>
          <input type="text" class="form-control form-control-sm d-inline-block" 
                 placeholder="Filtrar leads..." 
                 style="width: 200px;"
                 onkeyup="filtrarLeads(this.value)">
        </div>
      `;
      cardBody.insertBefore(headerActions, cardBody.firstChild);
    }
  }
}

// Função para carregar usuários cadastrados
async function carregarUsuariosCadastrados() {
  try {
    LoadingUtils.showContainer('subAbaUsuario', 'Carregando usuários cadastrados...');
    
    // Verificar se há usuário logado e suas permissões
    const usuarioResponse = await fetch('/api/session-user');
    if (usuarioResponse.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    
    const { usuario } = await usuarioResponse.json();
    if (!usuario) {
      window.location.href = '/login.html';
      return;
    }

    // Verificar se o usuário tem permissão para ver usuários
    if (usuario.permissao === 'USER') {
      document.getElementById('subAbaUsuario').innerHTML = 
        "<p style='color:orange'>Você não tem permissão para visualizar usuários.</p>";
      return;
    }
    
    const response = await fetch('/api/listarUsuarios', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const resultado = await response.json();
    console.log('Resposta da API listarUsuarios:', resultado);
    
    if (resultado.error) {
      throw new Error(resultado.error);
    }

    const usuarios = Array.isArray(resultado.data) ? resultado.data : [];
    renderTabelaUsuarios(usuarios);
    
  } catch (error) {
    console.error('Erro detalhado ao carregar usuários:', error);
    const errorMessage = error.message || 'Erro desconhecido';
    document.getElementById('subAbaUsuario').innerHTML = 
      "<p style='color:red'>Erro ao carregar usuários: " + errorMessage + "</p>";
  }
}

// Função para renderizar tabela de usuários
function renderTabelaUsuarios(usuarios) {
  const container = document.getElementById('subAbaUsuario');

  if (usuarios.length === 0) {
    container.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
    return;
  }

  let tabela = `
    <div class="tabela-usuarios-container">
      <table class="tabela-usuarios table table-striped">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Permissão</th>
            <th>Empresas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
  `;

  usuarios.forEach(usuario => {
    const empresasTexto = usuario.empresas && usuario.empresas.length > 0 
      ? usuario.empresas.map(emp => emp.nome).join(', ')
      : 'Nenhuma empresa';

    tabela += `
      <tr>
        <td>${usuario.nome}</td>
        <td>${usuario.email}</td>
        <td><span class="badge bg-${getPermissaoBadgeColor(usuario.permissao)}">${usuario.permissao}</span></td>
        <td>${empresasTexto}</td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editarUsuario(${usuario.id})">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-sm btn-success me-1" onclick="adicionarEmpresaUsuario(${usuario.id})">
            <i class="fas fa-building"></i> Add Empresa
          </button>
          <button class="btn btn-sm btn-danger" onclick="excluirUsuario(${usuario.id}, '${usuario.nome}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </td>
      </tr>
    `;
  });

  tabela += `</tbody></table></div>`;
  container.innerHTML = tabela;
}

// Função para obter cor do badge baseado na permissão
function getPermissaoBadgeColor(permissao) {
  switch (permissao) {
    case 'ADMIN': return 'danger';
    case 'GESTOR': return 'warning';
    case 'USER': return 'secondary';
    default: return 'light';
  }
}

// Função para editar usuário
async function editarUsuario(usuarioId) {
  console.log('🔧 editarUsuario chamada com ID:', usuarioId);
  try {
    const response = await fetch('/api/listarUsuarios');
    const resultado = await response.json();
    console.log('📊 Resultado da API:', resultado);
    
    const usuarios = resultado.data || [];
    const usuario = usuarios.find(u => u.id === usuarioId);
    
    console.log('👤 Usuário encontrado:', usuario);
    
    if (!usuario) {
      alert('Usuário não encontrado');
      return;
    }

    // Criar modal de edição
    const modalHtml = `
      <div class="modal fade" id="modalEditarUsuario" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Usuário</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formEditarUsuario">
                <div class="mb-3">
                  <label class="form-label">Nome</label>
                  <input type="text" class="form-control" id="editNome" value="${usuario.nome}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="editEmail" value="${usuario.email}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Permissão</label>
                  <select class="form-control" id="editPermissao" required>
                    <option value="USER" ${usuario.permissao === 'USER' ? 'selected' : ''}>User</option>
                    <option value="GESTOR" ${usuario.permissao === 'GESTOR' ? 'selected' : ''}>Gestor</option>
                    <option value="ADMIN" ${usuario.permissao === 'ADMIN' ? 'selected' : ''}>Admin</option>
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" onclick="salvarEdicaoUsuario(${usuarioId})">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalEditarUsuario');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    modal.show();
    
    console.log('✅ Modal de edição aberto');

  } catch (error) {
    console.error('❌ Erro ao carregar dados do usuário:', error);
    alert('Erro ao carregar dados do usuário: ' + error.message);
  }
}

// Função para salvar edição do usuário
async function salvarEdicaoUsuario(usuarioId) {
  console.log('💾 salvarEdicaoUsuario chamada com ID:', usuarioId);
  try {
    const nome = document.getElementById('editNome').value;
    const email = document.getElementById('editEmail').value;
    const permissao = document.getElementById('editPermissao').value;

    console.log('📝 Dados do formulário:', { nome, email, permissao });

    if (!nome || !email || !permissao) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    console.log('📤 Enviando requisição PUT para /api/atualizarUsuario/' + usuarioId);

    const response = await fetch(`/api/atualizarUsuario/${usuarioId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, permissao })
    });
    const modalElement = document.getElementById('modalEditarUsuario');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
    
    // Remover backdrop manualmente se necessário
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    
    console.log('🔄 Recarregando lista de usuários...');
    // Recarregar lista
    carregarUsuariosCadastrados();

  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    alert('Erro ao atualizar usuário: ' + error.message);
  }
}

// Função para excluir usuário
async function excluirUsuario(usuarioId, nomeUsuario) {
  console.log('🗑️ excluirUsuario chamada com ID:', usuarioId, 'Nome:', nomeUsuario);
  
  if (!confirm(`Tem certeza que deseja excluir o usuário "${nomeUsuario}"?`)) {
    console.log('❌ Exclusão cancelada pelo usuário');
    return;
  }

  try {
    console.log('📤 Enviando requisição DELETE para /api/removerUsuario/' + usuarioId);
    
    const response = await fetch(`/api/removerUsuario/${usuarioId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('📥 Response status:', response.status);
    const resultado = await response.json();
    console.log('📥 Resultado:', resultado);

    if (!response.ok || resultado.error) {
      alert('Erro ao excluir usuário: ' + (resultado.error || resultado.mensagem || 'Erro desconhecido'));
      return;
    }

    alert('Usuário excluído com sucesso!');
    console.log('🔄 Recarregando lista de usuários...');
    carregarUsuariosCadastrados();

  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário: ' + error.message);
  }
}

// Função para adicionar empresa ao usuário
async function adicionarEmpresaUsuario(usuarioId) {
  console.log('🏢 adicionarEmpresaUsuario chamada com ID:', usuarioId);
  try {
    // Carregar empresas disponíveis
    console.log('📤 Buscando empresas disponíveis...');
    const response = await fetch('/api/buscarEmpresas');
    const resultado = await response.json();
    console.log('📥 Empresas recebidas:', resultado);
    
    const empresas = resultado.data || [];

    if (empresas.length === 0) {
      alert('Nenhuma empresa disponível para associação');
      return;
    }

    // Criar modal para seleção de empresa
    const modalHtml = `
      <div class="modal fade" id="modalAdicionarEmpresa" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Adicionar Empresa ao Usuário</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Selecione uma empresa</label>
                <select class="form-control" id="selectEmpresa" required>
                  <option value="">Selecione uma empresa</option>
                  ${empresas.map(emp => `<option value="${emp.id}">${emp.nome}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" onclick="salvarEmpresaUsuario(${usuarioId})">Adicionar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalAdicionarEmpresa');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalAdicionarEmpresa'));
    modal.show();
    
    console.log('✅ Modal de adicionar empresa aberto');

  } catch (error) {
    console.error('❌ Erro ao carregar empresas:', error);
    alert('Erro ao carregar empresas: ' + error.message);
  }
}

// Função para salvar empresa ao usuário
async function salvarEmpresaUsuario(usuarioId) {
  console.log('💾 salvarEmpresaUsuario chamada com usuarioId:', usuarioId);
  try {
    const empresaId = document.getElementById('selectEmpresa').value;
    console.log('📝 Empresa selecionada:', empresaId);

    if (!empresaId) {
      alert('Selecione uma empresa');
      return;
    }

    console.log('📤 Enviando requisição POST para /api/adicionarEmpresaUsuario');
    console.log('📦 Dados:', { usuarioId: parseInt(usuarioId), empresaId: parseInt(empresaId) });

    const response = await fetch('/api/adicionarEmpresaUsuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: parseInt(usuarioId), empresaId: parseInt(empresaId) })
    });

    console.log('📥 Response status:', response.status);
    const resultado = await response.json();
    console.log('📥 Resultado:', resultado);

    if (!response.ok || resultado.error) {
      alert('Erro ao adicionar empresa: ' + (resultado.error || resultado.mensagem || 'Erro desconhecido'));
      return;
    }

    alert('Empresa adicionada com sucesso!');
    
    // Fechar modal
    const modalElement = document.getElementById('modalAdicionarEmpresa');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
    
    // Remover backdrop manualmente se necessário
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    
    console.log('🔄 Recarregando lista de usuários...');
    // Recarregar lista
    carregarUsuariosCadastrados();

  } catch (error) {
    console.error('❌ Erro ao adicionar empresa:', error);
    alert('Erro ao adicionar empresa: ' + error.message);
  }
}

// Função para editar empresa
async function editarEmpresa(empresaId, nomeAtual, contaAtual) {
  try {
    // Criar modal de edição
    const modalHtml = `
      <div class="modal fade" id="modalEditarEmpresa" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Empresa</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formEditarEmpresa">
                <div class="mb-3">
                  <label class="form-label">Nome da Empresa</label>
                  <input type="text" class="form-control" id="editNomeEmpresa" value="${nomeAtual}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Conta de Anúncio</label>
                  <input type="text" class="form-control" id="editContaEmpresa" value="${campoManual1Atual || ''}" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" onclick="salvarEdicaoEmpresa(${empresaId})">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalEditarEmpresa');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEditarEmpresa'));
    modal.show();

  } catch (error) {
    console.error('Erro ao carregar dados da empresa:', error);
    alert('Erro ao carregar dados da empresa');
  }
}

// Função para salvar edição da empresa
async function salvarEdicaoEmpresa(empresaId) {
  try {

    const nome = document.getElementById('editNomeEmpresa').value;
    const contaDeAnuncio = document.getElementById('editContaEmpresa').value;

    if (!nome || !contaDeAnuncio) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    const response = await fetch(`/api/atualizarEmpresa/${empresaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, contaDeAnuncio })
    });

    const resultado = await response.json();

    if (resultado.error) {
      alert('Erro ao atualizar empresa: ' + resultado.error.message);
      return;
    }

    alert('Empresa atualizada com sucesso!');
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarEmpresa'));
    modal.hide();
    
    // Recarregar lista
    carregarEmpresasCadastradas();

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    alert('Erro ao atualizar empresa');
  }
}

// Função para excluir empresa
async function excluirEmpresa(empresaId, nomeEmpresa) {
  if (!confirm(`Tem certeza que deseja excluir a empresa "${nomeEmpresa}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/excluirEmpresa/${empresaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const resultado = await response.json();

    if (resultado.error) {
      alert('Erro ao excluir empresa: ' + resultado.error.message);
      return;
    }

    alert('Empresa excluída com sucesso!');
    carregarEmpresasCadastradas();

  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    alert('Erro ao excluir empresa');
  }
}

// Função para inicializar os painéis corretamente
function inicializarPaineis() {
  // Esconder todos os painéis primeiro
  esconderTodosPaineis();
  
  // Mostrar apenas o painel Dashboard no carregamento
  if (painelMonitoramento) {
    painelMonitoramento.style.setProperty('display', 'flex');
    painelMonitoramento.dataset.theme = "ativo";
  }
  if (btnDashboard) {
    btnDashboard.style.setProperty('background-color', '#dde9f5ff');
    btnDashboard.classList.add('active');
  }
}

// Executa quando a página carrega
carregarEmpresasCadastradas();
inicializarPaineis();

});
