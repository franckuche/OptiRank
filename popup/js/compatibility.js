// Script de compatibilité pour éviter les erreurs de référence
// Variables globales pour éviter les erreurs de référence
window.progressValue = window.progressValue || 0;
window.linkIsDofollow = window.linkIsDofollow || function() { return true; };

// Gestion des connexions au background
function safeConnect() {
  try {
    if (chrome && chrome.runtime && chrome.runtime.connect) {
      return chrome.runtime.connect();
    }
  } catch(e) {
    console.log('Extension context invalidated, safe connect used');
  }
  return { postMessage: function() {}, disconnect: function() {} };
}

window.safeConnect = safeConnect;

// GESTION LARGEUR PLEINE POUR ONGLET TEST2 - VERSION AMÉLIORÉE
function updateTest2FullWidth() {
  const test2Tab = document.getElementById('test2');
  const body = document.body;
  
  console.log('🔍 Vérification test2:', {
    test2Tab: !!test2Tab,
    hasActiveClass: test2Tab ? test2Tab.classList.contains('active') : false,
    bodyHasTest2Active: body.classList.contains('test2-active')
  });
  
  if (test2Tab && test2Tab.classList.contains('active')) {
    body.classList.add('test2-active');
    console.log('✅ Mode largeur pleine ACTIVÉ pour test2');
    
    // Debug : vérifier les styles appliqués
    setTimeout(() => {
      const contentWidth = document.querySelector('.content')?.offsetWidth;
      const bodyWidth = body.offsetWidth;
      console.log('📐 Largeurs:', { contentWidth, bodyWidth });
    }, 100);
  } else {
    body.classList.remove('test2-active');
    console.log('❌ Mode largeur pleine DÉSACTIVÉ');
  }
}

// Observer les changements d'onglets pour test2
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const target = mutation.target;
      if (target.id === 'test2' || target.classList.contains('tab-content')) {
        console.log('🔄 Changement détecté sur:', target.id);
        updateTest2FullWidth();
      }
    }
  });
});

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initialisation système largeur test2');
  
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => {
    observer.observe(tab, { attributes: true, attributeFilter: ['class'] });
  });
  
  // Vérification initiale
  updateTest2FullWidth();
  
  // Observer aussi les boutons d'onglets
  const tabButtons = document.querySelectorAll('.tab-link');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      console.log('🖱️ Clic sur onglet:', tabId);
      setTimeout(updateTest2FullWidth, 200); // Délai pour laisser le temps à l'onglet de s'activer
    });
  });
});

// Backup : écouter TOUS les clics
document.addEventListener('click', function(e) {
  const tabLink = e.target.closest('[data-tab]');
  if (tabLink) {
    const tabId = tabLink.getAttribute('data-tab');
    console.log('🎯 Détection clic onglet:', tabId);
    setTimeout(updateTest2FullWidth, 50);
    setTimeout(updateTest2FullWidth, 200);
  }
}); 