/**
 * OptiRank - Module d'analyse des titres (headings) - Détecteur d'Issues
 * Ce fichier implémente l'algorithme ultra-complet de détection des problèmes de structure
 */

/**
 * Analyse complète des issues selon l'algorithme ultra-détaillé
 * @param {Array} headings - Liste des titres {level, text, index}
 * @param {Object} counts - Compteurs par niveau {h1, h2, h3, h4, h5, h6}
 * @return {Object} Résultat complet {issues, scores, summary}
 */
function analyzeHeadingIssues(headings, counts) {
  const issues = [];
  const wordCount = window.headingsTextAnalysis?.estimatePageWordCount() || 0;
  
  // 3.1 PROBLÈMES DE STRUCTURE DE BASE
  detectBasicStructureIssues(headings, counts, issues);
  
  // 3.2 PROBLÈMES DE HIÉRARCHIE
  detectHierarchyIssues(headings, issues);
  
  // 3.3 DÉSÉQUILIBRES QUANTITATIFS
  detectQuantitativeImbalances(headings, counts, wordCount, issues);
  
  // 3.4 QUALITÉ TEXTUELLE
  detectTextualQualityIssues(headings, issues);
  
  // 4. CALCUL DU SCORING
  const scores = calculateSeverityScores(issues);
  
  // 5. RÉSUMÉ GLOBAL
  const summary = generateGlobalSummary(issues, scores);
  
  return {
    issues,
    scores,
    summary,
    wordCount
  };
}

/**
 * 3.1 Détection des problèmes de structure de base
 */
function detectBasicStructureIssues(headings, counts, issues) {
  const messages = window.headingsIssuesConfig?.messages || {};
  
  // Aucune balise H1-H6 détectée
  if (!headings || headings.length === 0) {
    issues.push(createIssue('noHeadingsAtAll', messages.noHeadingsAtAll, {}));
    return; // Pas besoin de continuer l'analyse
  }
  
  // Aucun H1 mais autres titres existent
  if (counts.h1 === 0 && headings.length > 0) {
    issues.push(createIssue('noH1WithOthers', messages.noH1WithOthers, {}));
  }
  
  // Plusieurs H1 détectés
  if (counts.h1 > 1) {
    issues.push(createIssue('multipleH1', messages.multipleH1, { count: counts.h1 }));
  }
  
  // Premier titre n'est pas un H1
  if (headings.length > 0 && headings[0].level !== 1) {
    issues.push(createIssue('firstNotH1', messages.firstNotH1, { level: headings[0].level }));
  }
}

/**
 * 3.2 Détection des problèmes de hiérarchie et sauts
 */
function detectHierarchyIssues(headings, issues) {
  if (!headings || headings.length < 2) return;
  
  const messages = window.headingsIssuesConfig?.messages || {};
  
  for (let i = 1; i < headings.length; i++) {
    const current = headings[i];
    const previous = headings[i - 1];
    
    // Saut descendant (skip down) - ex: H2 → H4
    if (current.level > previous.level + 1) {
      const skipSize = current.level - previous.level;
      
      if (skipSize > 2) {
        // Saut multiple (critique)
        issues.push(createIssue('multipleSkipLevels', messages.multipleSkipLevels, {
          prevLevel: previous.level,
          currLevel: current.level,
          skipSize: skipSize
        }));
      } else {
        // Saut simple (moyen)
        issues.push(createIssue('skipDown', messages.skipDown, {
          prevLevel: previous.level,
          currLevel: current.level,
          expectedLevel: previous.level + 1
        }));
      }
    }
    
    // Saut ascendant brutal (skip up) - ex: H5 → H2
    if (current.level < previous.level - 1) {
      issues.push(createIssue('skipUp', messages.skipUp, {
        prevLevel: previous.level,
        currLevel: current.level,
        expectedLevel: previous.level - 1
      }));
    }
  }
  
  // Détection des titres orphelins (sans parent approprié)
  detectOrphanHeadings(headings, issues);
}

/**
 * Détection des titres orphelins
 */
function detectOrphanHeadings(headings, issues) {
  const messages = window.headingsIssuesConfig?.messages || {};
  
  for (let i = 0; i < headings.length; i++) {
    const current = headings[i];
    
    if (current.level === 1) continue; // H1 ne peut pas être orphelin
    
    const expectedParentLevel = current.level - 1;
    
    // Chercher un parent approprié avant ce titre
    let hasValidParent = false;
    for (let j = i - 1; j >= 0; j--) {
      if (headings[j].level === expectedParentLevel) {
        hasValidParent = true;
        break;
      }
      if (headings[j].level < expectedParentLevel) {
        break; // On est remonté trop haut dans la hiérarchie
      }
    }
    
    if (!hasValidParent) {
      issues.push(createIssue('orphanHeading', messages.orphanHeading, {
        level: current.level,
        expectedParent: expectedParentLevel,
        text: current.text.substring(0, 30) + (current.text.length > 30 ? '...' : '')
      }));
    }
  }
}

/**
 * 3.3 Détection des déséquilibres quantitatifs
 */
function detectQuantitativeImbalances(headings, counts, wordCount, issues) {
  const messages = window.headingsIssuesConfig?.messages || {};
  const config = window.headingsIssuesConfig?.detection || {};
  
  // Ratios de déséquilibre entre niveaux
  detectRatioImbalances(counts, issues);
  
  // Profondeur inadaptée au contenu
  detectDepthMismatches(headings, wordCount, issues);
}

/**
 * Détection des ratios déséquilibrés entre niveaux
 */
function detectRatioImbalances(counts, issues) {
  const messages = window.headingsIssuesConfig?.messages || {};
  const config = window.headingsIssuesConfig?.detection?.ratios || {};
  const maxRatioWarning = config.maxRatioWarning || 5;
  const maxRatioCritical = config.maxRatioCritical || 10;
  
  for (let parentLevel = 1; parentLevel <= 5; parentLevel++) {
    const childLevel = parentLevel + 1;
    const parentCount = counts[`h${parentLevel}`] || 0;
    const childCount = counts[`h${childLevel}`] || 0;
    
    if (parentCount === 0 || childCount === 0) continue;
    
    const ratio = childCount / parentCount;
    
    if (ratio > maxRatioCritical) {
      issues.push(createIssue('ratioImbalance', messages.ratioImbalance, {
        childCount,
        childLevel,
        parentCount,
        parentLevel,
        ratio: Math.round(ratio * 10) / 10,
        severity: '🔴'
      }));
    } else if (ratio > maxRatioWarning) {
      issues.push(createIssue('ratioImbalance', messages.ratioImbalance, {
        childCount,
        childLevel,
        parentCount,
        parentLevel,
        ratio: Math.round(ratio * 10) / 10,
        severity: '🟡'
      }));
    }
  }
}

/**
 * Détection des inadéquations profondeur/contenu
 */
function detectDepthMismatches(headings, wordCount, issues) {
  if (!headings || headings.length === 0) return;
  
  const messages = window.headingsIssuesConfig?.messages || {};
  const config = window.headingsIssuesConfig?.detection?.depth || {};
  
  const maxLevel = Math.max(...headings.map(h => h.level));
  
  // Page courte avec structure trop profonde
  if (wordCount < config.veryShortContentWordLimit && maxLevel > config.maxDepthForVeryShort) {
    issues.push(createIssue('depthMismatchShort', messages.depthMismatchShort, {
      wordCount,
      maxLevel,
      expectedMaxLevel: config.maxDepthForVeryShort
    }));
  } else if (wordCount < config.shortContentWordLimit && maxLevel > config.maxDepthForShort) {
    issues.push(createIssue('depthMismatchShort', messages.depthMismatchShort, {
      wordCount,
      maxLevel,
      expectedMaxLevel: config.maxDepthForShort
    }));
  }
  
  // Page longue avec structure trop simple
  if (wordCount > config.longContentWordLimit && maxLevel < config.minDepthForLong) {
    issues.push(createIssue('depthMismatchLong', messages.depthMismatchLong, {
      wordCount,
      maxLevel,
      expectedMinLevel: config.minDepthForLong
    }));
  }
}

/**
 * 3.4 Détection des problèmes de qualité textuelle
 */
function detectTextualQualityIssues(headings, issues) {
  if (!headings || headings.length === 0) return;
  
  const messages = window.headingsIssuesConfig?.messages || {};
  const stopwords = window.headingsIssuesConfig?.detection?.stopwords || [];
  
  // Analyser chaque titre individuellement
  headings.forEach((heading, index) => {
    // Longueur des titres
    const lengthValidation = window.headingsTextAnalysis?.validateTitleLength(heading.text, heading.level);
    if (lengthValidation?.isTooShort) {
      issues.push(createIssue('tooShort', messages.tooShort, {
        level: heading.level,
        length: lengthValidation.length,
        expectedMin: lengthValidation.minExpected,
        index
      }));
    } else if (lengthValidation?.isTooLong) {
      issues.push(createIssue('tooLong', messages.tooLong, {
        level: heading.level,
        length: lengthValidation.length,
        expectedMax: lengthValidation.maxExpected,
        index
      }));
    }
    
    // Titres vides ou non descriptifs
    if (window.headingsTextAnalysis?.isTextEmptyOrNonDescriptive(heading.text)) {
      issues.push(createIssue('emptyTitle', messages.emptyTitle, {
        level: heading.level,
        text: heading.text,
        index
      }));
    }
    
    // Titres composés principalement de stopwords
    if (window.headingsTextAnalysis?.isTextMostlyStopwords(heading.text, stopwords)) {
      issues.push(createIssue('stopwordsOnly', messages.stopwordsOnly, {
        level: heading.level,
        text: heading.text,
        index
      }));
    }
  });
  
  // Analyser les relations entre titres
  detectTitleDuplicatesAndSimilarities(headings, issues);
}

/**
 * Détection des doublons et similarités
 */
function detectTitleDuplicatesAndSimilarities(headings, issues) {
  const messages = window.headingsIssuesConfig?.messages || {};
  
  // Titres dupliqués
  const duplicates = window.headingsTextAnalysis?.findDuplicateTitles(headings) || [];
  duplicates.forEach(duplicate => {
    issues.push(createIssue('duplicateTitle', messages.duplicateTitle, {
      text: duplicate.text,
      count: duplicate.count,
      indices: duplicate.indices
    }));
  });
  
  // Titres similaires
  const similarPairs = window.headingsTextAnalysis?.findSimilarTitles(headings) || [];
  similarPairs.forEach(pair => {
    issues.push(createIssue('similarTitles', messages.similarTitles, {
      text1: pair.text1,
      text2: pair.text2,
      index1: pair.index1,
      index2: pair.index2,
      similarity: Math.round(pair.similarity * 100) / 100
    }));
  });
}

/**
 * Créer un objet issue standardisé
 */
function createIssue(type, messageConfig, params) {
  if (!messageConfig) {
    console.warn(`Configuration manquante pour le type d'issue: ${type}`);
    return null;
  }
  
  // Remplacer les placeholders dans le message
  let message = messageConfig.message || '';
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  return {
    type,
    severity: messageConfig.severity,
    title: messageConfig.title,
    message,
    weight: messageConfig.weight || 1,
    params,
    timestamp: Date.now()
  };
}

/**
 * 4. Calcul des scores de sévérité
 */
function calculateSeverityScores(issues) {
  const severityWeights = { '🔴': 5, '🟡': 3, '🟢': 1 };
  
  let criticalScore = 0;
  let warningScore = 0;
  let suggestionScore = 0;
  
  issues.forEach(issue => {
    const weight = issue.weight || severityWeights[issue.severity] || 1;
    
    switch (issue.severity) {
      case '🔴':
        criticalScore += weight;
        break;
      case '🟡':
        warningScore += weight;
        break;
      case '🟢':
        suggestionScore += weight;
        break;
    }
  });
  
  const totalScore = criticalScore + warningScore + suggestionScore;
  
  return {
    critical: criticalScore,
    warning: warningScore,
    suggestion: suggestionScore,
    total: totalScore
  };
}

/**
 * 5. Génération du résumé global
 */
function generateGlobalSummary(issues, scores) {
  const criticalCount = issues.filter(i => i.severity === '🔴').length;
  const warningCount = issues.filter(i => i.severity === '🟡').length;
  const suggestionCount = issues.filter(i => i.severity === '🟢').length;
  
  let globalStatus = '';
  let globalMessage = '';
  
  if (scores.critical > 0) {
    globalStatus = '🔴';
    globalMessage = `Problèmes critiques détectés (${criticalCount})`;
  } else if (scores.warning > 0) {
    globalStatus = '🟡';
    globalMessage = `Problèmes de hiérarchie/déséquilibre (${warningCount})`;
  } else if (scores.suggestion > 0) {
    globalStatus = '🟢';
    globalMessage = `Quelques optimisations possibles (${suggestionCount})`;
  } else {
    globalStatus = '✅';
    globalMessage = 'Structure des headings conforme';
  }
  
  // Top 3 issues les plus importantes
  const topIssues = issues
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 3);
  
  return {
    status: globalStatus,
    message: globalMessage,
    totalIssues: issues.length,
    breakdown: {
      critical: criticalCount,
      warning: warningCount,
      suggestion: suggestionCount
    },
    topIssues,
    scores
  };
}

// Exposer les fonctions principales
window.headingsIssuesDetector = {
  analyzeHeadingIssues,
  detectBasicStructureIssues,
  detectHierarchyIssues,
  detectQuantitativeImbalances,
  detectTextualQualityIssues,
  calculateSeverityScores,
  generateGlobalSummary
}; 