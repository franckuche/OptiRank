/**
 * OptiRank - Module d'analyse des titres (headings) - Données de test
 * Ce fichier contient des données de test pour le développement du module d'analyse des titres
 */

// Fonction pour créer des données de test pour débogage
function createTestHeadingsData() {
  console.log('🧪 TEST DATA: Création des données de test (PAS de la page réelle)');
  console.log('  - Source: popup/headings/utils/test-data.js');
  console.log('  - Ces données sont CODÉES EN DUR pour le développement');
  
  const testData = {
    counts: {
      h1: 1,
      h2: 0,
      h3: 12,
      h4: 0,
      h5: 0,
      h6: 0
    },
    headings: [
      { level: 1, text: 'Avis AQ Manager' },
      { level: 3, text: 'Recevez nos actualités chaque semaine' },
      { level: 3, text: 'Alternatives à AQ Manager' },
      { level: 3, text: 'DIMO Maint' },
      { level: 3, text: 'Fiix' },
      { level: 3, text: 'Infraspeak' },
      { level: 3, text: 'Bob! Desk' },
      { level: 3, text: 'Twimm' },
      { level: 3, text: 'GLPI' },
      { level: 3, text: 'Avis des utilisateurs (0)' },
      { level: 3, text: 'Ajouter un avis Cancel Reply' },
      { level: 3, text: 'Sources' },
      { level: 3, text: 'Historique' }
    ],
    // Supprimer les issues car on ne veut plus afficher les problèmes de hiérarchie
    issues: []
  };
  
  console.log('📊 TEST DATA: Données générées:', testData);
  return testData;
}

// Exposer globalement pour l'architecture modulaire
window.createTestHeadingsData = createTestHeadingsData;
