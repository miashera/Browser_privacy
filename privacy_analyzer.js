const PrivacyAnalyzer = {
  // Get current browser privacy settings
  getCurrentSettings: async function () {
    try {
      const settings = {    // this is what the extension checks for to give recommendations
        cookies: {},
        thirdPartyCookies: {},
        trackers: {},
        fingerprinting: {},
        localStorage: {},
        permissions: {},
        extensions: {}
      };

      // Get cookie settings
      if (chrome.privacy && chrome.privacy.websites) {
        const cookieSettings = await this.getPrivacySetting(chrome.privacy.websites.cookieConfig);
        settings.cookies = {
          enabled: cookieSettings.value.behavior !== 'block_all',
          thirdPartyBlocked: cookieSettings.value.behavior === 'block_third_party' ||
            cookieSettings.value.behavior === 'block_third_party_tracking',
          controlledBy: cookieSettings.levelOfControl
        };

        // Get third-party cookies settings
        const thirdPartyCookieSettings = await this.getPrivacySetting(chrome.privacy.websites.thirdPartyCookiesAllowed);
        settings.thirdPartyCookies = {
          allowed: thirdPartyCookieSettings.value,
          controlledBy: thirdPartyCookieSettings.levelOfControl
        }
        // I'm assuming that we do something when the 2 if's execute but nothing is done
      }

      // Get tracker settings if applicable
      if (chrome.privacy && chrome.privacy.websites && chrome.privacy.websites.trackingProtectionEnabled) {
        const trackerSettings = await this.getPrivacySetting(chrome.privacy.websites.trackingProtectionEnabled);
        settings.trackers = {
          blocked: trackerSettings.value,
          controlledBy: trackerSettings.levelOfControl
        };
      } else {
        settings.trackers = {
          blocked: false,
          controlledBy: 'not_controllable'
        };
      }

      // Get fingerprinting protection settings if applicable
      if (chrome.privacy && chrome.privacy.websites && chrome.privacy.websites.fingerprintingProtection) {
        const fingerprintingSettings = await this.getPrivacySetting(chrome.privacy.websites.fingerprintingProtection);
        settings.fingerprinting = {
          protected: fingerprintingSettings.value,
          controlledBy: fingerprintingSettings.levelOfControl
        };
      } else {
        settings.fingerprinting = {
          protected: false,
          controlledBy: 'not_controllable'
        };
      }

      // Get localStorage settings
      if (chrome.privacy && chrome.privacy.websites && chrome.privacy.websites.localStorageEnabled) {
        const localStorageSettings = await this.getPrivacySetting(chrome.privacy.websites.localStorageEnabled);
        settings.localStorage = {
          enabled: localStorageSettings.value,
          controlledBy: localStorageSettings.levelOfControl
        };
      } else {
        // Assume localStorage is enabled if not controllable
        settings.localStorage = {
          enabled: true,
          controlledBy: 'not_controllable'
        };
      }

      // Get extension permissions
      if (chrome.management) {
        try {
          const extensions = await this.getExtensions();
          settings.extensions = {
            count: extensions.length,
            highRiskCount: extensions.filter(ext => this.isHighRiskExtension(ext)).length,   // is it any or all of the listed permissions
            highRiskExtensions: extensions.filter(ext => this.isHighRiskExtension(ext))
          };
        } catch (e) {
          console.error('Error getting extensions:', e);
          settings.extensions = {
            count: 0,
            highRiskCount: 0,
            highRiskExtensions: []
          };
        }
      }

      // Get site permissions
      settings.permissions = await this.getSitePermissions();

      return settings;
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      throw error;
    }
  },

  // Helper method to get a privacy setting
  getPrivacySetting: function (setting) {
    return new Promise((resolve, reject) => {
      if (!setting || typeof setting.get !== 'function') {  // why a function?
        resolve({
          value: null,
          levelOfControl: 'not_controllable'
        });
        return;
      }

      setting.get({}, function (details) {
        resolve(details);
      });
    });
  },

  // Get installed extensions
  getExtensions: function () {
    return new Promise((resolve, reject) => {
      if (!chrome.management || typeof chrome.management.getAll !== 'function') {
        resolve([]);
        return;
      }

      chrome.management.getAll(function (extensions) {
        resolve(extensions);
      });
    });
  },

  // Check if an extension is potentially high risk
  isHighRiskExtension: function (extension) {
    // Check for extensions with broad permissions
    const highRiskPermissions = [
      'tabs',
      'webNavigation',
      'webRequest',
      'hiskies',
      'stotory',
      'coorage',
      'downloads',
      'clipboardRead',
      'clipboardWrite',
      'browsingData'
    ];

    // Count how many high-risk permissions the extension has
    let highRiskPermissionCount = 0;
    if (extension.permissions) {
      highRiskPermissionCount = extension.permissions.filter(
        perm => highRiskPermissions.includes(perm)
      ).length;
    }

    // Consider an extension high risk if it has 3 or more high-risk permissions
    return highRiskPermissionCount >= 3;
  },

  // Get site permissions
  getSitePermissions: function () {
    // This is a placeholder since Chrome extensions can't directly enumerate site permissions
    // In a real extension, you might track this information over time
    return Promise.resolve({
      locationAccess: false,
      cameraAccess: false,
      microphoneAccess: false,
      notificationAccess: false
    });
  },

  // Analyze risks based on current settings
  analyzeRisks: async function (settings) {
    const risks = [];

    // Check cookie risks
    if (settings.cookies.enabled) {
      risks.push({
        id: 'cookies-enabled',
        name: 'Cookies Enabled',
        description: 'Cookies are enabled in your browser, which allows websites to store information about your browsing session and preferences. This can be used for tracking.',
        impact: 'MEDIUM',
        exploitability: 'HIGH',
        remediationLevel: 'QUICK_FIX',
        confidentialityImpact: 'LOW',
        integrityImpact: 'NONE',
        availabilityImpact: 'NONE'
      });

      // Check third-party cookie risks
      if (settings.thirdPartyCookies.allowed) {
        risks.push({
          id: 'third-party-cookies-allowed',
          name: 'Third-Party Cookies Allowed',
          description: 'Third-party cookies are currently allowed, which enables cross-site tracking of your browsing activities.',
          impact: 'HIGH',
          exploitability: 'HIGH',
          remediationLevel: 'QUICK_FIX',
          confidentialityImpact: 'HIGH',
          integrityImpact: 'NONE',
          availabilityImpact: 'NONE'
        });
      }
    }

    // Check tracking protection
    if (!settings.trackers.blocked) {
      risks.push({
        id: 'trackers-not-blocked',
        name: 'Tracking Protection Disabled',
        description: 'Tracking protection is not enabled, allowing websites to use various tracking technologies to monitor your online activities.',
        impact: 'HIGH',
        exploitability: 'HIGH',
        remediationLevel: 'QUICK_FIX',
        confidentialityImpact: 'HIGH',
        integrityImpact: 'LOW',
        availabilityImpact: 'NONE'
      });
    }

    // Check fingerprinting protection
    if (!settings.fingerprinting.protected) {
      risks.push({
        id: 'fingerprinting-not-protected',
        name: 'Fingerprinting Protection Disabled',
        description: 'Browser fingerprinting protection is not enabled. Websites can identify you based on your browser configuration, even without cookies.',
        impact: 'HIGH',
        exploitability: 'MEDIUM',
        remediationLevel: 'QUICK_FIX',
        confidentialityImpact: 'HIGH',
        integrityImpact: 'LOW',
        availabilityImpact: 'NONE'
      });
    }

    // Check high-risk extensions
    if (settings.extensions.highRiskCount > 0) {
      risks.push({
        id: 'high-risk-extensions',
        name: 'High-Risk Extensions Installed',
        description: `You have ${settings.extensions.highRiskCount} extension(s) with potentially risky permissions that can access and modify your browsing data.`,
        impact: 'HIGH',
        exploitability: 'MEDIUM',
        remediationLevel: 'WORKAROUND',
        confidentialityImpact: 'HIGH',
        integrityImpact: 'HIGH',
        availabilityImpact: 'LOW'
      });
    }

    return risks;
  }
};