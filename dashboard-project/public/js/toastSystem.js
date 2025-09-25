/**
 * Sistema de Notificações Toast Moderno
 * Uso: showToast('success', 'Título', 'Mensagem')
 */

class ToastSystem {
    constructor() {
        this.container = this.createContainer();
        this.toasts = new Map();
    }

    createContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(type = 'info', title = '', message = '', duration = 5000) {
        const toastId = Date.now() + Math.random();
        const toast = this.createToast(type, title, message, toastId);
        
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        // Auto remove após duração especificada
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toastId);
            }, duration);
        }

        return toastId;
    }

    createToast(type, title, message, id) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.id = id;

        const iconMap = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" onclick="toastSystem.remove(${id})">
                <i class="fas fa-times"></i>
            </button>
        `;

        return toast;
    }

    remove(toastId) {
        const toast = this.toasts.get(toastId);
        if (toast) {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts.delete(toastId);
            }, 300); // Tempo da animação de saída
        }
    }

    // Métodos de conveniência
    success(title, message, duration) {
        return this.show('success', title, message, duration);
    }

    error(title, message, duration) {
        return this.show('error', title, message, duration);
    }

    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    }

    info(title, message, duration) {
        return this.show('info', title, message, duration);
    }

    // Limpar todos os toasts
    clear() {
        this.toasts.forEach((toast, id) => {
            this.remove(id);
        });
    }
}

// Instância global
const toastSystem = new ToastSystem();

// Funções globais de conveniência
function showToast(type, title, message, duration) {
    return toastSystem.show(type, title, message, duration);
}

function showSuccess(title, message, duration) {
    return toastSystem.success(title, message, duration);
}

function showError(title, message, duration) {
    return toastSystem.error(title, message, duration);
}

function showWarning(title, message, duration) {
    return toastSystem.warning(title, message, duration);
}

function showInfo(title, message, duration) {
    return toastSystem.info(title, message, duration);
}