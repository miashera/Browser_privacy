const CVSSCalculator = {
    // Calculate CVSS score based on risk data
    calculateScore: function(risk) {
      // CVSS 3.1 Base Score calculation
      // https://www.first.org/cvss/v3.1/specification-document
      
      // Define metrics
      const attackVector = 'N'; // Network
      const attackComplexity = risk.exploitability === 'HIGH' ? 'L' : 'H'; // Low or High
      const privilegesRequired = 'N'; // None
      const userInteraction = 'N'; // None
      const scope = 'U'; // Unchanged
      
      // Convert impact levels to CVSS values
      const confidentialityImpact = this.convertImpactLevel(risk.confidentialityImpact || 'LOW');
      const integrityImpact = this.convertImpactLevel(risk.integrityImpact || 'NONE');
      const availabilityImpact = this.convertImpactLevel(risk.availabilityImpact || 'NONE');
      
      // Generate CVSS vector string
      const vector = `CVSS:3.1/AV:${attackVector}/AC:${attackComplexity}/PR:${privilegesRequired}/UI:${userInteraction}/S:${scope}/C:${confidentialityImpact}/I:${integrityImpact}/A:${availabilityImpact}`;
      
      // Calculate base score (simplified calculation)
      let baseScore = 0;
      
      // Impact sub-score
      const impactSubScore = 1 - (
        (1 - this.getImpactValue(confidentialityImpact)) *
        (1 - this.getImpactValue(integrityImpact)) *
        (1 - this.getImpactValue(availabilityImpact))
      );
      
      // Exploitability sub-score
      const exploitabilitySubScore = 
        this.getAttackVectorValue(attackVector) *
        this.getAttackComplexityValue(attackComplexity) *
        this.getPrivilegesRequiredValue(privilegesRequired) *
        this.getUserInteractionValue(userInteraction);
      
      // Calculate base score
      baseScore = ((0.6 * impactSubScore) + (0.4 * exploitabilitySubScore)) * 10;
      
      // Round to 1 decimal place
      baseScore = Math.round(baseScore * 10) / 10;
      
      // Determine severity
      let severity;
      if (baseScore >= 9.0) {
        severity = 'CRITICAL';
      } else if (baseScore >= 7.0) {
        severity = 'HIGH';
      } else if (baseScore >= 4.0) {
        severity = 'MEDIUM';
      } else if (baseScore >= 0.1) {
        severity = 'LOW';
      } else {
        severity = 'NONE';
      }
      
      return {
        score: baseScore,
        vector: vector,
        severity: severity
      };
    },
    
    // Convert impact level to CVSS value
    convertImpactLevel: function(level) {
      switch (level) {
        case 'HIGH': return 'H';
        case 'MEDIUM': return 'M';
        case 'LOW': return 'L';
        case 'NONE': 
        default: return 'N';
      }
    },
    
    // Get impact value for calculation
    getImpactValue: function(impact) {
      switch (impact) {
        case 'H': return 0.56;
        case 'M': return 0.22;
        case 'L': return 0.04;
        case 'N':
        default: return 0;
      }
    },
    
    // Get attack vector value
    getAttackVectorValue: function(av) {
      switch (av) {
        case 'N': return 0.85;
        case 'A': return 0.62;
        case 'L': return 0.55;
        case 'P': return 0.2;
        default: return 0.85;
      }
    },
    
    // Get attack complexity value
    getAttackComplexityValue: function(ac) {
      switch (ac) {
        case 'L': return 0.77;
        case 'H': return 0.44;
        default: return 0.77;
      }
    },
    
    // Get privileges required value
    getPrivilegesRequiredValue: function(pr) {
      switch (pr) {
        case 'N': return 0.85;
        case 'L': return 0.62;
        case 'H': return 0.27;
        default: return 0.85;
      }
    },
    
    // Get user interaction value
    getUserInteractionValue: function(ui) {
      switch (ui) {
        case 'N': return 0.85;
        case 'R': return 0.62;
        default: return 0.85;
      }
    }
  };