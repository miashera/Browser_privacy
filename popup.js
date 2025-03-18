document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const privacyToggle = document.getElementById('privacyToggle');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const analysisLoader = document.getElementById('analysisLoader');
    const analysisResults = document.getElementById('analysisResults');
    const detailedAnalysis = document.getElementById('detailedAnalysis');
    const recommendationsList = document.getElementById('recommendationsList');
    const applyRecommendationsBtn = document.getElementById('applyRecommendations');
    const generateReportBtn = document.getElementById('generateReport');
    const downloadReportBtn = document.getElementById('downloadReport');
    const reportContent = document.getElementById('reportContent');
    const overallRiskLevel = document.getElementById('overallRiskLevel');
    const overallRiskLabel = document.getElementById('overallRiskLabel');
    
    let analysisData = null;
    let recommendationsData = null;
    
    // Load initial state
    chrome.storage.local.get(['privacyAnalysisEnabled', 'lastAnalysisData', 'lastRecommendations'], function(result) {
      privacyToggle.checked = result.privacyAnalysisEnabled || false;
      
      if (result.lastAnalysisData) {  // if lastAnalysisData exists
        analysisData = result.lastAnalysisData;
        displayAnalysisResults(analysisData);
      }
      
      if (result.lastRecommendations) { // if lastRecommendations exists
        recommendationsData = result.lastRecommendations;
        displayRecommendations(recommendationsData);
      }
      
      // Update UI state based on toggle
      updateUIState(privacyToggle.checked);
    });
    
    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    // Toggle privacy analysis
    privacyToggle.addEventListener('change', function() {
      const enabled = this.checked;
      
      // Save state
      chrome.storage.local.set({ 'privacyAnalysisEnabled': enabled });
      
      // Update UI
      updateUIState(enabled);
      
      // Notify background script
      chrome.runtime.sendMessage({ 
        action: enabled ? 'enablePrivacyAnalysis' : 'disablePrivacyAnalysis' 
      });
      
      // If enabled, trigger analysis
      if (enabled) {
        startAnalysis();
      }
    });
    
    // Apply recommendations button
    applyRecommendationsBtn.addEventListener('click', function() {
      if (!recommendationsData || recommendationsData.length === 0) return;
      
      chrome.runtime.sendMessage({ 
        action: 'applyRecommendations',
        recommendations: recommendationsData
      }, function(response) {
        if (response && response.success) {
          // Update UI to show applied changes
          recommendationsData.forEach(rec => rec.applied = true);
          displayRecommendations(recommendationsData);
          
          // Trigger re-analysis
          startAnalysis();
        }
      });
    });
    
    // Generate report button
    generateReportBtn.addEventListener('click', function() {
      if (!analysisData) {
        reportContent.innerHTML = '<p>No analysis data available. Run an analysis first.</p>';
        return;
      }
      
      const report = ReportGenerator.generateReport(analysisData, recommendationsData);
      reportContent.innerHTML = report.html;
      
      // Enable download button
      downloadReportBtn.disabled = false;
    });
    
    // Download report button
    downloadReportBtn.addEventListener('click', function() {
      if (!analysisData) return;
      
      const report = ReportGenerator.generateReport(analysisData, recommendationsData);
      const blob = new Blob([report.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'privacy_report_' + new Date().toISOString().split('T')[0] + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    
    // Helper function to start analysis
    function startAnalysis() {
      // Show loader, hide results
      analysisLoader.style.display = 'block';
      analysisResults.style.display = 'none';
      
      // Request analysis from background script
      chrome.runtime.sendMessage({ action: 'analyzePrivacy' }, function(response) {
        // Hide loader, show results
        analysisLoader.style.display = 'none';
        analysisResults.style.display = 'block';
        
        if (response && response.analysisData) {
          analysisData = response.analysisData;
          recommendationsData = response.recommendations;
          
          // Display results
          displayAnalysisResults(analysisData);
          displayRecommendations(recommendationsData);
          
          // Save results
          chrome.storage.local.set({ 
            'lastAnalysisData': analysisData,
            'lastRecommendations': recommendationsData
          });
        }
      });
    }
    
    // Helper function to update UI based on toggle state
    function updateUIState(enabled) {
      if (enabled) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.disabled = false);
        document.querySelectorAll('.action-button').forEach(btn => btn.disabled = false);
      } else {
        // Keep tab buttons enabled but disable action buttons
        document.querySelectorAll('.action-button').forEach(btn => btn.disabled = true);
      }
    }
    
    // Helper function to display analysis results
    function displayAnalysisResults(data) {
      if (!data || !data.risks || data.risks.length === 0) {
        detailedAnalysis.innerHTML = '<p>No privacy risks detected.</p>';
        return;
      }
      
      // Calculate overall risk
      const totalScore = data.risks.reduce((sum, risk) => sum + risk.cvssScore, 0);
      const avgScore = totalScore / data.risks.length;
      const percentage = (avgScore / 10) * 100;
      
      // Update risk meter
      overallRiskLevel.style.setProperty('--risk-percentage', `${percentage}%`);
      overallRiskLevel.querySelector('::after').style.left = `${percentage}%`;
      
      // Set risk label
      let riskLabel = 'Low';
      if (avgScore >= 7.0) riskLabel = 'High';
      else if (avgScore >= 4.0) riskLabel = 'Medium';
      
      overallRiskLabel.textContent = `${riskLabel} (${avgScore.toFixed(1)}/10)`;
      overallRiskLabel.className = `risk-label ${riskLabel.toLowerCase()}`;
      
      // Generate detailed analysis HTML
      let html = '';
      data.risks.forEach(risk => {
        const severityClass = risk.severity.toLowerCase();
        
        html += `
          <div class="risk-item">
            <div class="risk-header">
              <div class="risk-title">${risk.name}</div>
              <div class="risk-score ${severityClass}">${risk.cvssScore.toFixed(1)}</div>
            </div>
            <div class="risk-details">
              <p>${risk.description}</p>
              <p><strong>CVSS:</strong> ${risk.cvssVector}</p>
            </div>
          </div>
        `;
      });
      
      detailedAnalysis.innerHTML = html;
    }
    
    // Helper function to display recommendations
    function displayRecommendations(recommendations) {
      if (!recommendations || recommendations.length === 0) {
        recommendationsList.innerHTML = '<p>No recommendations available.</p>';
        return;
      }
      
      let html = '';
      recommendations.forEach(rec => {
        html += `
          <div class="recommendation-item ${rec.applied ? 'applied' : ''}">
            <div class="recommendation-header">
              <div class="recommendation-title">${rec.title}</div>
              ${rec.applied ? '<span class="applied-tag">Applied</span>' : ''}
            </div>
            <div class="recommendation-description">${rec.description}</div>
          </div>
        `;
      });
      
      recommendationsList.innerHTML = html;
    }
  });