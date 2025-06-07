/**
 * Popup Logger - Simple et Standard
 * Optimisé pour l'interface utilisateur
 */

class PopupLogger {
  constructor() {
    this.isDevelopment = this.detectEnvironment();
    this.prefix = '%c[POPUP]%c';
    this.styles = [
      'background: #10b981; color: white; padding: 1px 6px; border-radius: 3px; font-weight: bold;',
      'color: inherit;'
    ];
    
    if (this.isDevelopment) {
      console.log(this.prefix + ' Logger initialized - Development Mode', ...this.styles);
    }
  }

  detectEnvironment() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        return !manifest.update_url;
      }
    } catch (e) {
      // Fallback
    }
    
    return (
      window.location.hostname === 'localhost' ||
      window.location.protocol === 'file:' ||
      window.location.hostname.includes('127.0.0.1')
    );
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      console.log(this.prefix + ' ' + message, ...this.styles, ...args);
    }
  }

  debugEmoji(emoji, message, ...args) {
    if (this.isDevelopment) {
      console.log(this.prefix + ` ${emoji} ${message}`, ...this.styles, ...args);
    }
  }

  info(message, ...args) {
    console.info(this.prefix + ' ' + message, ...this.styles, ...args);
  }

  warn(message, ...args) {
    console.warn(this.prefix + ' ⚠️ ' + message, ...this.styles, ...args);
  }

  error(message, ...args) {
    console.error(this.prefix + ' ❌ ' + message, ...this.styles, ...args);
  }

  // Méthodes spécifiques à la popup pour l'UI
  userAction(action, ...args) {
    if (this.isDevelopment) {
      console.log(this.prefix + ` 👤 User: ${action}`, ...this.styles, ...args);
    }
  }

  apiCall(endpoint, ...args) {
    if (this.isDevelopment) {
      console.log(this.prefix + ` 🌐 API: ${endpoint}`, ...this.styles, ...args);
    }
  }

  performance(label, fn) {
    if (this.isDevelopment) {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      this.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      return result;
    }
    return fn();
  }
}

// Instance globale
window.logger = new PopupLogger(); 