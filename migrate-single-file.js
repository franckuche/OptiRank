/**
 * Migration d'un seul fichier pour test
 */
const { migrateFile } = require('./migrate-to-seo-logging.js');

// Tester la migration sur popup.js
const filePath = process.argv[2] || 'popup/popup.js';

console.log(`🧪 TEST DE MIGRATION : ${filePath}`);
console.log('='.repeat(50));

// Créer un backup manuel d'abord
const fs = require('fs');
const backupPath = filePath + '.test-backup';

try {
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ Backup créé : ${backupPath}`);
} catch (error) {
  console.error('❌ Erreur création backup:', error.message);
  process.exit(1);
}

// Exécuter la migration
const result = migrateFile(filePath);

if (result.success) {
  console.log('\n🎉 Migration de test réussie !');
  console.log(`📊 ${result.migratedCount} éléments migrés`);
  
  // Afficher un extrait du fichier migré
  console.log('\n📄 APERÇU DU FICHIER MIGRÉ :');
  console.log('-'.repeat(30));
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').slice(0, 50); // 50 premières lignes
  
  lines.forEach((line, index) => {
    if (line.includes('logger.') || line.includes('eventManager.') || line.includes('OptiRank')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
  
} else {
  console.log('\n❌ Migration échouée:', result.error);
  
  // Restaurer le backup
  fs.copyFileSync(backupPath, filePath);
  console.log('🔄 Fichier original restauré');
}

console.log('\n📋 ACTIONS SUIVANTES :');
console.log('1. Vérifiez le fichier migré manuellement');
console.log('2. Testez l\'extension pour valider');
console.log('3. Si OK : supprimez les .backup');
console.log('4. Si problème : restaurez avec le .test-backup'); 