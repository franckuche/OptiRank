/**
 * DÉMONSTRATION - Intégration du Système de Logging OptiRank
 * Ce fichier montre comment utiliser le nouveau système de logging avec messages SEO-friendly
 */

// 🚀 PHASE 1 : Foundation - Exemples d'utilisation

class OptiRankDemo {
  constructor() {
    // Le logger et event manager sont déjà disponibles globalement
    this.logger = window.OptiRankLogger;
    this.eventManager = window.OptiRankEventManager;
    this.settings = window.OptiRankSettings;
    
    this.demoIntegration();
  }

  async demoIntegration() {
    console.log('🎯 DÉMONSTRATION du Système de Logging OptiRank');
    console.log('='.repeat(60));

    // 1. Messages SEO-friendly pour scan de liens
    await this.demoScanLinks();
    
    // 2. Gestion d'événements sans fuites mémoire
    await this.demoEventHandling();
    
    // 3. Export automatique d'erreurs
    await this.demoErrorHandling();
    
    // 4. Intégration dans le code existant
    await this.demoRealWorldUsage();
  }

  /**
   * DEMO 1 : Messages SEO-friendly pour scan de liens
   */
  async demoScanLinks() {
    console.log('\n📊 DEMO 1 : Messages SEO-friendly');
    console.log('-'.repeat(40));

    // Simulation d'un scan de liens avec messages business
    const links = ['http://example.com', 'http://broken-link.com', 'http://redirect.com'];
    
    // Démarrage du scan
    this.logger.scanStarted(links.length);
    
    // Progression
    for (let i = 0; i < links.length; i++) {
      const percent = Math.round(((i + 1) / links.length) * 100);
      this.logger.scanProgress(i + 1, links.length, percent);
      
      // Simulation de validation
      await this.simulateDelay(500);
      
      if (i === 1) {
        // Lien brisé détecté
        this.logger.linkValidationFailed(links[i], '404 Not Found');
      }
    }
    
    // Résultats finaux
    this.logger.scanCompleted({
      totalLinks: links.length,
      brokenLinks: 1,
      redirects: 0,
      duration: '1.5s'
    });
  }

  /**
   * DEMO 2 : Gestion d'événements sans fuites mémoire
   */
  async demoEventHandling() {
    console.log('\n🔧 DEMO 2 : Gestion d\'événements optimisée');
    console.log('-'.repeat(40));

    // Créer des éléments de test
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Button';
    testButton.id = 'demo-button';
    document.body.appendChild(testButton);

    // ✅ AVANT : addEventListener normal (risque de fuite)
    // testButton.addEventListener('click', () => console.log('Click!')); // ❌ Pas de cleanup

    // ✅ APRÈS : Event Manager avec cleanup automatique
    const listenerId = this.eventManager.onClick(testButton, () => {
      this.logger.info('Bouton de test cliqué', { buttonId: testButton.id });
    });

    // Timer avec tracking automatique
    const timerId = this.eventManager.setTimeout(() => {
      this.logger.info('Timer de démonstration terminé');
    }, 2000, 'demo-timer');

    // Les événements et timers seront automatiquement nettoyés
    this.logger.info('Gestionnaire d\'événements configuré avec cleanup automatique', {
      listenerId,
      timerId
    });

    // Cleanup manuel si besoin
    this.eventManager.setTimeout(() => {
      this.eventManager.removeEventListener(listenerId);
      document.body.removeChild(testButton);
      this.logger.info('Éléments de test nettoyés manuellement');
    }, 3000, 'cleanup-demo');
  }

  /**
   * DEMO 3 : Export automatique d'erreurs
   */
  async demoErrorHandling() {
    console.log('\n📤 DEMO 3 : Export automatique d\'erreurs');
    console.log('-'.repeat(40));

    // Simuler quelques erreurs pour déclencher l'export automatique
    for (let i = 1; i <= 3; i++) {
      try {
        // Simuler une erreur
        throw new Error(`Erreur de test #${i}`);
      } catch (error) {
        this.logger.error(
          `Problème détecté lors de l'analyse : Test #${i}`,
          { error: error.message, testNumber: i }
        );
      }
      
      await this.simulateDelay(200);
    }

    // Erreur critique
    try {
      throw new Error('Erreur critique simulée');
    } catch (error) {
      this.logger.criticalError(
        'Une erreur critique a interrompu l\'analyse',
        error
      );
    }

    this.logger.info('Export automatique configuré - Les erreurs seront sauvegardées');
  }

  /**
   * DEMO 4 : Intégration dans le code existant OptiRank
   */
  async demoRealWorldUsage() {
    console.log('\n🔗 DEMO 4 : Intégration dans OptiRank existant');
    console.log('-'.repeat(40));

    // Exemple d'intégration dans les modules existants
    
    // 1. Dans detector.js
    this.simulateDetectorUsage();
    
    // 2. Dans validator.js
    await this.simulateValidatorUsage();
    
    // 3. Dans scanner.js
    await this.simulateScannerUsage();
    
    // 4. Performance monitoring
    this.simulatePerformanceMonitoring();
  }

  /**
   * Exemple d'intégration dans detector.js
   */
  simulateDetectorUsage() {
    // AVANT dans detector.js :
    // console.log('Found links:', links.length);

    // APRÈS avec logging SEO-friendly :
    const detectedLinks = 42; // Simulation
    this.logger.info(`Détection terminée : ${detectedLinks} liens trouvés sur la page`, {
      linksCount: detectedLinks,
      module: 'detector'
    });

    // Gestion d'événements optimisée
    const scanButton = document.querySelector('#scan-button') || document.createElement('button');
    this.eventManager.onClick(scanButton, () => {
      this.logger.info('Analyse lancée par l\'utilisateur');
      // ... logique de scan
    });
  }

  /**
   * Exemple d'intégration dans validator.js
   */
  async simulateValidatorUsage() {
    const testUrls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://broken-site.com/404'
    ];

    for (const url of testUrls) {
      try {
        // Simulation de validation
        await this.simulateDelay(100);
        
        if (url.includes('broken')) {
          throw new Error('HTTP 404');
        }
        
        // AVANT dans validator.js :
        // console.log('Validation success for:', url);
        
        // APRÈS avec logging SEO-friendly :
        this.logger.info('Lien validé avec succès', {
          url: this.logger.anonymizeUrl(url),
          module: 'validator'
        });
        
      } catch (error) {
        // AVANT :
        // console.error('Validation failed:', error);
        
        // APRÈS :
        this.logger.linkValidationFailed(url, error.message);
      }
    }
  }

  /**
   * Exemple d'intégration dans scanner.js
   */
  async simulateScannerUsage() {
    const batchSize = 10;
    const totalLinks = 45;
    
    this.logger.scanStarted(totalLinks);
    
    for (let batch = 0; batch < Math.ceil(totalLinks / batchSize); batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalLinks);
      const processed = endIndex;
      const percent = Math.round((processed / totalLinks) * 100);
      
      // AVANT dans scanner.js :
      // console.log(`Processing batch ${batch + 1}, ${processed}/${totalLinks} complete`);
      
      // APRÈS :
      this.logger.scanProgress(processed, totalLinks, percent);
      
      await this.simulateDelay(200);
    }
    
    // Timer géré automatiquement
    this.eventManager.setTimeout(() => {
      this.logger.scanCompleted({
        totalLinks,
        brokenLinks: 3,
        redirects: 5,
        duration: '3.2s'
      });
    }, 500, 'scan-completion');
  }

  /**
   * Monitoring des performances
   */
  simulatePerformanceMonitoring() {
    // Surveiller l'utilisation mémoire
    const memoryUsage = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    if (memoryUsage > 50 * 1024 * 1024) { // 50MB
      this.logger.performanceWarning(
        'Utilisation mémoire élevée détectée',
        { memoryMB: Math.round(memoryUsage / 1024 / 1024) }
      );
    }
    
    // Surveiller les event listeners
    const stats = this.eventManager.getStats();
    
    if (stats.totalListeners > 20) {
      this.logger.performanceWarning(
        'Nombre élevé d\'écouteurs d\'événements actifs',
        { totalListeners: stats.totalListeners }
      );
    }
  }

  /**
   * Utilitaire pour simuler des délais
   */
  simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 🎯 GUIDE D'INTÉGRATION ÉTAPE PAR ÉTAPE

console.log(`
🚀 GUIDE D'INTÉGRATION - Système de Logging OptiRank

ÉTAPE 1 : Remplacer les console.log existants
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ AVANT :
console.log('Found ' + links.length + ' links');
console.error('Validation failed:', error);

✅ APRÈS :
this.logger.info('Détection terminée : ' + links.length + ' liens trouvés');
this.logger.linkValidationFailed(url, error.message);

ÉTAPE 2 : Utiliser l'Event Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ AVANT :
element.addEventListener('click', handler);
setTimeout(callback, 1000);

✅ APRÈS :
this.eventManager.onClick(element, handler);
this.eventManager.setTimeout(callback, 1000, 'timer-name');

ÉTAPE 3 : Intégrer les Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Dans popup.html, ajouter :
<script src="shared/logger.js"></script>
<script src="shared/event-manager.js"></script>
<script src="popup/js/settings.js"></script>

ÉTAPE 4 : Messages SEO-friendly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Messages orientés utilisateur SEO :
- "Analyse terminée : 42 liens analysés, 3 liens brisés détectés"
- "Scan en cours... 67% terminé"
- "Attention : 5 redirections détectées"

❌ Éviter les messages techniques :
- "XMLHttpRequest failed with status 404"
- "Promise rejection in async function"

ÉTAPE 5 : Test et Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ouvrir la console Chrome
2. Activer les logs diagnostic dans les settings
3. Lancer un scan pour voir les messages SEO-friendly
4. Vérifier l'export automatique des erreurs
5. Surveiller les stats d'événements

🎯 RÉSULTAT : Extension OptiRank avec logging professionnel,
   pas de fuites mémoire, export automatique d'erreurs,
   et messages compréhensibles pour les utilisateurs SEO !
`);

// Démarrer la démonstration quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptiRankDemo();
  });
} else {
  new OptiRankDemo();
} 