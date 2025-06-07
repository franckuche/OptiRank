/**
 * OptiRank Settings Manager
 * Interface utilisateur pour contrôler le logging et l'export d'erreurs
 */

class OptiRankSettings {
  constructor() {
    this.logger = window.OptiRankLogger;
    this.eventManager = window.OptiRankEventManager;
    this.settings = {
      enableDiagnosticLogs: false,
      autoExportErrors: false,
      hasConsentedToLogging: false
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.createSettingsUI();
    this.bindEvents();
    
    this.logger.info('Interface des paramètres OptiRank initialisée');
  }

  /**
   * Charger les paramètres depuis le storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'enableDiagnosticLogs',
        'autoExportErrors', 
        'hasConsentedToLogging'
      ]);

      this.settings = {
        enableDiagnosticLogs: result.enableDiagnosticLogs || false,
        autoExportErrors: result.autoExportErrors || false,
        hasConsentedToLogging: result.hasConsentedToLogging || false
      };

    } catch (error) {
      this.logger.error('Impossible de charger les paramètres', { error: error.message });
    }
  }

  /**
   * Sauvegarder les paramètres
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
      this.logger.info('Paramètres sauvegardés avec succès');
      
      // Notification visuelle
      this.showSaveNotification();
      
    } catch (error) {
      this.logger.error('Impossible de sauvegarder les paramètres', { error: error.message });
    }
  }

  /**
   * Initialiser l'interface utilisateur des settings dans la page Settings existante
   */
  createSettingsUI() {
    // L'interface est déjà dans popup.html, on initialise juste les valeurs
    this.updateSettingsFromStorage();
    this.updateStats();
  }

  /**
   * Mettre à jour l'interface avec les valeurs stockées
   */
  updateSettingsFromStorage() {
    const diagnosticCheckbox = document.getElementById('enable-diagnostic-logs');
    const autoExportCheckbox = document.getElementById('auto-export-errors');
    
    if (diagnosticCheckbox) {
      diagnosticCheckbox.checked = this.settings.enableDiagnosticLogs;
    }
    
    if (autoExportCheckbox) {
      autoExportCheckbox.checked = this.settings.autoExportErrors;
    }
  }

  /**
   * HTML de l'interface settings
   */
  getSettingsHTML() {
    return `
      <div class="settings-section">
        <h3 class="settings-title">
          ⚙️ Paramètres Avancés
        </h3>
        
        <div class="setting-item">
          <div class="setting-header">
            <label class="setting-label">
              <input type="checkbox" id="enable-diagnostic" ${this.settings.enableDiagnosticLogs ? 'checked' : ''}>
              <span class="checkmark"></span>
              Activer les logs de diagnostic
            </label>
          </div>
          <div class="setting-description">
            <span class="info-icon">ℹ️</span>
            Fournit des informations détaillées pour aider à résoudre les problèmes de scan.
            Peut impacter les performances sur les gros sites web.
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-header">
            <label class="setting-label">
              <input type="checkbox" id="auto-export-errors" ${this.settings.autoExportErrors ? 'checked' : ''}>
              <span class="checkmark"></span>
              Export automatique des rapports d'erreurs
            </label>
          </div>
          <div class="setting-description">
            <span class="info-icon">ℹ️</span>
            Sauvegarde automatiquement les logs d'erreurs pour le support technique.
            Aucune donnée personnelle n'est collectée.
          </div>
        </div>

        <div class="setting-actions">
          <button id="export-logs-btn" class="btn btn-secondary">
            📤 Exporter les Logs Actuels
          </button>
          <button id="clear-logs-btn" class="btn btn-secondary">
            🗑️ Effacer Tous les Logs
          </button>
        </div>

        <div class="setting-stats">
          <div class="stats-header">📊 Statistiques</div>
          <div id="stats-content" class="stats-content">
            Chargement des statistiques...
          </div>
        </div>

        <div id="save-notification" class="save-notification" style="display: none;">
          ✅ Paramètres sauvegardés !
        </div>
      </div>

      <style>
        .optirank-settings-panel {
          margin-top: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .settings-title {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }

        .setting-item {
          margin-bottom: 20px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .setting-header {
          margin-bottom: 8px;
        }

        .setting-label {
          display: flex;
          align-items: center;
          font-weight: 500;
          color: #333;
          cursor: pointer;
        }

        .setting-label input[type="checkbox"] {
          margin-right: 10px;
          transform: scale(1.2);
          cursor: pointer;
        }

        .setting-description {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
          display: flex;
          align-items: flex-start;
        }

        .info-icon {
          margin-right: 6px;
          opacity: 0.7;
        }

        .setting-actions {
          display: flex;
          gap: 10px;
          margin: 20px 0;
        }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        .setting-stats {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          margin-top: 15px;
        }

        .stats-header {
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .stats-content {
          font-size: 12px;
          color: #666;
        }

        .save-notification {
          position: fixed;
          top: 10px;
          right: 10px;
          background: #28a745;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .stats-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .stats-label {
          color: #333;
        }

        .stats-value {
          font-weight: 600;
          color: #007bff;
        }
      </style>
    `;
  }

  /**
   * Bind les événements de l'interface
   */
  bindEvents() {
    // Toggle diagnostic logs
    const diagnosticCheckbox = document.getElementById('enable-diagnostic-logs');
    if (diagnosticCheckbox) {
      this.eventManager.onChange(diagnosticCheckbox, (e) => {
        this.settings.enableDiagnosticLogs = e.target.checked;
        this.saveSettings();
        
        if (e.target.checked) {
          this.logger.info('Logs de diagnostic activés - Informations détaillées disponibles');
          this.showPerformanceWarning();
        } else {
          this.logger.info('Logs de diagnostic désactivés - Mode silencieux activé');
        }
      });
    }

    // Toggle auto export
    const autoExportCheckbox = document.getElementById('auto-export-errors');
    if (autoExportCheckbox) {
      this.eventManager.onChange(autoExportCheckbox, (e) => {
        this.settings.autoExportErrors = e.target.checked;
        this.saveSettings();
        
        if (e.target.checked) {
          this.logger.info('Export automatique activé - Les erreurs seront sauvegardées automatiquement');
        } else {
          this.logger.info('Export automatique désactivé');
        }
      });
    }

    // Export logs button
    const exportBtn = document.getElementById('export-logs-btn');
    if (exportBtn) {
      this.eventManager.onClick(exportBtn, async () => {
        await this.exportLogs();
      });
    }

    // Clear logs button
    const clearBtn = document.getElementById('clear-logs-btn');
    if (clearBtn) {
      this.eventManager.onClick(clearBtn, async () => {
        if (confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
          await this.clearLogs();
        }
      });
    }

    // Mettre à jour les stats toutes les 5 secondes
    this.eventManager.setInterval(() => {
      this.updateStats();
    }, 5000, 'stats-update');
  }

  /**
   * Afficher warning performance
   */
  showPerformanceWarning() {
    const notification = document.createElement('div');
    notification.className = 'performance-warning';
    notification.innerHTML = `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 12px;">
        ⚠️ <strong>Attention :</strong> Les logs de diagnostic peuvent ralentir les gros sites web. 
        Désactivez cette option si vous rencontrez des problèmes de performance.
      </div>
    `;
    
    const settingsContainer = document.getElementById('optirank-advanced-settings');
    if (settingsContainer) {
      settingsContainer.appendChild(notification);
    }
    
    // Supprimer après 10 secondes
    this.eventManager.setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000, 'remove-performance-warning');
  }

  /**
   * Export manuel des logs
   */
  async exportLogs() {
    try {
      this.logger.info('Export des logs en cours...');
      
      // Déclencher l'export via le logger
      await this.logger.exportCurrentLogs();
      
      // Feedback utilisateur
      this.showExportNotification('Export des logs terminé avec succès !');
      
    } catch (error) {
      this.logger.error('Échec de l\'export des logs', { error: error.message });
      this.showExportNotification('Erreur lors de l\'export des logs', true);
    }
  }

  /**
   * Effacer tous les logs
   */
  async clearLogs() {
    try {
      this.logger.info('Suppression de tous les logs...');
      
      await this.logger.clearAllLogs();
      
      // Mettre à jour les stats
      this.updateStats();
      
      this.showExportNotification('Tous les logs ont été effacés');
      
    } catch (error) {
      this.logger.error('Impossible d\'effacer les logs', { error: error.message });
      this.showExportNotification('Erreur lors de la suppression', true);
    }
  }

  /**
   * Mettre à jour les statistiques
   */
  async updateStats() {
    try {
      // Stats du event manager
      const eventStats = this.eventManager.getStats();
      
      // Stats du storage
      const storage = await chrome.storage.local.get();
      const errorReports = Object.keys(storage).filter(key => key.startsWith('error_report_'));
      
      // Mettre à jour chaque statistique individuellement
      const statListeners = document.getElementById('stat-listeners');
      const statTimers = document.getElementById('stat-timers');
      const statErrors = document.getElementById('stat-errors');
      const statMode = document.getElementById('stat-mode');
      
      if (statListeners) {
        statListeners.textContent = eventStats.totalListeners;
        this.updateMetricStatus('listeners', eventStats.totalListeners);
      }
      
      if (statTimers) {
        statTimers.textContent = eventStats.totalTimers;
        this.updateMetricStatus('timers', eventStats.totalTimers);
      }
      
      if (statErrors) {
        statErrors.textContent = errorReports.length;
        this.updateMetricStatus('errors', errorReports.length);
      }
      
      if (statMode) {
        const mode = this.logger.environment.isProduction ? 'PROD' : 'DEV';
        statMode.textContent = mode;
        this.updateMetricStatus('mode', mode);
      }
      
      // Mettre à jour la santé du système
      this.updateSystemHealth(eventStats, errorReports.length);
      
    } catch (error) {
      console.error('Erreur mise à jour stats:', error);
    }
  }

  /**
   * Notifications visuelles
   */
  showSaveNotification() {
    const notification = document.getElementById('settings-save-notification');
    if (notification) {
      notification.style.display = 'block';
      
      this.eventManager.setTimeout(() => {
        notification.style.display = 'none';
      }, 3000, 'hide-save-notification');
    }
  }

  showExportNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'export-notification';
    notification.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: ${isError ? '#dc3545' : '#28a745'};
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    this.eventManager.setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000, 'remove-export-notification');
  }

  /**
   * Mettre à jour le statut visuel d'une métrique
   */
  updateMetricStatus(metric, value) {
    const statusElement = document.getElementById(`stat-${metric}-status`);
    if (!statusElement) return;
    
    switch (metric) {
      case 'listeners':
        if (value > 10) {
          statusElement.textContent = 'High Load';
        } else if (value > 0) {
          statusElement.textContent = 'Active';
        } else {
          statusElement.textContent = 'Idle';
        }
        break;
        
      case 'timers':
        if (value > 5) {
          statusElement.textContent = 'Busy';
        } else if (value > 0) {
          statusElement.textContent = 'Running';
        } else {
          statusElement.textContent = 'Idle';
        }
        break;
        
      case 'errors':
        if (value > 0) {
          statusElement.textContent = 'Issues';
        } else {
          statusElement.textContent = 'Clean';
        }
        break;
        
      case 'mode':
        statusElement.textContent = value === 'PROD' ? 'Stable' : 'Debug';
        break;
    }
  }

  /**
   * Mettre à jour la santé globale du système
   */
  updateSystemHealth(eventStats, errorCount) {
    const healthProgress = document.getElementById('health-progress');
    const healthScore = document.getElementById('health-score');
    
    if (!healthProgress || !healthScore) return;
    
    // Calculer la santé basée sur les métriques
    let health = 100;
    
    // Pénalités
    if (errorCount > 0) health -= (errorCount * 10);
    if (eventStats.totalListeners > 15) health -= 10;
    if (eventStats.totalTimers > 10) health -= 5;
    
    // Assurer que la santé reste entre 0 et 100
    health = Math.max(0, Math.min(100, health));
    
    // Mettre à jour l'affichage
    healthProgress.style.width = `${health}%`;
    healthScore.textContent = `${Math.round(health)}%`;
    
    // Mettre à jour les indicateurs
    const indicators = document.querySelectorAll('.indicator-dot');
    indicators.forEach(dot => {
      if (health >= 90) {
        dot.className = 'indicator-dot good';
      } else if (health >= 70) {
        dot.className = 'indicator-dot warning';
      } else {
        dot.className = 'indicator-dot error';
      }
    });
    
    // Changer la couleur de la barre selon la santé
    if (health >= 90) {
      healthProgress.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      healthScore.style.color = '#10b981';
    } else if (health >= 70) {
      healthProgress.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
      healthScore.style.color = '#f59e0b';
    } else {
      healthProgress.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
      healthScore.style.color = '#ef4444';
    }
  }

  /**
   * API publique pour intégration
   */
  isLoggingEnabled() {
    return this.settings.enableDiagnosticLogs;
  }

  isAutoExportEnabled() {
    return this.settings.autoExportErrors;
  }

  toggleDiagnostic() {
    const checkbox = document.getElementById('enable-diagnostic-logs');
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    }
  }
}

// Instance globale
window.OptiRankSettings = window.OptiRankSettings || new OptiRankSettings();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptiRankSettings;
} 