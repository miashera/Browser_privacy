const RecommendationsEngine = {
    // Generate recommendations based on settings and identified risks
    generateRecommendations: function(settings, risks) {
      const recommendations = [];
      
      // Cookie recommendations
      if (settings.cookies.enabled && settings.thirdPartyCookies.allowed) {
        recommendations.push({
          id: 'block-third-party-cookies',
          title: 'Block Third-Party Cookies',
          description: 'Blocking third-party cookies prevents websites from tracking you across different sites.',
          setting: 'thirdPartyCookies',
          value: false,
          impact: 'HIGH',
          difficulty: 'LOW',
          applied: false
        });
      }
      
      // Tracking protection recommendations
      if (!settings.trackers.blocked && settings.trackers.controlledBy !== 'not_controllable') {
        recommendations.push({
          id: 'enable-tracking-protection',
          title: 'Enable Tracking Protection',
          description: 'Tracking protection blocks known trackers from collecting information about your browsing behavior.',
          setting: 'trackingProtection',
          value: true,
          impact: 'HIGH',
          difficulty: 'LOW',
          applied: false
        });
      }
      
      // Fingerprinting protection recommendations
      if (!settings.fingerprinting.protected && settings.fingerprinting.controlledBy !== 'not_controllable') {
        recommendations.push({
          id: 'enable-fingerprinting-protection',
          title: 'Enable Fingerprinting Protection',
          description: 'Fingerprinting protection prevents websites from identifying you based on your browser configuration.',
          setting: 'fingerprintingProtection',
          value: true,
          impact: 'HIGH',
          difficulty: 'LOW',
          applied: false
        });
      }
      
      // Extension recommendations
      if (settings.extensions.highRiskCount > 0) {
        recommendations.push({
          id: 'review-high-risk-extensions',
          title: 'Review High-Risk Extensions',
          description: `Review and consider removing ${settings.extensions.highRiskCount} extension(s) with high-risk permissions.`,
          setting: 'manualAction',
          value: null,
          impact: 'HIGH',
          difficulty: 'MEDIUM',
          applied: false,
          extensionIds: settings.extensions.highRiskExtensions.map(ext => ext.id)
        });
      }
      
      // Clear browsing data recommendation
      recommendations.push({
        id: 'clear-browsing-data',
        title: 'Clear Browsing Data Regularly',
        description: 'Regularly clearing cookies, cache, and browsing history can help reduce tracking.',
        setting: 'manualAction',
        value: null,
        impact: 'MEDIUM',
        difficulty: 'LOW',
        applied: false
      });
      
      return recommendations;
    },
    
    // Apply a recommended setting
    applySetting: async function(recommendation, currentSettings) {
      if (recommendation.applied) {
        return true; // Already applied
      }
      
      switch (recommendation.id) {
        case 'block-third-party-cookies':
          if (chrome.privacy && chrome.privacy.websites && chrome.privacy.websites.thirdPartyCookiesAllowed) {
            await this.setPrivacySetting(chrome.privacy.websites.thirdPartyCookiesAllowed, false);
          }
          break;
          
        case 'enable-tracking-protection':
          if (chrome.privacy && chrome.privacy.websites && chrome.privacy.websites.trackingProtectionEnabled) {
            await this.setPrivacySetting(chrome.privacy.websites.trackingProtectionEnabled, true);
          }
          break;
          
        case 'enable-fingerprinting-protection':
          if (chrome.privacy && chrome.privacy.websites && chrome.privacy.websites.fingerprintingProtection) {
            await this.setPrivacySetting(chrome.privacy.websites.fingerprintingProtection, true);
          }
          break;
          
        // For manual actions, we can't actually apply them automatically
        case 'review-high-risk-extensions':
        case 'clear-browsing-data':
          // These require user action, but we'll mark as "applied" to acknowledge
          break;
          
        default:
          console.warn(`Unknown recommendation ID: ${recommendation.id}`);
          return false;
      }
      
      // Mark as applied
      recommendation.applied = true;
      return true;
    },
    
    // Helper method to set a privacy setting
    setPrivacySetting: function(setting, value) {
      return new Promise((resolve, reject) => {
        if (!setting || typeof setting.set !== 'function') {
          resolve(false);
          return;
        }
        
        setting.set({ value: value }, function() {
          if (chrome.runtime.lastError) {
            console.error('Error setting privacy setting:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    }
  };