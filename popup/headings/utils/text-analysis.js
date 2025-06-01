/**
 * OptiRank - Module d'analyse des titres (headings) - Utilitaires d'analyse textuelle
 * Ce fichier contient les fonctions utilitaires pour l'analyse de la qualité des titres
 */

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * @param {string} a - Première chaîne
 * @param {string} b - Deuxième chaîne
 * @return {number} Distance de Levenshtein
 */
function calculateLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialiser la première ligne
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialiser la première colonne
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Remplir la matrice
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // suppression
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calcule la similarité relative entre deux chaînes (0 = identiques, 1 = complètement différentes)
 * @param {string} text1 - Premier texte
 * @param {string} text2 - Deuxième texte
 * @return {number} Ratio de similarité (0-1)
 */
function calculateSimilarityRatio(text1, text2) {
  const distance = calculateLevenshteinDistance(text1.toLowerCase(), text2.toLowerCase());
  const maxLength = Math.max(text1.length, text2.length);
  return maxLength === 0 ? 0 : distance / maxLength;
}

/**
 * Vérifie si un titre est composé principalement de stopwords
 * @param {string} text - Texte à analyser
 * @param {Array} stopwords - Liste des mots vides
 * @param {number} threshold - Seuil de pourcentage (défaut: 0.5)
 * @return {boolean} True si le titre est principalement composé de stopwords
 */
function isTextMostlyStopwords(text, stopwords = [], threshold = 0.5) {
  if (!text || text.trim().length === 0) return true;
  
  // Nettoyer et diviser le texte en mots
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remplacer la ponctuation par des espaces
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  if (words.length === 0) return true;
  
  // Compter les stopwords
  const stopwordCount = words.filter(word => stopwords.includes(word)).length;
  const stopwordRatio = stopwordCount / words.length;
  
  return stopwordRatio >= threshold;
}

/**
 * Détecte si un titre est vide ou non descriptif
 * @param {string} text - Texte à analyser
 * @return {boolean} True si le titre est vide ou non descriptif
 */
function isTextEmptyOrNonDescriptive(text) {
  if (!text || text.trim().length === 0) return true;
  
  // Vérifier si le texte ne contient que des chiffres ou symboles
  const hasLetters = /[a-zA-ZÀ-ÿ]/.test(text);
  if (!hasLetters) return true;
  
  // Vérifier les patterns non descriptifs communs
  const nonDescriptivePatterns = [
    /^[\s\-_\.]+$/,          // Que des espaces, tirets, underscores, points
    /^(titre|title|heading)[\s\d]*$/i,  // "Titre", "Title", "Heading" + optionnel chiffres
    /^(section|chapitre)[\s\d]*$/i,     // "Section", "Chapitre" + optionnel chiffres
    /^[\d\.\-\s]+$/,         // Que des chiffres, points, tirets, espaces
    /^(a|an|the|le|la|les|un|une|des)[\s]*$/i  // Articles seuls
  ];
  
  return nonDescriptivePatterns.some(pattern => pattern.test(text.trim()));
}

/**
 * Estime le nombre de mots dans une page (approximation basée sur le contenu textuel)
 * @return {number} Nombre estimé de mots
 */
function estimatePageWordCount() {
  try {
    // Sélectionner les éléments contenant du texte significatif
    const textElements = document.querySelectorAll('p, article, section, div, main, aside');
    
    let totalText = '';
    
    textElements.forEach(element => {
      // Éviter le contenu des scripts, styles, et éléments cachés
      if (element.tagName.toLowerCase() === 'script' || 
          element.tagName.toLowerCase() === 'style' ||
          element.tagName.toLowerCase() === 'noscript') {
        return;
      }
      
      // Vérifier si l'élément est visible
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return;
      }
      
      // Ajouter le contenu textuel
      const text = element.textContent || element.innerText || '';
      totalText += ' ' + text;
    });
    
    // Nettoyer et compter les mots
    const words = totalText
      .replace(/\s+/g, ' ')           // Normaliser les espaces
      .replace(/[^\w\s]/g, ' ')       // Remplacer la ponctuation par des espaces
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    return words.length;
  } catch (error) {
    console.warn('Erreur lors de l\'estimation du nombre de mots:', error);
    return 0;
  }
}

/**
 * Trouve les titres dupliqués dans une liste
 * @param {Array} headings - Liste des titres avec propriété 'text'
 * @return {Array} Liste des titres dupliqués avec leur fréquence
 */
function findDuplicateTitles(headings) {
  if (!headings || headings.length === 0) return [];
  
  const titleCounts = {};
  const duplicates = [];
  
  // Compter les occurrences de chaque titre (insensible à la casse)
  headings.forEach((heading, index) => {
    const normalizedText = heading.text.toLowerCase().trim();
    
    if (!titleCounts[normalizedText]) {
      titleCounts[normalizedText] = {
        originalText: heading.text,
        count: 0,
        indices: []
      };
    }
    
    titleCounts[normalizedText].count++;
    titleCounts[normalizedText].indices.push(index);
  });
  
  // Identifier les doublons
  Object.entries(titleCounts).forEach(([normalizedText, data]) => {
    if (data.count > 1) {
      duplicates.push({
        text: data.originalText,
        normalizedText: normalizedText,
        count: data.count,
        indices: data.indices
      });
    }
  });
  
  return duplicates;
}

/**
 * Trouve les titres très similaires dans une liste
 * @param {Array} headings - Liste des titres avec propriété 'text'
 * @param {number} threshold - Seuil de similarité (défaut: 0.2)
 * @return {Array} Liste des paires de titres similaires
 */
function findSimilarTitles(headings, threshold = 0.2) {
  if (!headings || headings.length < 2) return [];
  
  const config = window.headingsIssuesConfig?.detection?.similarity;
  const minLength = config?.minLengthForSimilarity || 5;
  const actualThreshold = config?.levenshteinThreshold || threshold;
  
  const similarPairs = [];
  
  for (let i = 0; i < headings.length; i++) {
    for (let j = i + 1; j < headings.length; j++) {
      const text1 = headings[i].text;
      const text2 = headings[j].text;
      
      // Ignorer les textes trop courts
      if (text1.length < minLength || text2.length < minLength) continue;
      
      // Calculer la similarité
      const similarity = calculateSimilarityRatio(text1, text2);
      
      if (similarity <= actualThreshold) {
        similarPairs.push({
          index1: i,
          index2: j,
          text1: text1,
          text2: text2,
          similarity: similarity,
          distance: calculateLevenshteinDistance(text1.toLowerCase(), text2.toLowerCase())
        });
      }
    }
  }
  
  return similarPairs;
}

/**
 * Valide la longueur d'un titre selon son niveau
 * @param {string} text - Texte du titre
 * @param {number} level - Niveau du titre (1-6)
 * @return {Object} Résultat de la validation {isValid, isTooShort, isTooLong, length}
 */
function validateTitleLength(text, level) {
  const config = window.headingsIssuesConfig?.detection?.textLength;
  const minChars = config?.minCharsByLevel?.[level] || 5;
  const maxChars = config?.maxCharsByLevel?.[level] || 60;
  
  const length = text ? text.length : 0;
  
  return {
    isValid: length >= minChars && length <= maxChars,
    isTooShort: length < minChars,
    isTooLong: length > maxChars,
    length: length,
    minExpected: minChars,
    maxExpected: maxChars
  };
}

// Exposer les fonctions utilitaires
window.headingsTextAnalysis = {
  calculateLevenshteinDistance,
  calculateSimilarityRatio,
  isTextMostlyStopwords,
  isTextEmptyOrNonDescriptive,
  estimatePageWordCount,
  findDuplicateTitles,
  findSimilarTitles,
  validateTitleLength
}; 