/**
 * OptiRank - Module d'analyse des titres (headings) - Utilitaires
 * Ce fichier contient les fonctions utilitaires pour le module d'analyse des titres
 */

// Fonction pour afficher un message d'erreur
function showError(message) {
  const errorContainer = document.getElementById('error-container');
  if (!errorContainer) {
    console.error('Headings: Conteneur d\'erreur non trouvé');
    return;
  }
  
  const errorMessage = errorContainer.querySelector('.error-message');
  
  errorMessage.textContent = message;
  errorContainer.classList.remove('hidden');
  
  // Masquer le message après 5 secondes
  setTimeout(() => {
    errorContainer.classList.add('hidden');
  }, 5000);
}

// Fonction pour afficher l'indicateur de chargement
function showLoading(message) {
  const loadingIndicator = document.getElementById('loading');
  const loadingMessage = loadingIndicator.querySelector('p');
  
  loadingMessage.textContent = message || 'Chargement en cours...';
  loadingIndicator.classList.remove('hidden');
}

// Fonction pour masquer l'indicateur de chargement
function hideLoading() {
  const loadingIndicator = document.getElementById('loading');
  loadingIndicator.classList.add('hidden');
}

// Variable pour stocker le mode de copie (avec ou sans balises)
let copyWithTags = true;

/**
 * Fonction améliorée pour nettoyer le texte des titres
 * Supprime les espaces excessifs, sauts de ligne indésirables et caractères invisibles
 */
function cleanHeadingText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    // 1. Supprimer les caractères de contrôle et invisibles (sauf espaces et retours à la ligne)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // 2. Normaliser tous les types d'espaces Unicode en espaces simples
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // 3. Remplacer TOUS les types de retours à la ligne et tabulations par des espaces
    .replace(/[\r\n\f\v\t]/g, ' ')
    // 4. Supprimer les séquences d'espaces très longues (souvent dues au HTML mal formaté)
    .replace(/\s{3,}/g, ' ')
    // 5. Remplacer les doubles espaces restants par un seul espace (appliqué plusieurs fois)
    .replace(/\s{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    // 6. Supprimer les espaces en début et fin
    .trim()
    // 7. Nettoyage final : supprimer les espaces autour des signes de ponctuation
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])\s+/g, '$1 ')
    // 8. Supprimer tout espace résiduel excessif
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fonction pour copier la structure des headings avec nettoyage amélioré
 * Cette fonction est simplifiée et robuste
 */
function copyHeadingStructure(withAnalysis = false) {
  console.log('🔥 UTILS: Copie demandée - avec analyse:', withAnalysis);
  
  try {
    let textToCopy = '';
    const headingsContainer = document.getElementById('headings-list');
    
    if (!headingsContainer) {
      console.error('Headings Utils: Conteneur des headings non trouvé');
      showCopyError();
      return;
    }
    
    const headingElements = headingsContainer.querySelectorAll('.heading-item');
    console.log('🔥 UTILS: Nombre d\'éléments trouvés:', headingElements.length);
    
    if (headingElements.length > 0) {
      // Filtrer les éléments vides et les titres manquants si pas d'analyse
      const validHeadings = Array.from(headingElements).filter(heading => {
        const textElement = heading.querySelector('.heading-text');
        const isEmptyMissing = textElement && textElement.classList.contains('empty-missing');
        const missingIndicator = heading.querySelector('.missing-indicator');
        const isMissingHeading = heading.classList.contains('missing-heading') || heading.hasAttribute('data-missing');
        
        console.log('🔥 UTILS: Examen heading:', {
          text: textElement?.textContent?.trim(),
          isEmptyMissing,
          hasMissingIndicator: !!missingIndicator,
          isMissingHeading,
          withAnalysis
        });
        
        // Si mode sans analyse, exclure TOUS les titres manquants
        if (!withAnalysis && (isMissingHeading || missingIndicator)) {
          console.log('🔥 UTILS: ❌ Exclu - titre manquant en mode sans analyse');
          return false;
        }
        
        // Inclure seulement si ce n'est pas un titre manquant vide
        const shouldInclude = !isEmptyMissing || missingIndicator;
        console.log('🔥 UTILS:', shouldInclude ? '✅ Accepté' : '❌ Exclu');
        return shouldInclude;
      });
      
      console.log('🔥 UTILS: Après filtrage:', validHeadings.length, 'titres gardés');
      
      validHeadings.forEach(heading => {
        const level = heading.getAttribute('data-level') || '';
        const textElement = heading.querySelector('.heading-text');
        const missingIndicator = heading.querySelector('.missing-indicator');
        
        let text = '';
        if (textElement && !textElement.classList.contains('empty-missing')) {
          const rawText = textElement.textContent.trim();
          text = cleanHeadingText(rawText); // NOUVEAU: Nettoyage du texte
          console.log('🔥 UTILS: Texte nettoyé:', rawText, '->', text);
        } else if (missingIndicator) {
          text = `[${missingIndicator.textContent}]`;
        }
        
        if (level && text) {
          textToCopy += `H${level}: ${text}\n`;
          console.log('🔥 UTILS: Ajouté:', `H${level}: ${text}`);
        }
      });
      
      // Ajouter l'analyse si demandée
      if (withAnalysis) {
        const issuesContainer = document.getElementById('insights-list');
        if (issuesContainer) {
          const issues = issuesContainer.querySelectorAll('.insight-item');
          if (issues.length > 0) {
            textToCopy += '\n--- ANALYSE ---\n';
            issues.forEach(issue => {
              const title = issue.querySelector('.insight-title')?.textContent || '';
              const description = issue.querySelector('.insight-description')?.textContent || '';
              if (title) {
                textToCopy += `• ${title}\n`;
                if (description) {
                  textToCopy += `  ${description}\n`;
                }
              }
            });
          }
        }
      }
    }
    
    // Si aucun contenu, utiliser un message par défaut
    if (!textToCopy.trim()) {
      textToCopy = "Aucun titre détecté sur cette page.";
    }
    
    console.log('🔥 UTILS: Texte final à copier:', textToCopy);
    
    // Méthode de secours utilisant execCommand
    function copyWithExecCommand() {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        if (document.execCommand('copy')) {
          showCopySuccess();
        } else {
          console.error('Headings: Échec de la copie avec execCommand');
          showCopyError();
        }
      } catch (err) {
        console.error('Headings: Erreur lors de la copie:', err);
        showCopyError();
      }
      
      document.body.removeChild(textArea);
    }
    
    // Essayer d'abord l'API Clipboard moderne
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showCopySuccess();
      }).catch(err => {
        console.error('Headings: Erreur lors de la copie avec Clipboard API:', err);
        copyWithExecCommand();
      });
    } else {
      copyWithExecCommand();
    }
  } catch (error) {
    console.error('Headings: Erreur lors de la copie:', error);
    showCopyError();
  }
}

// Fonction pour afficher le succès de la copie
function showCopySuccess() {
  // Récupérer le bouton de copie
  const copyButton = document.getElementById('copy-dropdown-trigger');
  if (!copyButton) {
    console.error('Headings Utils: Bouton de copie non trouvé');
    return;
  }
  
  // Sauvegarder le contenu original
  const originalContent = copyButton.innerHTML;
  
  // Appliquer les styles de succès avec animation
  copyButton.innerHTML = '<i class="fas fa-check"></i> <span>Copié!</span>';
  copyButton.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
  
  // Restaurer le bouton après délai
  setTimeout(() => {
    copyButton.innerHTML = originalContent;
    copyButton.style.background = '';
  }, 2000);
}

// Fonction pour afficher l'erreur de copie
function showCopyError() {
  const copyButton = document.getElementById('copy-dropdown-trigger');
  if (!copyButton) return;
  
  // Sauvegarder le contenu original
  const originalContent = copyButton.innerHTML;
  
  // Appliquer les styles d'erreur avec animation
  copyButton.innerHTML = '<i class="fas fa-times"></i> <span>Erreur</span>';
  copyButton.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
  
  // Restaurer le bouton après délai
  setTimeout(() => {
    copyButton.innerHTML = originalContent;
    copyButton.style.background = '';
  }, 2000);
}

// Gestion du dropdown de copie
function setupCopyDropdown() {
  const dropdownTrigger = document.getElementById('copy-dropdown-trigger');
  const dropdownMenu = document.getElementById('copy-dropdown-menu');
  const copyDropdown = document.querySelector('.copy-dropdown');
  
  if (!dropdownTrigger || !dropdownMenu || !copyDropdown) {
    console.error('Headings Utils: Éléments dropdown non trouvés');
    return;
  }
  
  // Toggle du dropdown
  dropdownTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    copyDropdown.classList.toggle('active');
  });
  
  // Fermer le dropdown en cliquant ailleurs
  document.addEventListener('click', function(e) {
    if (!copyDropdown.contains(e.target)) {
      copyDropdown.classList.remove('active');
    }
  });
  
  // Gestion des boutons du dropdown
  const copyWithAnalysisBtn = document.getElementById('copy-with-analysis');
  const copyWithoutAnalysisBtn = document.getElementById('copy-without-analysis');
  
  if (copyWithAnalysisBtn) {
    copyWithAnalysisBtn.addEventListener('click', function(e) {
      e.preventDefault();
      copyHeadingStructure(true);
      copyDropdown.classList.remove('active');
    });
  }
  
  if (copyWithoutAnalysisBtn) {
    copyWithoutAnalysisBtn.addEventListener('click', function(e) {
      e.preventDefault();
      copyHeadingStructure(false);
      copyDropdown.classList.remove('active');
    });
  }
}

// Initialiser le système
document.addEventListener('DOMContentLoaded', function() {
  console.log('Headings Utils: Initialisation du système de copie');
  setupCopyDropdown();
});

// Exposer les fonctions globalement pour l'architecture modulaire
window.headingsUtils = {
  copyHeadingStructure,
  showCopySuccess,
  showCopyError,
  setupCopyDropdown,
  showLoading,
  hideLoading,
  showError
};
