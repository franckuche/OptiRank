// === GESTION DU SURLIGNAGE DES LIENS PAR TYPES ===
let highlightedElements = [];

function highlightLinksByTypes(types) {
  logger.debug('🎯 Surlignage des liens par types:', types);
  
  // Supprimer le surlignage existant
  clearHighlights();
  
  if (!types || types.length === 0) {
    logger.debug('🧹 Suppression de tous les surlignages');
    return;
  }
  
  // Récupérer tous les liens de la page
  const links = Array.from(document.querySelectorAll('a'));
  
  links.forEach(link => {
    const linkData = analyzeLinkElement(link);
    
    // Vérifier si le lien correspond à l'un des types sélectionnés
    const shouldHighlight = types.some(type => {
      switch(type) {
        case 'broken':
          return linkData.status >= 400;
        case 'redirect':
          return linkData.status >= 300 && linkData.status < 400;
        case 'valid':
          return linkData.status < 300;
        case 'internal':
          return !linkData.isExternal;
        case 'external':
          return linkData.isExternal;
        case 'nofollow':
          return linkData.rel && linkData.rel.includes('nofollow');
        case 'dofollow':
          return !linkData.rel || !linkData.rel.includes('nofollow');
        case 'total':
          return true; // Surligner tous les liens
        default:
          return false;
      }
    });
    
    if (shouldHighlight) {
      highlightElement(link, types);
    }
  });
  
  logger.debugEmoji("", "✨ ${highlightedElements.length} liens surlignés");
}

function highlightElement(element, types) {
  // Créer un style de surlignage basé sur les types
  let backgroundColor = '#3b82f6'; // Bleu par défaut
  let borderColor = '#2563eb';
  
  // Déterminer la couleur principale basée sur le premier type prioritaire
  if (types.includes('broken')) {
    backgroundColor = '#ef4444';
    borderColor = '#dc2626';
  } else if (types.includes('redirect')) {
    backgroundColor = '#f59e0b';
    borderColor = '#d97706';
  } else if (types.includes('valid')) {
    backgroundColor = '#22c55e';
    borderColor = '#16a34a';
  } else if (types.includes('external')) {
    backgroundColor = '#8b5cf6';
    borderColor = '#7c3aed';
  } else if (types.includes('nofollow')) {
    backgroundColor = '#f59e0b';
    borderColor = '#d97706';
  }
  
  // Appliquer le style
  const originalStyle = element.style.cssText;
  element.style.cssText += `
    background-color: ${backgroundColor}33 !important;
    border: 2px solid ${borderColor} !important;
    box-shadow: 0 0 8px ${backgroundColor}66 !important;
    border-radius: 4px !important;
    position: relative !important;
  `;
  
  // Sauvegarder pour pouvoir nettoyer plus tard
  highlightedElements.push({
    element: element,
    originalStyle: originalStyle
  });
}

function clearHighlights() {
  highlightedElements.forEach(({ element, originalStyle }) => {
    if (element && element.parentNode) {
      element.style.cssText = originalStyle;
    }
  });
  highlightedElements = [];
}

// === ÉCOUTE DES MESSAGES POUR LE SURLIGNAGE ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlightLinksByTypes') {
    highlightLinksByTypes(request.types);
    sendResponse({ success: true });
  }
  return true;
}); 