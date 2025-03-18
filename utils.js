// Utility functions for the Privacy Settings Analyzer extension

const Utils = {
  // Deep clone an object
  deepClone: function (obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Format a date nicely
  formatDate: function (date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  },

  // Safe getter for nested objects
  getNestedProperty: function (obj, path, defaultValue = null) {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === undefined || result === null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }

    return result === undefined ? defaultValue : result;
  },

  // Convert a severity string to a color
  severityToColor: function (severity) {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return '#7C0A02'; // Dark red
      case 'HIGH': return '#F44336';     // Red
      case 'MEDIUM': return '#FFC107';   // Amber
      case 'LOW': return '#4CAF50';      // Green
      case 'NONE': return '#9E9E9E';     // Grey
      default: return '#9E9E9E';         // Grey
    }
  },

  // Convert a CVSS score to a severity
  cvssToSeverity: function (cvssScore) {
    if (cvssScore >= 9.0) return 'CRITICAL';
    if (cvssScore >= 7.0) return 'HIGH';
    if (cvssScore >= 4.0) return 'MEDIUM';
    if (cvssScore >= 0.1) return 'LOW';
    return 'NONE';
  },

  // Check if an extension has permission to access a specific URL
  hasPermissionForUrl: function (extension, url) {
    if (!extension.permissions || !extension.permissions.length) {
      return false;
    }

    // Convert URL to domain for matching
    let domain;
    try {
      domain = new URL(url).hostname;
    } catch (e) {
      return false;
    }

    // Check for host permissions
    if (extension.hostPermissions) {
      for (const permission of extension.hostPermissions) {
        // Handle wildcard permissions
        if (permission === '<all_urls>') {
          return true;
        }

        // Convert permission pattern to regex
        const pattern = permission
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/^https?:\/\//, '');

        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(domain)) {
          return true;
        }
      }
    }

    return false;
  },

  // Compare two objects and find differences
  findDifferences: function (obj1, obj2) {
    const diffs = {};

    // Compare all keys in obj1
    for (const key in obj1) {
      if (obj1.hasOwnProperty(key)) {
        if (typeof obj1[key] === 'object' && obj1[key] !== null && !Array.isArray(obj1[key])) {
          // Recursively compare nested objects
          if (obj2 && typeof obj2[key] === 'object' && !Array.isArray(obj2[key])) {
            const nestedDiffs = this.findDifferences(obj1[key], obj2[key]);
            if (Object.keys(nestedDiffs).length > 0) {
              diffs[key] = nestedDiffs;
            }
          } else if (!obj2 || obj2[key] === undefined) {
            diffs[key] = { old: obj1[key], new: undefined };
          } else {
            diffs[key] = { old: obj1[key], new: obj2[key] };
          }
        } else if (!obj2 || !this.isEqual(obj1[key], obj2[key])) {
          diffs[key] = { old: obj1[key], new: obj2 ? obj2[key] : undefined };
        }
      }
    }

    // Check for keys in obj2 that aren't in obj1
    for (const key in obj2) {
      if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
        diffs[key] = { old: undefined, new: obj2[key] };
      }
    }

    return diffs;
  },

  // Check if two values are equal
  isEqual: function (val1, val2) {
    if (val1 === val2) return true;

    // Handle arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;

      for (let i = 0; i < val1.length; i++) {
        if (!this.isEqual(val1[i], val2[i])) return false;
      }

      return true;
    }

    // Handle objects
    if (typeof val1 === 'object' && val1 !== null &&
      typeof val2 === 'object' && val2 !== null) {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);

      if (keys1.length !== keys2.length) return false;

      for (const key of keys1) {
        if (!keys2.includes(key) || !this.isEqual(val1[key], val2[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }
};