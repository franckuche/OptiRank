/**
 * @fileoverview OptiRank - Module d'utilitaires communs
 * Ce module fournit des fonctions utilitaires utilisées par les autres modules.
 * 
 * @module common/utils
 * @author OptiRank Team
 * @version 1.1.0
 */

// Configuration par défaut pour le scan
const defaultScanOptions = {
  checkExternal: true,
  checkInternal: true,
  detectRedirects: true,
  maxRetries: 2,
  batchSize: 5,
  timeout: 10000
};

// Résultats de scan initiaux
const initialScanResults = {
  total: 0,
  valid: 0,
  broken: 0,
  redirects: 0,
  nofollow: 0,
  skippedLinks: 0,
  spamLinks: 0,
  inProgress: false,
  hasRedirects: false,
  hasBrokenLinks: false,
  startTime: null,
  endTime: null,
  duration: 0,
  relAttributes: {
    sponsored: 0,
    ugc: 0
  }
};

// Fonction pour formater le temps en ms en format lisible
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Fonction pour échapper les caractères HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Fonction pour générer un identifiant unique
function generateUniqueId() {
  return 'lw_' + Math.random().toString(36).substr(2, 9);
}

// Exporter les fonctions et variables
window.OptiRankUtils = {
  defaultScanOptions,
  scanResults: { ...initialScanResults },
  formatDuration,
  escapeHtml,
  generateUniqueId,
  
  // Fonction pour réinitialiser les résultats de scan
  resetScanResults() {
    this.scanResults = { ...initialScanResults };
    this.scanResults.startTime = new Date();
    return this.scanResults;
  }
};

console.log('OptiRank: Utils module loaded');
