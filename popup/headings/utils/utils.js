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
 * Fonction pour copier la structure des titres dans le presse-papier
 * Cette fonction est simplifiée et robuste
 */
function copyHeadingStructure(withAnalysis = false) {
  try {
    let textToCopy = '';
    
    // Récupérer tous les éléments de titre
    const headingElements = document.querySelectorAll('#headings-list .heading-item');
    
    // Construire le texte à partir des éléments réels
    if (headingElements.length > 0) {
      // Filtrer les éléments vides
      const validHeadings = Array.from(headingElements).filter(heading => {
        const textElement = heading.querySelector('.heading-text');
        const isEmptyMissing = textElement && textElement.classList.contains('empty-missing');
        const missingIndicator = heading.querySelector('.missing-indicator');
        
        // Inclure seulement si ce n'est pas un titre manquant vide
        return !isEmptyMissing || missingIndicator;
      });
      
      validHeadings.forEach(heading => {
        const level = heading.getAttribute('data-level') || '';
        const textElement = heading.querySelector('.heading-text');
        const missingIndicator = heading.querySelector('.missing-indicator');
        
        let text = '';
        if (textElement && !textElement.classList.contains('empty-missing')) {
          text = textElement.textContent.trim();
        } else if (missingIndicator) {
          text = `[${missingIndicator.textContent}]`;
        }
        
        if (level && text) {
          textToCopy += `H${level}: ${text}\n`;
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
