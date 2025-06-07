# 🔍 OptiRank - Architecture de Logging

## 📋 Vue d'Ensemble

Système de logging à 3 niveaux pour extension Chrome, optimisé pour audience Dev + SEO, conforme RGPD et performant.

---

## 🎯 Architecture "Progressive Disclosure"

### **Niveau 1 : Production (Par Défaut)** 🟢
```
Mode : Silent
Audience : Utilisateurs finaux SEO
Logs : Erreurs critiques uniquement
Performance : Impact minimal
```

### **Niveau 2 : Mode Debug Utilisateur** 🔧
```
Mode : Diagnostic (Activé manuellement)
Audience : SEO + Dev troubleshooting
Logs : Informations de scan + erreurs détaillées
Performance : Impact modéré avec warning
```

### **Niveau 3 : Mode Développeur** 🛠️
```
Mode : Development (Auto-détecté)
Audience : Développeurs
Logs : Logs ultra-détaillés + performance
Performance : Pas de limitation
```

---

## 🔧 Détection des Modes

### **Mode Production** (Défaut)
```javascript
// Détection : Extension du Chrome Web Store
const isProduction = chrome.runtime.getManifest().update_url !== undefined;

// Logs autorisés :
- Erreurs critiques (anonymisées)
- Messages de status pour l'utilisateur
- Export automatique d'erreurs (pour support)
```

### **Mode Debug Utilisateur** (Manuel)
```javascript
// Activation : Toggle dans Settings
// Stockage : chrome.storage.sync.get('enableDiagnosticLogs')

// Logs autorisés :
- Messages informatifs pour SEO ("business-friendly")
- Détails des scans et erreurs
- Export des logs pour support
- Warning performance visible
```

### **Mode Développeur** (Auto)
```javascript
// Détection : Extension locale (non-packagée)
const isDevelopment = chrome.runtime.getManifest().update_url === undefined;

// Logs autorisés :
- Tous les logs techniques
- Performance timing
- Debug avancé avec stack traces
- Pas de limite de volume
```

---

## 📊 Types de Messages

### **Messages SEO (Business-Friendly)** 👥
```javascript
// ✅ Exemple SEO-friendly
"Analyse terminée : 45 liens trouvés, 3 liens brisés détectés"
"Attention : 12 liens redirigent vers HTTPS" 
"Scan en cours... 67% terminé"

// ❌ Éviter en mode SEO
"XMLHttpRequest failed with status 404 in validator.js:142"
"Promise rejection in async function scanLinks()"
"Memory usage: 45.2MB, GC triggered"
```

### **Messages Techniques (Dev-Friendly)** 🛠️
```javascript
// ✅ Messages techniques détaillés
"[CONTENT] Link validation failed: HTTP 404 at https://example.com/page"
"[SCANNER] Batch processing: 10/45 links completed (22ms average)"
"[VALIDATOR] Timeout after 5000ms for URL: https://slow-site.com"
```

---

## 🎛️ Interface Utilisateur

### **Settings Simple (Recommandé)**
```
Extension Settings > Advanced

□ Enable diagnostic logging
  ℹ️ "Provides detailed information to help troubleshoot scan issues.
      May impact performance on large websites."
  
□ Auto-export error reports
  ℹ️ "Automatically save error logs for support purposes.
      No personal data is collected."

[Export Current Logs] [Clear All Logs]
```

### **Settings Avancées (Alternative)**
```
Extension Settings > Logging

Log Level: [Silent ▼] [Diagnostic] [Expert]

□ Export error reports automatically
□ Include performance metrics  
□ Show technical details
□ Enable memory monitoring

Storage: 2.3 MB / 10 MB [Clear]
```

---

## 🛡️ Conformité RGPD

### **Données Anonymisées** ✅
```javascript
// ✅ CONFORME
logger.info('Scan completed', { 
  linksCount: 42, 
  brokenCount: 3,
  domain: 'anonymized-domain.com',
  duration: '1.2s' 
});

// ❌ NON CONFORME
logger.info('Scanning', { 
  url: 'https://private-user-site.com/personal-page',
  userAgent: navigator.userAgent,
  cookies: document.cookie 
});
```

### **Consentement Explicite** ✅
```javascript
// Premier lancement - demander permission
if (!hasAskedLoggingPermission) {
  showLoggingConsentDialog({
    title: "Améliorer OptiRank",
    message: "Acceptez-vous l'enregistrement de logs anonymes pour nous aider à améliorer l'extension ?",
    details: "Aucune donnée personnelle n'est collectée. Vous pouvez désactiver à tout moment.",
    options: ["Accepter", "Refuser", "Plus d'infos"]
  });
}
```

---

## ⚡ Optimisation Performance

### **Throttling Automatique** 🚀
```javascript
class PerformanceLogger {
  constructor() {
    this.logsPerSecond = 0;
    this.maxLogsPerSecond = 50; // Limite pour sites lourds
    this.throttleActive = false;
  }
  
  log(level, message, data) {
    if (this.shouldThrottle()) {
      this.queueLog(level, message, data);
      return;
    }
    
    this.writeLog(level, message, data);
    this.trackRate();
  }
  
  shouldThrottle() {
    // Throttle si trop de logs ou si page lourde
    return this.logsPerSecond > this.maxLogsPerSecond || 
           this.isHeavyPage();
  }
}
```

### **Cleanup Automatique** 🧹
```javascript
// Rotation automatique des logs
const MAX_LOG_ENTRIES = 1000;
const MAX_LOG_AGE_MS = 24 * 60 * 60 * 1000; // 24h

setInterval(() => {
  cleanupOldLogs();
}, 60 * 60 * 1000); // Toutes les heures
```

---

## 📤 Export Automatique d'Erreurs

### **Format d'Export** 📄
```json
{
  "extension": "OptiRank",
  "version": "1.0.0",
  "timestamp": "2025-01-07T15:30:00Z",
  "environment": "production",
  "anonymizedDomain": "example-domain.com",
  "errors": [
    {
      "level": "ERROR",
      "message": "Link validation timeout",
      "context": {
        "linksCount": 150,
        "timeout": "5000ms",
        "browser": "Chrome 120"
      },
      "timestamp": "2025-01-07T15:29:45Z"
    }
  ],
  "stats": {
    "totalLinks": 150,
    "scanDuration": "12.5s",
    "memoryUsage": "45MB"
  }
}
```

### **Déclencheurs d'Export** 🚨
```javascript
// Export automatique sur :
1. Erreur critique (crash, timeout majeur)
2. 5+ erreurs en 1 minute
3. Demande manuelle utilisateur
4. Avant fermeture si erreurs présentes

// Stockage local chiffré
chrome.storage.local.set({
  'error_reports': encrypted(errorReport)
});
```

---

## 🔄 Implémentation par Phases

### **Phase 1 : Foundation** (Semaine 1)
- [ ] Logging conditionnel par environnement
- [ ] Anonymisation des URLs
- [ ] Mode silencieux par défaut en production
- [ ] Export des erreurs critiques

### **Phase 2 : User Control** (Semaine 2)
- [ ] Toggle diagnostic dans settings
- [ ] Messages SEO-friendly vs techniques
- [ ] Interface d'export manuel
- [ ] Warning performance

### **Phase 3 : Advanced** (Semaine 3)
- [ ] Throttling automatique
- [ ] Cleanup automatique
- [ ] Métriques de performance
- [ ] Mode expert pour développeurs

### **Phase 4 : Polish** (Semaine 4)
- [ ] Interface settings raffinée
- [ ] Documentation utilisateur
- [ ] Tests de conformité RGPD
- [ ] Optimisation performance finale

---

## 🧪 Tests de Validation

### **Conformité RGPD** ✅
```bash
# Tests automatisés
- Aucune URL personnelle dans les logs
- Pas de tracking utilisateur
- Consentement explicite documenté
- Export anonymisé vérifié
```

### **Performance** ⚡
```bash
# Benchmarks
- Impact < 5% sur temps de chargement
- Mémoire < 10MB même après 1h utilisation
- Logs/seconde < 50 en throttling
- Cleanup automatique fonctionnel
```

### **Expérience Utilisateur** 👤
```bash
# Tests utilisateurs
- SEO comprennent les messages
- Dev trouvent les infos techniques
- Settings claires et accessibles
- Export facile en cas de problème
```

---

## 📚 Références

- [Chrome Extension Logging Best Practices](https://developer.chrome.com/docs/extensions/)
- [GDPR Compliance Guidelines](https://gdpr.eu/)
- [Web Performance Monitoring](https://web.dev/performance/)
- [Error Reporting Standards](https://tools.ietf.org/html/rfc7807)

---

## 🎯 Prochaines Étapes

1. **Validation** : Approuver l'architecture proposée
2. **Priorités** : Choisir Phase 1 ou développement complet
3. **Messages** : Définir ton préféré (business vs technique)
4. **Timeline** : Planifier l'implémentation

**Questions ?** Besoin de clarifications sur un aspect ? 🤔 