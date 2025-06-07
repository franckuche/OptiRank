/**
 * MIGRATION AUTOMATIQUE - Console.log vers Système SEO-friendly
 * Script pour migrer automatiquement les logs existants
 */

const fs = require('fs');
const path = require('path');

// Configuration de la migration
const MIGRATION_CONFIG = {
  // Fichiers à migrer (patterns)
  targetFiles: [
    'content/**/*.js',
    'popup/**/*.js',
    'background/**/*.js'
  ],
  
  // Fichiers à exclure
  excludeFiles: [
    'shared/logger.js',
    'shared/event-manager.js',
    'popup/js/settings.js',
    'demo-integration.js',
    'test-integration.js',
    'migrate-to-seo-logging.js'
  ],

  // Mappings des messages vers SEO-friendly
  messageMappings: {
    // Patterns de détection et leurs remplacements SEO
    scan: {
      patterns: [
        /console\.log.*Found.*links?.*:?\s*(\d+)/i,
        /console\.log.*(\d+).*links?.*found/i,
        /console\.log.*Scanning.*(\d+)/i
      ],
      replacement: 'logger.scanStarted($1);'
    },
    
    progress: {
      patterns: [
        /console\.log.*Progress.*(\d+).*\/.*(\d+)/i,
        /console\.log.*(\d+).*\/.*(\d+).*complete/i,
        /console\.log.*Processing.*batch.*(\d+)/i
      ],
      replacement: 'logger.scanProgress($1, $2, Math.round(($1/$2)*100));'
    },
    
    validation: {
      patterns: [
        /console\.log.*Validation.*success/i,
        /console\.log.*Link.*valid/i,
        /console\.log.*OK.*200/i
      ],
      replacement: 'logger.info("Lien validé avec succès", { url: anonymizeUrl });'
    },
    
    errors: {
      patterns: [
        /console\.error.*Validation.*failed/i,
        /console\.error.*404/i,
        /console\.error.*HTTP.*(\d+)/i,
        /console\.error.*Error.*:/i
      ],
      replacement: 'logger.linkValidationFailed(url, "$1");'
    },
    
    completion: {
      patterns: [
        /console\.log.*Analysis.*complete/i,
        /console\.log.*Scan.*finished/i,
        /console\.log.*Done.*(\d+).*links/i
      ],
      replacement: 'logger.scanCompleted({ totalLinks: $1, brokenLinks: 0, redirects: 0, duration: "unknown" });'
    }
  }
};

// Templates de code pour l'injection
const CODE_TEMPLATES = {
  loggerInit: `
// 🚀 OptiRank SEO-friendly Logging
const logger = window.OptiRankLogger || {
  info: (msg, data) => console.log('[OptiRank] ' + msg, data || ''),
  error: (msg, data) => console.error('[OptiRank Error] ' + msg, data || ''),
  warn: (msg, data) => console.warn('[OptiRank Warning] ' + msg, data || ''),
  scanStarted: (count) => console.log('[OptiRank] Analyse démarrée : ' + count + ' liens à analyser'),
  scanProgress: (current, total, percent) => console.log('[OptiRank] Progression : ' + percent + '% (' + current + '/' + total + ')'),
  scanCompleted: (stats) => console.log('[OptiRank] Analyse terminée', stats),
  linkValidationFailed: (url, status) => console.warn('[OptiRank] Lien inaccessible : ' + url + ' (' + status + ')')
};

const eventManager = window.OptiRankEventManager || {
  onClick: (el, handler) => el.addEventListener('click', handler),
  setTimeout: (callback, delay, name) => setTimeout(callback, delay),
  removeEventListener: (id) => console.log('Event cleanup simulated for:', id)
};
`,

  helpers: `
// Helpers pour migration
function anonymizeUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol + '//' + urlObj.hostname + '/[path]';
  } catch {
    return '[invalid-url]';
  }
}
`
};

// Fonction principale de migration
function migrateFile(filePath) {
  console.log(`🔄 Migration de ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 1. Ajouter l'initialisation du logger en début de fichier
    if (!content.includes('OptiRankLogger') && !content.includes('// 🚀 OptiRank SEO-friendly Logging')) {
      content = CODE_TEMPLATES.loggerInit + CODE_TEMPLATES.helpers + content;
      modified = true;
      console.log('   ✅ Initialisation du logger ajoutée');
    }
    
    // 2. Migrer les console.log selon les patterns
    const originalConsoleCount = (content.match(/console\.(log|error|warn)/g) || []).length;
    
    for (const [category, config] of Object.entries(MIGRATION_CONFIG.messageMappings)) {
      for (const pattern of config.patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, config.replacement);
          modified = true;
          console.log(`   ✅ Pattern ${category} migré`);
        }
      }
    }
    
    // 3. Migrations spécifiques communes
    const commonMigrations = [
      // Console.log génériques vers messages SEO
      {
        pattern: /console\.log\(['"`]Found (\d+) links['"`]\)/g,
        replacement: 'logger.info("Détection terminée : $1 liens trouvés sur la page", { linksCount: $1 })'
      },
      {
        pattern: /console\.log\(['"`]Scanning links\.\.\.['"`]\)/g,
        replacement: 'logger.info("Analyse des liens en cours...")'
      },
      {
        pattern: /console\.log\(['"`]Analysis complete['"`]\)/g,
        replacement: 'logger.info("Analyse terminée avec succès")'
      },
      {
        pattern: /console\.error\(['"`]Error:?\s*['"`],?\s*(.+)\)/g,
        replacement: 'logger.error("Une erreur est survenue", { error: $1 })'
      },
      {
        pattern: /console\.warn\(['"`]Warning:?\s*['"`],?\s*(.+)\)/g,
        replacement: 'logger.warn("Attention", { warning: $1 })'
      }
    ];
    
    for (const migration of commonMigrations) {
      if (migration.pattern.test(content)) {
        content = content.replace(migration.pattern, migration.replacement);
        modified = true;
        console.log('   ✅ Migration commune appliquée');
      }
    }
    
    // 4. Migrer addEventListener vers eventManager (plus conservateur)
    const addEventListenerMatches = content.matchAll(/([a-zA-Z_$][a-zA-Z0-9_$]*)\.addEventListener\(['"`]([^'"`]+)['"`],\s*([^)]+)\)/g);
    for (const match of addEventListenerMatches) {
      const [fullMatch, element, event, handler] = match;
      let replacement;
      if (event === 'click') {
        replacement = `eventManager.onClick(${element}, ${handler})`;
      } else {
        replacement = `eventManager.addEventListener(${element}, '${event}', ${handler})`;
      }
      content = content.replace(fullMatch, replacement);
      modified = true;
      console.log(`   ✅ Event listener ${event} migré`);
    }
    
    // 5. Migrer setTimeout vers eventManager (plus conservateur)
    const setTimeoutMatches = content.matchAll(/setTimeout\(([^,)]+),\s*(\d+)\)/g);
    for (const match of setTimeoutMatches) {
      const [fullMatch, callback, delay] = match;
      const replacement = `eventManager.setTimeout(${callback}, ${delay}, 'auto-migrated-timer')`;
      content = content.replace(fullMatch, replacement);
      modified = true;
      console.log(`   ✅ setTimeout migré (${delay}ms)`);
    }
    
    const finalConsoleCount = (content.match(/console\.(log|error|warn)/g) || []).length;
    const migratedCount = originalConsoleCount - finalConsoleCount;
    
    if (modified) {
      // Créer un backup
      const backupPath = filePath + '.backup';
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));
      
      // Écrire le fichier migré
      fs.writeFileSync(filePath, content);
      
      console.log(`   🎉 Migration réussie ! ${migratedCount} logs migrés`);
      console.log(`   📁 Backup créé : ${backupPath}`);
    } else {
      console.log('   ⏭️ Aucune migration nécessaire');
    }
    
    return { success: true, migratedCount, modified };
    
  } catch (error) {
    console.error(`   ❌ Erreur migration ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Fonction pour trouver tous les fichiers à migrer
function findFilesToMigrate() {
  const glob = require('glob');
  let allFiles = [];
  
  for (const pattern of MIGRATION_CONFIG.targetFiles) {
    const files = glob.sync(pattern);
    allFiles = allFiles.concat(files);
  }
  
  // Exclure les fichiers spécifiés
  allFiles = allFiles.filter(file => {
    return !MIGRATION_CONFIG.excludeFiles.some(exclude => file.includes(exclude));
  });
  
  return [...new Set(allFiles)]; // Dédoublonner
}

// Fonction principale
function runMigration() {
  console.log('🚀 MIGRATION VERS SYSTÈME SEO-FRIENDLY');
  console.log('='.repeat(50));
  
  const filesToMigrate = findFilesToMigrate();
  console.log(`📁 ${filesToMigrate.length} fichiers trouvés pour migration\n`);
  
  const results = {
    total: filesToMigrate.length,
    success: 0,
    failed: 0,
    totalMigrated: 0
  };
  
  for (const file of filesToMigrate) {
    const result = migrateFile(file);
    
    if (result.success) {
      results.success++;
      results.totalMigrated += result.migratedCount || 0;
    } else {
      results.failed++;
    }
  }
  
  // Résumé final
  console.log('\n🎯 RÉSUMÉ DE LA MIGRATION');
  console.log('='.repeat(30));
  console.log(`✅ Fichiers migrés avec succès : ${results.success}`);
  console.log(`❌ Fichiers en erreur : ${results.failed}`);
  console.log(`📊 Total de logs migrés : ${results.totalMigrated}`);
  
  if (results.success > 0) {
    console.log('\n🎉 MIGRATION TERMINÉE !');
    console.log('📋 Actions suivantes recommandées :');
    console.log('   1. Tester l\'extension avec le nouveau système');
    console.log('   2. Vérifier les messages SEO-friendly dans la console');
    console.log('   3. Supprimer les fichiers .backup si tout fonctionne');
    console.log('   4. Activer les logs diagnostic depuis les settings');
  }
}

// Fonction pour créer un rapport de migration
function generateMigrationReport() {
  console.log('\n📊 GÉNÉRATION DU RAPPORT DE MIGRATION');
  console.log('-'.repeat(40));
  
  const filesToMigrate = findFilesToMigrate();
  
  for (const file of filesToMigrate) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const consoleCount = (content.match(/console\.(log|error|warn)/g) || []).length;
      const addEventListenerCount = (content.match(/\.addEventListener/g) || []).length;
      const setTimeoutCount = (content.match(/setTimeout/g) || []).length;
      
      console.log(`📄 ${file}:`);
      console.log(`   - ${consoleCount} console.log/error/warn`);
      console.log(`   - ${addEventListenerCount} addEventListener`);
      console.log(`   - ${setTimeoutCount} setTimeout`);
    } catch (error) {
      console.log(`📄 ${file}: Erreur lecture`);
    }
  }
}

// Interface en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--report')) {
    generateMigrationReport();
  } else if (args.includes('--help')) {
    console.log(`
🚀 MIGRATION OPTIRANK VERS SEO-FRIENDLY LOGGING

Usage:
  node migrate-to-seo-logging.js           # Migrer tous les fichiers
  node migrate-to-seo-logging.js --report  # Générer un rapport pré-migration
  node migrate-to-seo-logging.js --help    # Afficher cette aide

Ce script migre automatiquement :
✅ console.log → messages SEO-friendly
✅ addEventListener → eventManager avec cleanup
✅ setTimeout → eventManager avec tracking
✅ Ajoute le système de logging OptiRank

Fichiers sauvegardés automatiquement avec extension .backup
    `);
  } else {
    runMigration();
  }
}

module.exports = { migrateFile, runMigration, generateMigrationReport }; 