// Utilitários de Loading - Sistema de spinner azul brilhante
// Este arquivo fornece funções globais para mostrar/esconder loading em toda a aplicação

window.LoadingUtils = {
  // Mostrar loading overlay (tela cheia)
  showOverlay: function(texto = 'Carregando...') {
    this.hideOverlay(); // Remove overlay existente
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">${texto}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // Esconder loading overlay
  hideOverlay: function() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  },

  // Mostrar loading em container específico
  showContainer: function(containerId, texto = 'Carregando...') {
    const container = typeof containerId === 'string' 
      ? document.getElementById(containerId) 
      : containerId;
    
    if (container) {
      container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner-small"></div>
          <div class="loading-text">${texto}</div>
        </div>
      `;
    }
  },

  // Wrapper para fetch com loading automático
  fetchWithLoading: async function(url, options = {}, loadingType = 'overlay', container = null, texto = 'Carregando...') {
    try {
      // Mostrar loading
      if (loadingType === 'overlay') {
        this.showOverlay(texto);
      } else if (loadingType === 'container' && container) {
        this.showContainer(container, texto);
      }

      // Fazer requisição
      const response = await fetch(url, options);
      
      // Esconder loading (só overlay, container será substituído pelo conteúdo)
      if (loadingType === 'overlay') {
        this.hideOverlay();
      }
      
      return response;
    } catch (error) {
      // Esconder loading em caso de erro
      if (loadingType === 'overlay') {
        this.hideOverlay();
      } else if (loadingType === 'container' && container) {
        const containerElement = typeof container === 'string' 
          ? document.getElementById(container) 
          : container;
        if (containerElement) {
          containerElement.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar dados</p>';
        }
      }
      throw error;
    }
  },

  // Wrapper para botões com loading
  buttonLoading: function(button, isLoading = true, originalText = null) {
    if (isLoading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
      }
      button.disabled = true;
      button.innerHTML = `
        <div class="loading-spinner-small" style="display: inline-block; width: 16px; height: 16px; margin-right: 8px;"></div>
        Carregando...
      `;
    } else {
      button.disabled = false;
      button.textContent = originalText || button.dataset.originalText || 'Carregar';
      delete button.dataset.originalText;
    }
  }
};

// Função global para compatibilidade (pode ser usada diretamente)
function mostrarLoading(tipo = 'overlay', container = null, texto = 'Carregando...') {
  if (tipo === 'overlay') {
    window.LoadingUtils.showOverlay(texto);
  } else if (tipo === 'container' && container) {
    window.LoadingUtils.showContainer(container, texto);
  }
}

function esconderLoading(tipo = 'overlay') {
  if (tipo === 'overlay') {
    window.LoadingUtils.hideOverlay();
  }
}