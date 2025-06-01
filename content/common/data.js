/**
 * @fileoverview OptiRank - Module de gestion des données
 * Ce module est responsable de la gestion des données et de l'état de l'application.
 * 
 * @module common/data
 * @author OptiRank Team
 * @version 1.1.0
 */

// Stockage des données de l'application
const appData = {
  settings: null,
  scanHistory: [],
  cachedResults: {}
};

// Paramètres par défaut
const defaultSettings = {
  autoScanEnabled: false,
  checkExternal: true,
  checkInternal: true,
  detectRedirects: true,
  maxRetries: 2,
  batchSize: 5,
  timeout: 10000
};

// Charger les paramètres depuis le stockage local
function loadSettings() {
  return new Promise((resolve) => {
    // Vérifier si l'API Chrome est disponible
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('settings', (data) => {
        appData.settings = data.settings || { ...defaultSettings };
        window.OptiRankUtils.settings = appData.settings; // Partager avec Utils
        resolve(appData.settings);
      });
    } else {
      // Utiliser les paramètres par défaut si l'API Chrome n'est pas disponible
      console.warn('OptiRank: chrome.storage n\'est pas disponible, utilisation des paramètres par défaut');
      appData.settings = { ...defaultSettings };
      window.OptiRankUtils.settings = appData.settings; // Partager avec Utils
      resolve(appData.settings);
    }
  });
}

// Charger les paramètres immédiatement
loadSettings().then(settings => {
  console.log('OptiRank: Paramètres chargés:', settings);
});

// Sauvegarder les paramètres dans le stockage local
function saveSettings(settings) {
  return new Promise((resolve) => {
    // Vérifier si l'API Chrome est disponible
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ settings }, () => {
        appData.settings = settings;
        window.OptiRankUtils.settings = settings; // Partager avec Utils
        resolve(settings);
      });
    } else {
      // Sauvegarder en mémoire seulement si l'API Chrome n'est pas disponible
      console.warn('OptiRank: chrome.storage n\'est pas disponible, sauvegarde en mémoire uniquement');
      appData.settings = settings;
      window.OptiRankUtils.settings = settings; // Partager avec Utils
      resolve(settings);
    }
  });
}

// Exporter les fonctions et variables
window.OptiRankData = {
  appData,
  loadSettings,
  saveSettings
};

console.log('OptiRank: Data module loaded');
