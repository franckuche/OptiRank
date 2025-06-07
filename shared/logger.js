/**
 * OptiRank Logging System
 * Architecture "Progressive Disclosure" avec messages SEO-friendly
 */

class OptiRankLogger {
  constructor() {
    this.environment = this.detectEnvironment();
    this.userPreferences = null;
    this.errorQueue = [];
    this.logQueue = [];
    this.logsPerSecond = 0;
    this.maxLogsPerSecond = 50;
    
    this.initializeLogger();
  }

  /**
   * Détection automatique de l'environnement
   */
  detectEnvironment() {
    try {
      const manifest = chrome.runtime.getManifest();
      const isProduction = manifest.update_url !== undefined;
      const isDevelopment = !isProduction;
      
      return {
        isProduction,
        isDevelopment,
        version: manifest.version,
        name: manifest.name
      };
    } catch (error) {
      return { isProduction: true, isDevelopment: false, version: 'unknown', name: 'OptiRank' };
    }
  }

  /**
   * Initialisation du logger avec préférences utilisateur
   */
  async initializeLogger() {
    try {
      // Charger les préférences utilisateur
      const result = await chrome.storage.sync.get([
        'enableDiagnosticLogs',
        'autoExportErrors',
        'hasConsentedToLogging'
      ]);
      
      this.userPreferences = {
        diagnosticEnabled: result.enableDiagnosticLogs || false,
        autoExport: result.autoExportErrors || false,
        hasConsented: result.hasConsentedToLogging || false
      };

      // Demander consentement si pas encore fait
      if (!this.userPreferences.hasConsented && this.environment.isProduction) {
        this.requestLoggingConsent();
      }
      
      // Démarrer le cleanup automatique
      this.startCleanupTimer();
      
    } catch (error) {
      // Fallback silencieux
      this.userPreferences = {
        diagnosticEnabled: false,
        autoExport: false,
        hasConsented: false
      };
    }
  }

  /**
   * Demander consentement pour le logging
   */
  async requestLoggingConsent() {
    // Note: À implémenter dans l'UI plus tard
    // Pour l'instant, assumer consentement en développement
    if (this.environment.isDevelopment) {
      this.userPreferences.hasConsented = true;
      await chrome.storage.sync.set({ hasConsentedToLogging: true });
    }
  }

  /**
   * Détermine si on doit logger selon les règles
   */
  shouldLog(level) {
    // Mode Production : Erreurs seulement
    if (this.environment.isProduction) {
      if (level === 'ERROR' || level === 'CRITICAL') return true;
      if (level === 'INFO' && this.userPreferences.diagnosticEnabled) return true;
      return false;
    }
    
    // Mode Développement : Tout
    if (this.environment.isDevelopment) {
      return true;
    }
    
    return false;
  }

  /**
   * Log principal avec messages SEO-friendly
   */
  log(level, businessMessage, technicalDetails = {}) {
    if (!this.shouldLog(level)) return;
    
    // Throttling pour performance
    if (this.shouldThrottle()) {
      this.queueLog(level, businessMessage, technicalDetails);
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: businessMessage,
      context: this.anonymizeContext(technicalDetails),
      environment: this.environment.isProduction ? 'production' : 'development',
      version: this.environment.version
    };

    // Afficher dans console selon l'environnement
    this.writeToConsole(logEntry);
    
    // Stocker pour export si nécessaire
    if (level === 'ERROR' || level === 'CRITICAL') {
      this.errorQueue.push(logEntry);
      this.checkAutoExport();
    }
    
    this.trackLogRate();
  }

  /**
   * Messages SEO-friendly pré-définis
   */
  info(businessMessage, technicalDetails = {}) {
    this.log('INFO', businessMessage, technicalDetails);
  }

  warn(businessMessage, technicalDetails = {}) {
    this.log('WARN', businessMessage, technicalDetails);
  }

  error(businessMessage, technicalDetails = {}) {
    this.log('ERROR', businessMessage, technicalDetails);
  }

  critical(businessMessage, technicalDetails = {}) {
    this.log('CRITICAL', businessMessage, technicalDetails);
  }

  /**
   * Messages SEO pré-formatés pour OptiRank
   */
  scanStarted(linkCount) {
    this.info(`Analyse démarrée : ${linkCount} liens à vérifier`, { linkCount });
  }

  scanProgress(current, total, percent) {
    this.info(`Scan en cours... ${percent}% terminé (${current}/${total})`, { current, total, percent });
  }

  scanCompleted(stats) {
    const { totalLinks, brokenLinks, redirects, duration } = stats;
    this.info(
      `Analyse terminée : ${totalLinks} liens analysés, ${brokenLinks} liens brisés détectés${redirects > 0 ? `, ${redirects} redirections` : ''} (${duration})`,
      stats
    );
  }

  linkValidationFailed(url, status) {
    this.warn(`Lien inaccessible détecté : ${this.anonymizeUrl(url)} (${status})`, { status, anonymizedUrl: this.anonymizeUrl(url) });
  }

  performanceWarning(message, metrics) {
    this.warn(`Performance : ${message}`, metrics);
  }

  criticalError(userMessage, technicalError) {
    this.critical(userMessage, { error: technicalError.message, stack: technicalError.stack });
  }

  /**
   * Anonymisation des données sensibles
   */
  anonymizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}/[path]`;
    } catch {
      return '[invalid-url]';
    }
  }

  anonymizeContext(context) {
    const anonymized = { ...context };
    
    // Supprimer données sensibles
    delete anonymized.cookies;
    delete anonymized.userAgent;
    delete anonymized.localStorage;
    delete anonymized.sessionStorage;
    
    // Anonymiser URLs
    if (anonymized.url) {
      anonymized.url = this.anonymizeUrl(anonymized.url);
    }
    
    if (anonymized.urls) {
      anonymized.urls = anonymized.urls.map(url => this.anonymizeUrl(url));
    }

    return anonymized;
  }

  /**
   * Écriture dans console avec styling
   */
  writeToConsole(logEntry) {
    const styles = {
      INFO: 'color: #2196F3; font-weight: bold',
      WARN: 'color: #FF9800; font-weight: bold',
      ERROR: 'color: #F44336; font-weight: bold',
      CRITICAL: 'color: #FF1744; font-weight: bold; background: #ffebee'
    };

    const prefix = this.environment.isDevelopment ? '[DEV] ' : '[OptiRank] ';
    const style = styles[logEntry.level] || 'color: #333';
    
    console.log(
      `%c${prefix}${logEntry.message}`,
      style,
      logEntry.context
    );
  }

  /**
   * Throttling pour éviter spam
   */
  shouldThrottle() {
    return this.logsPerSecond > this.maxLogsPerSecond;
  }

  queueLog(level, message, details) {
    this.logQueue.push({ level, message, details, timestamp: Date.now() });
    
    // Traiter la queue avec délai
    setTimeout(() => this.processLogQueue(), 1000);
  }

  processLogQueue() {
    if (this.logQueue.length === 0) return;
    
    const queuedLog = this.logQueue.shift();
    this.log(queuedLog.level, queuedLog.message, queuedLog.details);
  }

  trackLogRate() {
    this.logsPerSecond++;
    setTimeout(() => this.logsPerSecond--, 1000);
  }

  /**
   * Export automatique des erreurs
   */
  checkAutoExport() {
    if (!this.userPreferences.autoExport) return;
    
    // Exporter si 5+ erreurs en queue
    if (this.errorQueue.length >= 5) {
      this.exportErrorReport();
    }
  }

  async exportErrorReport() {
    const report = {
      extension: this.environment.name,
      version: this.environment.version,
      timestamp: new Date().toISOString(),
      environment: this.environment.isProduction ? 'production' : 'development',
      errors: this.errorQueue.slice(),
      stats: {
        totalErrors: this.errorQueue.length,
        timeRange: this.getErrorTimeRange()
      }
    };

    try {
      // Stocker localement (chiffré plus tard)
      await chrome.storage.local.set({
        [`error_report_${Date.now()}`]: report
      });
      
      // Vider la queue
      this.errorQueue = [];
      
      this.info('Rapport d\'erreurs sauvegardé automatiquement', { reportId: report.timestamp });
      
    } catch (error) {
      console.error('Impossible de sauvegarder le rapport d\'erreurs:', error);
    }
  }

  getErrorTimeRange() {
    if (this.errorQueue.length === 0) return null;
    
    const timestamps = this.errorQueue.map(e => new Date(e.timestamp).getTime());
    return {
      from: new Date(Math.min(...timestamps)).toISOString(),
      to: new Date(Math.max(...timestamps)).toISOString()
    };
  }

  /**
   * Cleanup automatique
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000); // Toutes les heures
  }

  async cleanupOldLogs() {
    const maxAge = 24 * 60 * 60 * 1000; // 24h
    const now = Date.now();
    
    try {
      const storage = await chrome.storage.local.get();
      const keysToRemove = [];
      
      Object.keys(storage).forEach(key => {
        if (key.startsWith('error_report_')) {
          const timestamp = parseInt(key.replace('error_report_', ''));
          if (now - timestamp > maxAge) {
            keysToRemove.push(key);
          }
        }
      });
      
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        this.info(`Nettoyage automatique : ${keysToRemove.length} anciens rapports supprimés`);
      }
      
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  }

  /**
   * API publique pour export manuel
   */
  async exportCurrentLogs() {
    await this.exportErrorReport();
  }

  async clearAllLogs() {
    this.errorQueue = [];
    this.logQueue = [];
    
    try {
      const storage = await chrome.storage.local.get();
      const errorReportKeys = Object.keys(storage).filter(key => key.startsWith('error_report_'));
      
      if (errorReportKeys.length > 0) {
        await chrome.storage.local.remove(errorReportKeys);
      }
      
      this.info('Tous les logs ont été supprimés');
    } catch (error) {
      this.error('Impossible de supprimer les logs', { error: error.message });
    }
  }
}

// Instance globale
window.OptiRankLogger = window.OptiRankLogger || new OptiRankLogger();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptiRankLogger;
} 