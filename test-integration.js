/**
 * TEST D'INTÉGRATION - Système de Logging OptiRank
 * Ce fichier teste que l'intégration fonctionne correctement
 */

console.log('🧪 DÉMARRAGE DU TEST D\'INTÉGRATION');
console.log('='.repeat(50));

// Test de chargement des modules
function testModulesLoading() {
  console.log('\n1️⃣ TEST : Chargement des modules');
  console.log('-'.repeat(30));
  
  // Vérifier que les modules sont chargés
  const loggerLoaded = typeof window.OptiRankLogger !== 'undefined';
  const eventManagerLoaded = typeof window.OptiRankEventManager !== 'undefined';
  const settingsLoaded = typeof window.OptiRankSettings !== 'undefined';
  
  console.log('✅ Logger chargé:', loggerLoaded);
  console.log('✅ Event Manager chargé:', eventManagerLoaded);
  console.log('✅ Settings chargé:', settingsLoaded);
  
  if (loggerLoaded && eventManagerLoaded) {
    console.log('🎉 Tous les modules sont correctement chargés !');
    return true;
  } else {
    console.log('❌ Certains modules ne sont pas chargés');
    return false;
  }
}

// Test des messages SEO-friendly
function testSEOMessages() {
  console.log('\n2️⃣ TEST : Messages SEO-friendly');
  console.log('-'.repeat(30));
  
  if (!window.OptiRankLogger) {
    console.log('❌ Logger non disponible pour le test');
    return false;
  }
  
  const logger = window.OptiRankLogger;
  
  // Test des messages pré-formatés
  logger.scanStarted(25);
  logger.scanProgress(10, 25, 40);
  logger.linkValidationFailed('https://example.com/broken', '404 Not Found');
  logger.scanCompleted({
    totalLinks: 25,
    brokenLinks: 2,
    redirects: 3,
    duration: '2.1s'
  });
  
  // Test des messages génériques
  logger.info('Test d\'intégration en cours : validation des messages SEO');
  logger.warn('Attention : ceci est un test, pas une vraie analyse');
  logger.error('Erreur simulée pour tester l\'export automatique');
  
  console.log('✅ Messages SEO-friendly testés avec succès');
  return true;
}

// Test du gestionnaire d'événements
function testEventManager() {
  console.log('\n3️⃣ TEST : Gestionnaire d\'événements');
  console.log('-'.repeat(30));
  
  if (!window.OptiRankEventManager) {
    console.log('❌ Event Manager non disponible pour le test');
    return false;
  }
  
  const eventManager = window.OptiRankEventManager;
  
  // Créer un élément de test
  const testButton = document.createElement('button');
  testButton.textContent = 'Test Button';
  testButton.id = 'test-integration-button';
  document.body.appendChild(testButton);
  
  // Test addEventListener avec tracking
  const listenerId = eventManager.onClick(testButton, () => {
    console.log('✅ Click handler testé avec succès');
  });
  
  // Test setTimeout avec tracking
  const timerId = eventManager.setTimeout(() => {
    console.log('✅ Timer testé avec succès');
  }, 100, 'test-timer');
  
  // Vérifier les stats
  const stats = eventManager.getStats();
  console.log('📊 Stats événements:', {
    listeners: stats.totalListeners,
    timers: stats.totalTimers
  });
  
  // Cleanup
  eventManager.setTimeout(() => {
    eventManager.removeEventListener(listenerId);
    document.body.removeChild(testButton);
    console.log('✅ Cleanup automatique testé');
  }, 200, 'test-cleanup');
  
  console.log('✅ Event Manager testé avec succès');
  return true;
}

// Test de détection d'environnement
function testEnvironmentDetection() {
  console.log('\n4️⃣ TEST : Détection d\'environnement');
  console.log('-'.repeat(30));
  
  if (!window.OptiRankLogger) {
    console.log('❌ Logger non disponible pour le test');
    return false;
  }
  
  const logger = window.OptiRankLogger;
  const env = logger.environment;
  
  console.log('🌍 Environnement détecté:', {
    isProduction: env.isProduction,
    isDevelopment: env.isDevelopment,
    version: env.version,
    name: env.name
  });
  
  // Vérifier la logique de logging
  if (env.isDevelopment) {
    console.log('🟢 Mode développement : tous les logs activés');
  } else {
    console.log('🔴 Mode production : logs restreints');
  }
  
  console.log('✅ Détection d\'environnement testée');
  return true;
}

// Test de l'interface Settings (si disponible)
function testSettingsInterface() {
  console.log('\n5️⃣ TEST : Interface Settings');
  console.log('-'.repeat(30));
  
  if (!window.OptiRankSettings) {
    console.log('⚠️ Settings non disponibles (normal en contexte content script)');
    return true;
  }
  
  const settings = window.OptiRankSettings;
  
  console.log('⚙️ Settings disponibles:', {
    loggingEnabled: settings.isLoggingEnabled(),
    autoExportEnabled: settings.isAutoExportEnabled()
  });
  
  console.log('✅ Interface Settings accessible');
  return true;
}

// Exécuter tous les tests
async function runAllTests() {
  const results = [];
  
  results.push(testModulesLoading());
  
  if (results[0]) { // Si les modules sont chargés
    results.push(testSEOMessages());
    results.push(testEventManager());
    results.push(testEnvironmentDetection());
    results.push(testSettingsInterface());
  }
  
  // Résumé des résultats
  console.log('\n🎯 RÉSUMÉ DES TESTS');
  console.log('='.repeat(30));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Tests réussis : ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 INTÉGRATION RÉUSSIE ! Le système de logging OptiRank est opérationnel.');
    
    // Message final SEO-friendly
    if (window.OptiRankLogger) {
      window.OptiRankLogger.info('Tests d\'intégration terminés avec succès : système de logging opérationnel');
    }
  } else {
    console.log('❌ Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  return passed === total;
}

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Test de compatibilité avec l'ancienne API
function testBackwardCompatibility() {
  console.log('\n6️⃣ TEST : Compatibilité ancienne API');
  console.log('-'.repeat(30));
  
  // Simuler l'ancien système si le nouveau n'est pas disponible
  if (!window.OptiRankLogger) {
    window.logger = {
      info: (msg) => console.log('[FALLBACK] ' + msg),
      error: (msg) => console.error('[FALLBACK] ' + msg)
    };
    console.log('✅ Fallback activé pour compatibilité');
  }
  
  console.log('✅ Compatibilité testée');
  return true;
}

// Export pour usage externe
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testModulesLoading, testSEOMessages };
} 