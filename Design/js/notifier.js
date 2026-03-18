/**
 * Global Notification System
 * Displays user-friendly popup messages matching the application design system
 */

class Notifier {
    constructor() {
        this.initialized = false;
        // Defer initialization until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        // Inject CSS styles
        if (!document.getElementById('notifier-styles')) {
            const style = document.createElement('style');
            style.id = 'notifier-styles';
            style.textContent = `
                .notification {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    animation: slideInRight 0.3s ease-out;
                    pointer-events: all;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(4px);
                }

                .notification:hover {
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    transform: translateX(-2px);
                }

                .notification.removing {
                    animation: slideOutRight 0.3s ease-in forwards;
                }

                .notification-icon {
                    flex-shrink: 0;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                }

                .notification-content {
                    flex: 1;
                    line-height: 1.4;
                }

                .notification-close {
                    flex-shrink: 0;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .notification-close:hover {
                    opacity: 1;
                }

                /* Success Style */
                .notification.success {
                    background-color: #D1FAE5;
                    color: #065F46;
                    border: 1px solid #A7F3D0;
                }

                .notification.success .notification-icon {
                    color: #10B981;
                }

                /* Error Style */
                .notification.error {
                    background-color: #FEE2E2;
                    color: #7F1D1D;
                    border: 1px solid #FECACA;
                }

                .notification.error .notification-icon {
                    color: #EF4444;
                }

                /* Warning Style */
                .notification.warning {
                    background-color: #FEF3C7;
                    color: #78350F;
                    border: 1px solid #FDE68A;
                }

                .notification.warning .notification-icon {
                    color: #F59E0B;
                }

                /* Info Style */
                .notification.info {
                    background-color: #E3F1FB;
                    color: #1E3A8A;
                    border: 1px solid #BFDBFE;
                }

                .notification.info .notification-icon {
                    color: #007ACC;
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }

                /* Mobile responsiveness */
                @media (max-width: 640px) {
                    #notification-container {
                        top: 12px;
                        right: 12px;
                        left: 12px;
                        max-width: none;
                    }

                    .notification {
                        font-size: 13px;
                        padding: 12px 14px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show a success notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms before auto-dismiss (0 = no auto-dismiss)
     */
    success(message, duration = 5000) {
        return this.show(message, 'success', '✓', duration);
    }

    /**
     * Show an error notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms before auto-dismiss (0 = no auto-dismiss)
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', '✕', duration);
    }

    /**
     * Show a warning notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms before auto-dismiss (0 = no auto-dismiss)
     */
    warning(message, duration = 5000) {
        return this.show(message, 'warning', '⚠', duration);
    }

    /**
     * Show an info notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms before auto-dismiss (0 = no auto-dismiss)
     */
    info(message, duration = 5000) {
        return this.show(message, 'info', 'ℹ', duration);
    }

    /**
     * Show a notification
     * @private
     */
    show(message, type = 'info', icon = 'ℹ', duration = 5000) {
        // Ensure initialization before showing notification
        if (!this.initialized) {
            this.init();
        }

        const container = document.getElementById('notification-container');
        if (!container) {
            // If container doesn't exist, create it directly
            const newContainer = document.createElement('div');
            newContainer.id = 'notification-container';
            newContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(newContainer);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${this.escapeHtml(message)}</div>
            <button class="notification-close" title="Dismiss">×</button>
        `;

        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification);
        });

        // Click to dismiss
        notification.addEventListener('click', () => {
            this.remove(notification);
        });

        const container2 = document.getElementById('notification-container');
        container2.appendChild(notification);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * Remove a notification with animation
     * @private
     */
    remove(notification) {
        if (!notification.parentElement) return;

        notification.classList.add('removing');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.querySelectorAll('.notification').forEach(notif => {
                this.remove(notif);
            });
        }
    }
}

// Create global instance
const notify = new Notifier();
