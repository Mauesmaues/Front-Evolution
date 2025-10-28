/**
 * Gerenciador de Stages (Etapas) Personalizáveis do CRM
 * Permite criar, editar, reordenar e excluir etapas do Kanban
 */

console.log('🎨 [StageManager] Módulo carregado');

// Estado global dos stages
let stagesAtual = [];
let empresaIdAtual = null;
let editandoIndex = null;

/**
 * Abrir modal de gerenciamento de stages
 */
async function abrirModalStages() {
  console.log('🔘 [StageManager] Função abrirModalStages chamada');
  try {
    // Buscar empresa atual do usuário
    const empresaId = await obterEmpresaAtual();
    console.log('🏢 [StageManager] Empresa ID:', empresaId);
    
    if (!empresaId) {
      console.error('❌ [StageManager] Nenhuma empresa disponível');
      alert(
        '⚠️ Nenhuma empresa encontrada!\n\n' +
        'Para gerenciar etapas:\n' +
        '1. Selecione uma empresa no filtro do CRM\n' +
        '2. OU certifique-se de ter empresas cadastradas\n' +
        '3. OU verifique se seu usuário tem empresas vinculadas'
      );
      return;
    }

    empresaIdAtual = empresaId;

    // Buscar stages da empresa
    await carregarStages();

    // Abrir modal
    console.log('📂 [StageManager] Abrindo modal...');
    const modalElement = document.getElementById('modalGerenciarStages');
    if (!modalElement) {
      console.error('❌ [StageManager] Modal não encontrado no DOM');
      alert('Erro: Modal não encontrado. Verifique o console.');
      return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    console.log('✅ [StageManager] Modal aberto');

  } catch (error) {
    console.error('❌ [StageManager] Erro ao abrir modal de stages:', error);
    console.error('❌ [StageManager] Stack trace:', error.stack);
    alert(`Erro ao abrir modal: ${error.message}\n\nVerifique o console para mais detalhes.`);
    mostrarNotificacaoStage('Erro ao carregar configurações de etapas', 'error');
  }
}

/**
 * Carregar stages da empresa
 */
async function carregarStages() {
  try {
    showLoadingModalStage('Carregando etapas...');

    const response = await fetch(`/api/stages/${empresaIdAtual}`);
    const resultado = await response.json();

    hideLoadingModalStage();

    if (!response.ok || !resultado.success) {
      throw new Error(resultado.message || 'Erro ao carregar stages');
    }

    stagesAtual = resultado.data.estagios || [];
    
    // Exibir aviso se estiver usando stages padrão
    if (resultado.data.is_padrao) {
      document.getElementById('avisoStagesPadrao').style.display = 'block';
    } else {
      document.getElementById('avisoStagesPadrao').style.display = 'none';
    }

    renderizarListaStages();

  } catch (error) {
    hideLoadingModalStage();
    console.error('Erro ao carregar stages:', error);
    mostrarNotificacaoStage('Erro ao carregar etapas: ' + error.message, 'error');
  }
}

/**
 * Renderizar lista de stages no modal
 */
function renderizarListaStages() {
  const container = document.getElementById('listaStagesContainer');
  
  if (stagesAtual.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle"></i> Nenhuma etapa configurada. Adicione sua primeira etapa abaixo.
      </div>
    `;
    return;
  }

  // Ordenar por ordem
  stagesAtual.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  container.innerHTML = stagesAtual.map((stage, index) => `
    <div class="stage-item" data-index="${index}" draggable="true">
      <div class="stage-drag-handle">
        <i class="bi bi-grip-vertical"></i>
      </div>
      <div class="stage-color-preview" style="background-color: ${stage.cor}"></div>
      <div class="stage-info">
        <strong>${stage.nome}</strong>
        <small class="text-muted">ID: ${stage.id}</small>
      </div>
      <div class="stage-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="editarStage(${index})" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirStage(${index})" title="Excluir">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Adicionar eventos de drag & drop para reordenar
  adicionarEventosDragDrop();
}

/**
 * Adicionar novo stage
 */
function adicionarNovoStage() {
  editandoIndex = null;
  
  // Limpar formulário
  document.getElementById('stageNome').value = '';
  document.getElementById('stageCor').value = '#2196F3';
  document.getElementById('stageId').value = gerarIdStage();

  // Mudar título do formulário
  document.getElementById('tituloFormStage').textContent = 'Adicionar Nova Etapa';
  document.getElementById('btnSalvarStage').textContent = 'Adicionar';

  // Mostrar formulário
  document.getElementById('formStageContainer').style.display = 'block';
  document.getElementById('stageNome').focus();
}

/**
 * Editar stage existente
 */
function editarStage(index) {
  editandoIndex = index;
  const stage = stagesAtual[index];

  // Preencher formulário
  document.getElementById('stageNome').value = stage.nome;
  document.getElementById('stageCor').value = stage.cor;
  document.getElementById('stageId').value = stage.id;

  // Mudar título do formulário
  document.getElementById('tituloFormStage').textContent = 'Editar Etapa';
  document.getElementById('btnSalvarStage').textContent = 'Salvar';

  // Mostrar formulário
  document.getElementById('formStageContainer').style.display = 'block';
  document.getElementById('stageNome').focus();
}

/**
 * Salvar stage (adicionar ou editar)
 */
function salvarStage() {
  const nome = document.getElementById('stageNome').value.trim();
  const cor = document.getElementById('stageCor').value;
  const id = document.getElementById('stageId').value.trim();

  // Validação
  if (!nome) {
    mostrarNotificacaoStage('Por favor, informe o nome da etapa', 'warning');
    return;
  }

  if (!id) {
    mostrarNotificacaoStage('Por favor, informe o ID da etapa', 'warning');
    return;
  }

  // Verificar ID duplicado (exceto se estiver editando)
  const idDuplicado = stagesAtual.some((stage, idx) => 
    stage.id === id && idx !== editandoIndex
  );

  if (idDuplicado) {
    mostrarNotificacaoStage('Já existe uma etapa com este ID', 'warning');
    return;
  }

  const stageData = {
    id: id,
    nome: nome,
    cor: cor,
    ordem: editandoIndex !== null ? stagesAtual[editandoIndex].ordem : stagesAtual.length + 1
  };

  if (editandoIndex !== null) {
    // Editar existente
    stagesAtual[editandoIndex] = stageData;
    mostrarNotificacaoStage('Etapa atualizada!', 'success');
  } else {
    // Adicionar novo
    stagesAtual.push(stageData);
    mostrarNotificacaoStage('Etapa adicionada!', 'success');
  }

  // Limpar e esconder formulário
  cancelarEdicaoStage();

  // Re-renderizar lista
  renderizarListaStages();
}

/**
 * Cancelar edição de stage
 */
function cancelarEdicaoStage() {
  editandoIndex = null;
  document.getElementById('formStageContainer').style.display = 'none';
  document.getElementById('stageNome').value = '';
  document.getElementById('stageCor').value = '#2196F3';
}

/**
 * Excluir stage
 */
function excluirStage(index) {
  const stage = stagesAtual[index];
  
  if (!confirm(`Tem certeza que deseja excluir a etapa "${stage.nome}"?\n\nATENÇÃO: Leads nesta etapa não serão excluídos, mas você precisará movê-los para outra etapa.`)) {
    return;
  }

  stagesAtual.splice(index, 1);
  
  // Reordenar
  stagesAtual.forEach((stage, idx) => {
    stage.ordem = idx + 1;
  });

  mostrarNotificacaoStage('Etapa excluída', 'info');
  renderizarListaStages();
}

/**
 * Salvar stages no backend
 */
async function salvarStagesNoBackend() {
  try {
    if (stagesAtual.length === 0) {
      mostrarNotificacaoStage('Adicione pelo menos uma etapa', 'warning');
      return;
    }

    showLoadingModalStage('Salvando configurações...');

    const response = await fetch(`/api/stages/${empresaIdAtual}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estagios: stagesAtual
      })
    });

    const resultado = await response.json();

    hideLoadingModalStage();

    if (!response.ok || !resultado.success) {
      throw new Error(resultado.message || 'Erro ao salvar stages');
    }

    mostrarNotificacaoStage('Etapas salvas com sucesso! Recarregando CRM...', 'success');

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalGerenciarStages'));
    modal.hide();

    // Recarregar CRM para aplicar novos stages
    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (error) {
    hideLoadingModalStage();
    console.error('Erro ao salvar stages:', error);
    mostrarNotificacaoStage('Erro ao salvar etapas: ' + error.message, 'error');
  }
}

/**
 * Resetar stages para o padrão
 */
async function resetarStagesPadrao() {
  if (!confirm('Tem certeza que deseja resetar as etapas para o padrão?\n\nIsso irá remover todas as etapas personalizadas.')) {
    return;
  }

  try {
    showLoadingModalStage('Resetando etapas...');

    const response = await fetch(`/api/stages/${empresaIdAtual}`, {
      method: 'DELETE'
    });

    const resultado = await response.json();

    hideLoadingModalStage();

    if (!response.ok || !resultado.success) {
      throw new Error(resultado.message || 'Erro ao resetar stages');
    }

    mostrarNotificacaoStage('Etapas resetadas para o padrão! Recarregando CRM...', 'success');

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalGerenciarStages'));
    modal.hide();

    // Recarregar CRM
    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (error) {
    hideLoadingModalStage();
    console.error('Erro ao resetar stages:', error);
    mostrarNotificacaoStage('Erro ao resetar etapas: ' + error.message, 'error');
  }
}

/**
 * Adicionar eventos de drag & drop para reordenar stages
 */
function adicionarEventosDragDrop() {
  const items = document.querySelectorAll('.stage-item');
  let draggedElement = null;

  items.forEach(item => {
    item.addEventListener('dragstart', function(e) {
      draggedElement = this;
      this.style.opacity = '0.5';
    });

    item.addEventListener('dragend', function(e) {
      this.style.opacity = '1';
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      return false;
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      
      if (draggedElement !== this) {
        const fromIndex = parseInt(draggedElement.dataset.index);
        const toIndex = parseInt(this.dataset.index);

        // Reordenar array
        const [movedItem] = stagesAtual.splice(fromIndex, 1);
        stagesAtual.splice(toIndex, 0, movedItem);

        // Atualizar ordens
        stagesAtual.forEach((stage, idx) => {
          stage.ordem = idx + 1;
        });

        // Re-renderizar
        renderizarListaStages();
        mostrarNotificacaoStage('Ordem atualizada', 'info');
      }

      return false;
    });
  });
}

/**
 * Gerar ID único para stage
 */
function gerarIdStage() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `stage_${timestamp}_${random}`;
}

/**
 * Obter empresa atual do usuário
 */
async function obterEmpresaAtual() {
  try {
    // ⭐ 1. PRIORIDADE: Buscar do select de filtro do CRM
    const filtroEmpresa = document.getElementById('filtroEmpresaCRM');
    if (filtroEmpresa && filtroEmpresa.value) {
      console.log('✅ [StageManager] Empresa do select CRM:', filtroEmpresa.value);
      return filtroEmpresa.value;
    }

    // ⭐ 2. Verificar se há empresa selecionada no localStorage
    const empresaSelecionada = localStorage.getItem('empresaSelecionada');
    if (empresaSelecionada) {
      try {
        const empresa = JSON.parse(empresaSelecionada);
        console.log('✅ [StageManager] Empresa do localStorage:', empresa.id);
        return empresa.id;
      } catch (e) {
        console.warn('⚠️ [StageManager] Erro ao parsear localStorage:', e);
      }
    }

    // ⭐ 3. Se não houver, buscar primeira empresa do usuário
    const response = await fetch('/api/session-user');
    const resultado = await response.json();

    if (resultado.success && resultado.data?.empresas?.length > 0) {
      const empresaId = resultado.data.empresas[0].empresa_id;
      console.log('✅ [StageManager] Primeira empresa do usuário:', empresaId);
      return empresaId;
    }

    // ⭐ 4. Última tentativa: pegar todas as empresas
    const respEmpresas = await fetch('/api/buscarEmpresas');
    const empresas = await respEmpresas.json();
    
    if (empresas.success && empresas.data?.length > 0) {
      const empresaId = empresas.data[0].id;
      console.log('✅ [StageManager] Primeira empresa disponível:', empresaId);
      return empresaId;
    }

    throw new Error('Nenhuma empresa encontrada');

  } catch (error) {
    console.error('❌ [StageManager] Erro ao obter empresa:', error);
    return null;
  }
}

/**
 * Mostrar notificação (toast)
 */
function mostrarNotificacaoStage(mensagem, tipo = 'info') {
  // Se existir a função global do sistema E for diferente desta
  if (typeof window.mostrarNotificacao === 'function' && 
      window.mostrarNotificacao !== mostrarNotificacaoStage) {
    window.mostrarNotificacao(mensagem, tipo); // ✅ Chama a função global do sistema
    return;
  }

  // Fallback: alert simples
  console.log(`📢 [StageManager] ${tipo.toUpperCase()}: ${mensagem}`);
  alert(mensagem);
}

/**
 * Mostrar loading modal (usa função global se existir)
 */
function showLoadingModalStage(texto = 'Carregando...') {
  // Verifica se existe função global do sistema principal
  if (typeof window.showLoadingModal === 'function' && window.showLoadingModal !== showLoadingModalStage) {
    window.showLoadingModal(texto);
  } else {
    // Fallback: Mostrar no console
    console.log('⏳ [StageManager]', texto);
  }
}

/**
 * Esconder loading modal (usa função global se existir)
 */
function hideLoadingModalStage() {
  // Verifica se existe função global do sistema principal
  if (typeof window.hideLoadingModal === 'function' && window.hideLoadingModal !== hideLoadingModalStage) {
    window.hideLoadingModal();
  } else {
    // Fallback: Mostrar no console
    console.log('✅ [StageManager] Loading concluído');
  }
}

// Expor funções globalmente
window.abrirModalStages = abrirModalStages;
window.adicionarNovoStage = adicionarNovoStage;
window.editarStage = editarStage;
window.salvarStage = salvarStage;
window.cancelarEdicaoStage = cancelarEdicaoStage;
window.excluirStage = excluirStage;
window.salvarStagesNoBackend = salvarStagesNoBackend;
window.resetarStagesPadrao = resetarStagesPadrao;

console.log('✅ [StageManager] Funções expostas globalmente:', {
  abrirModalStages: typeof window.abrirModalStages,
  adicionarNovoStage: typeof window.adicionarNovoStage,
  salvarStage: typeof window.salvarStage
});

// Verificar se Bootstrap está disponível
if (typeof bootstrap === 'undefined') {
  console.error('❌ [StageManager] Bootstrap não está carregado!');
} else {
  console.log('✅ [StageManager] Bootstrap disponível:', bootstrap.Modal);
}

// Teste: Adicionar evento ao botão quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  const btnGerenciar = document.getElementById('btnGerenciarStages');
  if (btnGerenciar) {
    console.log('✅ [StageManager] Botão "Gerenciar Etapas" encontrado no DOM');
    
    // Adicionar listener alternativo (backup)
    btnGerenciar.addEventListener('click', function(e) {
      console.log('🖱️ [StageManager] Botão clicado via addEventListener');
    });
  } else {
    console.warn('⚠️ [StageManager] Botão "Gerenciar Etapas" NÃO encontrado no DOMContentLoaded');
  }
});

