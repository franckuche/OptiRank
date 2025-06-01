/**
 * OptiRank - Module d'analyse des titres (headings) - Configuration
 * Ce fichier contient les constantes et configurations pour l'analyse des titres
 */

// Configuration pour l'analyse des pixels
const PIXEL_CONFIG = {
  // Seuils optimaux pour chaque niveau de heading (en pixels)
  thresholds: {
    h1: { min: 300, optimal: 450, max: 600 },
    h2: { min: 250, optimal: 400, max: 550 },
    h3: { min: 200, optimal: 350, max: 500 },
    h4: { min: 150, optimal: 300, max: 450 },
    h5: { min: 100, optimal: 250, max: 400 },
    h6: { min: 100, optimal: 200, max: 350 }
  },
  
  // Couleurs pour les différents statuts
  colors: {
    tooShort: '#FFA500', // Orange
    optimal: '#8CE071',  // Vert
    tooLong: '#FF5A5F',  // Rouge
    unknown: '#767676'   // Gris
  },
  
  // Écran de référence pour l'adaptation responsive
  referenceScreenWidth: 1920
};

// Configuration pour l'analyse de structure
const STRUCTURE_CONFIG = {
  // Couleurs pour les différents niveaux de titre
  headingColors: {
    1: '#FF5A5F', // Rouge - Primary
    2: '#00A699', // Turquoise - Secondary
    3: '#FC642D', // Orange - Accent
    4: '#007A87', // Bleu foncé
    5: '#8CE071', // Vert
    6: '#7B0051'  // Violet
  },
  
  // Couleur pour les titres manquants
  missingHeadingColor: '#FFA500' // Orange
};

// Configuration pour les messages et textes
const TEXT_CONFIG = {
  errors: {
    containerNotFound: 'Conteneur non trouvé',
    invalidData: 'Données invalides',
    analyzerNotAvailable: 'Analyseur non disponible'
  },
  
  statuses: {
    tooShort: 'Titre trop court',
    optimal: 'Longueur optimale',
    tooLong: 'Titre trop long',
    unknown: 'Type de titre non reconnu'
  },
  
  hierarchy: {
    missingHeading: 'Titre H{level} manquant',
    hierarchyIssue: 'Problème de hiérarchie',
    missingLevels: 'Il manque {count} niveau(x) intermédiaire(s)',
    jumpMessage: 'Saut de H{from} à H{to}'
  },
  
  labels: {
    missing: 'Manquant',
    width: 'Largeur',
    optimal: 'Optimal'
  }
};

// Exposer les configurations
window.headingsConfig = {
  pixel: PIXEL_CONFIG,
  structure: STRUCTURE_CONFIG,
  text: TEXT_CONFIG
};
