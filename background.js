// Import required modules
importScripts(
  'privacy_analyzer.js',
  'recommendations.js',
  'cvss_calculator.js',
  'utils.js'
);

// Global state
let isAnalysisEnabled = false;
let analysisInterval = null;

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(function () {
  alert('Privacy Settings Analyzer extension installed');

  // Set default state
  chrome.storage.local.set({
    'privacyAnalysisEnabled': false,
    'lastAnalysisData': null,
    'lastRecommendations': null
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    case 'enablePrivacyAnalysis':
      enableAnalysis();
      sendResponse({ success: true });
      break;

    case 'disablePrivacyAnalysis':
      disableAnalysis();
      sendResponse({ success: true });
      break;

    case 'analyzePrivacy':
      analyzePrivacySettings().then(data => {
        sendResponse(data);
      });
      // Return true to indicate we'll respond asynchronously
      return true;

    case 'applyRecommendations':
      applyRecommendations(request.recommendations).then(result => {
        sendResponse(result);
      });
      // Return true to indicate we'll respond asynchronously
      return true;
  }
});

// Restore state when extension starts
chrome.storage.local.get(['privacyAnalysisEnabled'], function (result) {
  if (result.privacyAnalysisEnabled) {
    enableAnalysis();
  }
});

// Function to enable privacy analysis
function enableAnalysis() {
  if (isAnalysisEnabled) return;

  isAnalysisEnabled = true;

  // Run initial analysis
  analyzePrivacySettings();

  // Set up periodic analysis (every 30 minutes)
  analysisInterval = setInterval(analyzePrivacySettings, 30 * 60 * 1000);
}

// Function to disable privacy analysis
function disableAnalysis() {
  isAnalysisEnabled = false;

  if (analysisInterval) {
    clearInterval(analysisInterval);
    analysisInterval = null;
  }
}

// Main function to analyze privacy settings
async function analyzePrivacySettings() {
  try {
    console.log('Analyzing privacy settings...');   // display a spinner that shows the extension is working

    // Get current privacy settings
    const settings = await PrivacyAnalyzer.getCurrentSettings();

    // Analyze risks based on settings
    const risks = await PrivacyAnalyzer.analyzeRisks(settings);

    // Calculate CVSS scores for each risk
    const risksWithScores = risks.map(risk => {
      const cvssData = CVSSCalculator.calculateScore(risk);
      return {
        ...risk,
        cvssScore: cvssData.score,
        cvssVector: cvssData.vector,
        severity: cvssData.severity
      };
    });

    // Generate recommendations
    const recommendations = RecommendationsEngine.generateRecommendations(settings, risksWithScores);

    // Prepare analysis data
    const analysisData = {
      timestamp: new Date().toISOString(),
      settings: settings,
      risks: risksWithScores
    };

    // Save to storage
    chrome.storage.local.set({
      'lastAnalysisData': analysisData,
      'lastRecommendations': recommendations
    });

    return {
      success: true,
      analysisData: analysisData,
      recommendations: recommendations
    };
  } catch (error) {
    console.error('Error analyzing privacy settings:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to apply recommended settings
async function applyRecommendations(recommendations) {
  try {
    console.log('Applying recommended settings...');

    // Get current settings first
    const currentSettings = await PrivacyAnalyzer.getCurrentSettings();

    // Apply each recommendation
    for (const rec of recommendations) {
      await RecommendationsEngine.applySetting(rec, currentSettings);
    }

    return { success: true };
  } catch (error) {
    console.error('Error applying recommendations:', error);
    return {
      success: false,
      error: error.message
    };
  }
}