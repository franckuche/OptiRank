/**
 * @fileoverview OptiRank - Module de styles et d'interface utilisateur
 * Ce module est responsable de la gestion des styles et de l'interface utilisateur.
 * 
 * @module ui/styles
 * @author OptiRank Team
 * @version 1.1.0
 */

// Styles pour les différents types de liens
const linkStyles = {
  valid: {
    color: '#00b894',
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    border: '1px solid #00b894'
  },
  broken: {
    color: '#d63031',
    backgroundColor: 'rgba(214, 48, 49, 0.1)',
    border: '1px solid #d63031'
  },
  redirect: {
    color: '#fdcb6e',
    backgroundColor: 'rgba(253, 203, 110, 0.1)',
    border: '1px solid #fdcb6e'
  },
  nofollow: {
    color: '#6c5ce7',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    border: '1px solid #6c5ce7'
  },
  skipped: {
    color: '#636e72',
    backgroundColor: 'rgba(99, 110, 114, 0.1)',
    border: '1px solid #636e72'
  }
};

// Appliquer les styles à un élément de lien
function applyLinkStyle(linkElement, status) {
  if (!linkElement || !status || !linkStyles[status]) {
    return;
  }
  
  const style = linkStyles[status];
  
  // Créer un badge pour le lien
  const badge = document.createElement('span');
  badge.className = `optirank-badge optirank-${status}`;
  badge.textContent = status.charAt(0).toUpperCase();
  badge.style.color = style.color;
  badge.style.backgroundColor = style.backgroundColor;
  badge.style.border = style.border;
  badge.style.borderRadius = '50%';
  badge.style.width = '16px';
  badge.style.height = '16px';
  badge.style.display = 'inline-flex';
  badge.style.alignItems = 'center';
  badge.style.justifyContent = 'center';
  badge.style.fontSize = '10px';
  badge.style.fontWeight = 'bold';
  badge.style.marginLeft = '4px';
  badge.style.position = 'relative';
  badge.style.top = '-1px';
  
  // Ajouter le badge à côté du lien
  linkElement.appendChild(badge);
  
  // Ajouter une bordure au lien lui-même
  linkElement.style.borderBottom = style.border;
}

// Exporter les fonctions et variables
window.OptiRankStyles = {
  linkStyles,
  applyLinkStyle
};

console.log('OptiRank: Styles module loaded');
