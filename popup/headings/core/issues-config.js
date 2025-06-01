/**
 * OptiRank - Module d'analyse des titres (headings) - Configuration des Issues
 * Ce fichier contient les configurations pour l'analyse avancée des problèmes de structure
 */

// Configuration des seuils de détection
const ISSUES_CONFIG = {
  // Seuils pour les longueurs de titres
  textLength: {
    minCharsByLevel: { 1: 20, 2: 15, 3: 10, 4: 5, 5: 5, 6: 5 },
    maxCharsByLevel: { 1: 60, 2: 50, 3: 50, 4: 40, 5: 40, 6: 40 }
  },
  
  // Seuils pour les ratios de déséquilibre
  ratios: {
    maxRatioWarning: 5,    // Plus de 5 H3 pour 1 H2 → warning
    maxRatioCritical: 10,  // Plus de 10 H3 pour 1 H2 → critique
    maxOccurrences: 5      // Nombre max d'occurrences avant critique
  },
  
  // Profondeur vs contenu
  depth: {
    shortContentWordLimit: 200,  // Moins de 200 mots = contenu court
    veryShortContentWordLimit: 100, // Moins de 100 mots = très court
    longContentWordLimit: 2000,  // Plus de 2000 mots = contenu long
    maxDepthForShort: 3,         // Max H3 pour contenu court
    maxDepthForVeryShort: 2,     // Max H2 pour contenu très court
    minDepthForLong: 3           // Min H3 pour contenu long
  },
  
  // Détection de similarité textuelle
  similarity: {
    levenshteinThreshold: 0.2,   // Distance relative < 0.2 = très similaire
    minLengthForSimilarity: 5    // Minimum 5 caractères pour tester similarité
  },
  
  // Stopwords français pour détection de titres non descriptifs
  stopwords: [
    'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour',
    'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus',
    'par', 'grand', 'en', 'une', 'être', 'et', 'de', 'il', 'avoir', 'ne', 'je', 'son'
  ]
};

// Configuration des messages d'erreur et descriptions
const ISSUES_MESSAGES = {
  // 3.1 Problèmes de structure de base
  noHeadingsAtAll: {
    severity: '🔴',
    title: 'Aucun titre détecté',
    message: 'La page ne comporte aucune balise H1 à H6. Ajouter au moins un H1 pour identifier la thématique principale.',
    weight: 5
  },
  
  noH1WithOthers: {
    severity: '🔴', 
    title: 'H1 manquant avec autres titres',
    message: 'Aucun H1, mais d\'autres Hx existent. Chaque page doit impérativement débuter par un H1 unique.',
    weight: 5
  },
  
  multipleH1: {
    severity: '🔴',
    title: 'Plusieurs H1 détectés',
    message: '{count} balises H1 détectées. Conserver impérativement un seul H1. Convertir les autres en H2/H3.',
    weight: 5
  },
  
  firstNotH1: {
    severity: '🔴',
    title: 'Premier titre n\'est pas H1',
    message: 'Le premier titre est un H{level} au lieu d\'un H1. Placer un H1 avant ou transformer le titre existant.',
    weight: 5
  },
  
  // 3.2 Problèmes de hiérarchie
  skipDown: {
    severity: '🟡',
    title: 'Saut hiérarchique descendant',
    message: 'Saut H{prevLevel}→H{currLevel} sans H{expectedLevel}. Ajouter un titre intermédiaire ou restructurer.',
    weight: 3
  },
  
  skipUp: {
    severity: '🟡',
    title: 'Saut hiérarchique ascendant', 
    message: 'Descente brutale H{prevLevel}→H{currLevel}. Vérifier si ce H{currLevel} doit plutôt être H{expectedLevel}.',
    weight: 3
  },
  
  orphanHeading: {
    severity: '🔴',
    title: 'Titre orphelin sans parent',
    message: 'H{level} sans parent H{expectedParent}. Insérer ou rattacher à un H{expectedParent}.',
    weight: 5
  },
  
  multipleSkipLevels: {
    severity: '🔴',
    title: 'Saut multiple de niveaux',
    message: 'Saut multiple H{prevLevel}→H{currLevel}. Il manque plusieurs niveaux intermédiaires.',
    weight: 5
  },
  
  // 3.3 Déséquilibres quantitatifs
  ratioImbalance: {
    severity: '🟡',
    title: 'Déséquilibre de ratio',
    message: '{childCount} H{childLevel} pour {parentCount} H{parentLevel}. Créer davantage de H{parentLevel} ou regrouper.',
    weight: 3
  },
  
  depthMismatchShort: {
    severity: '🟡',
    title: 'Profondeur excessive pour contenu court',
    message: 'Page courte (~{wordCount} mots) mais niveau max H{maxLevel}. Simplifier la structure.',
    weight: 2
  },
  
  depthMismatchLong: {
    severity: '🟡', 
    title: 'Structure trop simple pour contenu long',
    message: 'Page riche (~{wordCount} mots) mais profondeur limitée (H{maxLevel}). Structurer davantage.',
    weight: 2
  },
  
  // 3.4 Qualité textuelle
  tooShort: {
    severity: '🟡',
    title: 'Titre trop court',
    message: 'Titre H{level} trop court ({length} car.). Ajouter plus de contexte ou mots-clés.',
    weight: 2
  },
  
  tooLong: {
    severity: '🟡',
    title: 'Titre trop long', 
    message: 'Titre H{level} très long ({length} car.). Condenser pour la lisibilité et le SEO.',
    weight: 2
  },
  
  emptyTitle: {
    severity: '🟡',
    title: 'Titre vide ou non descriptif',
    message: 'Titre H{level} vide ou non descriptif. Ajouter du texte pertinent.',
    weight: 3
  },
  
  stopwordsOnly: {
    severity: '🟡',
    title: 'Titre avec mots vides uniquement',
    message: 'Titre H{level} contient uniquement des mots vides. Rendre le titre plus significatif.',
    weight: 2
  },
  
  duplicateTitle: {
    severity: '🟡',
    title: 'Titre dupliqué',
    message: 'Titre dupliqué \'{text}\' ({count}x). Utiliser des versions distinctes.',
    weight: 2
  },
  
  similarTitles: {
    severity: '🟡',
    title: 'Titres très similaires',
    message: 'Titres très similaires. Risque de confusion pour lecteurs et crawlers.',
    weight: 1
  }
};

// Exposer les configurations
window.headingsIssuesConfig = {
  detection: ISSUES_CONFIG,
  messages: ISSUES_MESSAGES
}; 