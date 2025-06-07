/**
 * Script de test pour la détection d'environnement
 * Usage: Coller dans la console des DevTools pour tester
 */

function testEnvironmentDetection() {
  console.log('🔬 TEST DE DÉTECTION D\'ENVIRONNEMENT');
  console.log('=====================================\n');
  
  // Test 1: Vérification de l'API Chrome
  console.log('📋 1. VÉRIFICATION API CHROME:');
  console.log('   - typeof chrome:', typeof chrome);
  console.log('   - chrome.runtime existe:', !!(typeof chrome !== 'undefined' && chrome.runtime));
  console.log('   - chrome.runtime.getManifest existe:', !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest));
  
  // Test 2: Informations du manifest
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    try {
      const manifest = chrome.runtime.getManifest();
      console.log('\n📄 2. INFORMATIONS DU MANIFEST:');
      console.log('   - Nom:', manifest.name);
      console.log('   - Version:', manifest.version);
      console.log('   - Update URL:', manifest.update_url || '❌ NON DÉFINI');
      console.log('   - Résultat détection:', !manifest.update_url ? '🟢 DÉVELOPPEMENT' : '🔴 PRODUCTION');
    } catch (error) {
      console.log('\n❌ 2. ERREUR LECTURE MANIFEST:', error.message);
    }
  } else {
    console.log('\n❌ 2. API CHROME NON DISPONIBLE');
  }
  
  // Test 3: Vérification de l'hostname
  console.log('\n🌐 3. VÉRIFICATION HOSTNAME:');
  console.log('   - window.location.hostname:', window.location.hostname);
  console.log('   - window.location.protocol:', window.location.protocol);
  console.log('   - Est localhost?', window.location.hostname === 'localhost' ? '✅' : '❌');
  console.log('   - Est 127.0.0.1?', window.location.hostname === '127.0.0.1' ? '✅' : '❌');
  console.log('   - Est file:?', window.location.protocol === 'file:' ? '✅' : '❌');
  
  // Test 4: Test complet avec le logger
  if (typeof logger !== 'undefined') {
    console.log('\n🎯 4. RÉSULTAT FINAL DU LOGGER:');
    console.log('   - isDevelopment:', logger.isDevelopment);
    console.log('   - logLevel:', logger.logLevel);
    console.log('   - Environnement détecté:', logger.isDevelopment ? '🟢 DÉVELOPPEMENT' : '🔴 PRODUCTION');
    
    // Test des niveaux de log
    console.log('\n🧪 5. TEST DES LOGS:');
    logger.debug('Test debug - visible seulement en DEV');
    logger.info('Test info - selon configuration');
    logger.warn('Test warning - selon configuration'); 
    logger.error('Test error - toujours visible');
  } else {
    console.log('\n❌ 4. LOGGER NON DISPONIBLE');
  }
  
  console.log('\n✅ Test terminé !');
}

// Instructions d'utilisation
console.log(`
🔬 SCRIPT DE TEST DE DÉTECTION D'ENVIRONNEMENT
==============================================

Pour tester, copiez et exécutez dans la console :
testEnvironmentDetection();

Ou ajoutez ce script dans votre page et appelez la fonction.
`);

// Auto-export si on est dans Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testEnvironmentDetection };
} testEnvironmentDetection();
