/**
 * OptiRank Logger - Système de logging conditionnel
 * Permet de contrôler les logs selon l'environnement
 */

class OptiRankLogger {
  constructor() {
    // Détecter l'environnement (production vs développement)
    this.isDevelopment = this.detectEnvironment();
    this.logLevel = this.isDevelopment ? 'debug' : 'error';
  }

  detectEnvironment() {
    // En extension Chrome, on peut utiliser chrome.runtime.getManifest()
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        // Si c'est une extension non packagée, c'est du développement
        return !chrome.runtime.getManifest().update_url;
      }
    } catch (e) {
      // Fallback
    }
    
    // Autres méthodes de détection
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'file:' ||
      Boolean(window.chrome && chrome.runtime && chrome.runtime.getManifest && !chrome.runtime.getManifest().update_url)
    );
  }

  // Méthodes de logging avec niveaux
  debug(message, ...args) {
    if (this.isDevelopment && this.shouldLog('debug')) {
      console.log(`[OptiRank Debug] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(`[OptiRank Info] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(`[OptiRank Warning] ${message}`, ...args);
    }
  }

  error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(`[OptiRank Error] ${message}`, ...args);
    }
  }

  // Logging avec émojis pour le développement (comme dans le code actuel)
  debugEmoji(emoji, message, ...args) {
    if (this.isDevelopment && this.shouldLog('debug')) {
      console.log(`${emoji} ${message}`, ...args);
    }
  }

  // Méthode pour vérifier si on doit logger selon le niveau
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  // Méthode pour changer le niveau de log dynamiquement
  setLogLevel(level) {
    this.logLevel = level;
  }

  // Méthode pour le logging conditionnel avec callback
  conditionalLog(condition, level, message, ...args) {
    if (condition && this.shouldLog(level)) {
      this[level](message, ...args);
    }
  }
}

// Instance globale
window.OptiRankLogger = new OptiRankLogger();

// Raccourcis pour faciliter la migration
window.logger = window.OptiRankLogger;

// Log de démarrage pour confirmer le chargement et l'environnement
console.log(`🚀 OptiRank Logger chargé - Environnement: ${window.logger.isDevelopment ? 'DÉVELOPPEMENT' : 'PRODUCTION'} - Niveau: ${window.logger.logLevel}`); 