/* =============================================
   SYSTÈME DE LOGGING PRODUCTION - OPTIRANK
   Logging conditionnel pour éviter la pollution console
   ============================================= */

class OptiRankLogger {
  constructor() {
    // Détection automatique de l'environnement
    this.isDevelopment = this.detectDevelopment();
    this.prefix = '[OptiRank]';
  }

  // Détection de l'environnement de développement
  detectDevelopment() {
    try {
      const isUnpacked = chrome?.runtime?.getManifest()?.update_url === undefined;
      const hasDebugFlag = localStorage.getItem('optirank-debug') === 'true';
      const isLocalHost = location.hostname === 'localhost';
      
      return isUnpacked || hasDebugFlag || isLocalHost;
    } catch (error) {
      // Par défaut, considérer comme production
      return false;
    }
  }

  // Méthodes de logging conditionnelles
  info(message, ...args) {
    if (this.isDevelopment) {
      console.log(`${this.prefix} ${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      console.debug(`${this.prefix} 🔍 ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.isDevelopment) {
      console.warn(`${this.prefix} ⚠️ ${message}`, ...args);
    }
  }

  error(message, ...args) {
    // Les erreurs sont toujours loggées
    console.error(`${this.prefix} ❌ ${message}`, ...args);
  }

  // Méthodes spécialisées pour OptiRank
  scanStarted(count) {
    this.info(`Analyse démarrée : ${count} liens à analyser`);
  }

  scanProgress(current, total, percent) {
    this.debug(`Progression : ${percent}% (${current}/${total})`);
  }

  scanCompleted(stats) {
    this.info('Analyse terminée', stats);
  }

  userAction(action, ...args) {
    this.debug(`User: ${action}`, ...args);
  }

  apiCall(endpoint, ...args) {
    this.debug(`API: ${endpoint}`, ...args);
  }

  // Méthode pour activer/désactiver le debug
  enableDebug() {
    localStorage.setItem('optirank-debug', 'true');
    this.isDevelopment = true;
    this.info('Debug mode activé');
  }

  disableDebug() {
    localStorage.removeItem('optirank-debug');
    this.isDevelopment = false;
  }
}

// Instance globale
window.OptiRankLogger = new OptiRankLogger();
window.logger = window.OptiRankLogger; 