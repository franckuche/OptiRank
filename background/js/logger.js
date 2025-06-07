/**
 * Background Service Worker Logger - Simple et Standard
 * Optimisé pour les tâches d'arrière-plan
 */

class BackgroundLogger {
  constructor() {
    this.isDevelopment = this.detectEnvironment();
    this.prefix = '%c[BACKGROUND]%c';
    this.styles = [
      'background: #f59e0b; color: white; padding: 1px 6px; border-radius: 3px; font-weight: bold;',
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
      // Dans un service worker, l'accès peut être différent
    }
    
    // Dans un service worker, pas d'accès à window.location
    return true; // Par défaut, considérer comme développement pour les logs
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

  // Méthodes spécifiques au background
  extensionEvent(event, ...args) {
    if (this.isDevelopment) {
      console.log(this.prefix + ` 🔧 Event: ${event}`, ...this.styles, ...args);
    }
  }

  messageRouting(from, to, action, ...args) {
    if (this.isDevelopment) {
      console.log(this.prefix + ` 📨 ${from} → ${to}: ${action}`, ...this.styles, ...args);
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

// Instance globale (service worker ou background page)
if (typeof globalThis !== 'undefined') {
  globalThis.logger = new BackgroundLogger();
} else if (typeof self !== 'undefined') {
  self.logger = new BackgroundLogger();
} else {
  window.logger = new BackgroundLogger();
} 