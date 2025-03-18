const ReportGenerator = {
  // Generate a comprehensive report
  generateReport: function (analysisData, recommendations) {
    if (!analysisData || !analysisData.risks) {
      return {
        html: '<p>No analysis data available to generate report.</p>',
        text: 'No analysis data available to generate report.'
      };
    }

    const timestamp = new Date(analysisData.timestamp).toLocaleString();
    const risks = analysisData.risks;

    // Calculate risk statistics
    const totalRisks = risks.length;
    const criticalRisks = risks.filter(risk => risk.severity === 'CRITICAL').length;
    const highRisks = risks.filter(risk => risk.severity === 'HIGH').length;
    const mediumRisks = risks.filter(risk => risk.severity === 'MEDIUM').length;
    const lowRisks = risks.filter(risk => risk.severity === 'LOW').length;

    // Generate HTML report
    let htmlReport = `
        <div class="report-header">
          <h3>Privacy Analysis Report</h3>
          <p>Generated on: ${timestamp}</p>
        </div>
        
        <div class="report-summary">
          <h4>Summary</h4>
          <p>Total risks identified: ${totalRisks}</p>
          <ul>
            <li>Critical: ${criticalRisks}</li>
            <li>High: ${highRisks}</li>
            <li>Medium: ${mediumRisks}</li>
            <li>Low: ${lowRisks}</li>
          </ul>
        </div>
        
        <div class="report-risks">
          <h4>Identified Risks</h4>
          <table class="risk-table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Severity</th>
                <th>CVSS Score</th>
              </tr>
            </thead>
            <tbody>
      `;

    risks.forEach(risk => {
      const severityClass = risk.severity.toLowerCase();
      htmlReport += `
          <tr class="${severityClass}">
            <td>${risk.name}</td>
            <td>${risk.severity}</td>
            <td>${risk.cvssScore.toFixed(1)}</td>
          </tr>
        `;
    });

    htmlReport += `
            </tbody>
          </table>
        </div>
      `;

    // Add recommendations section if available
    if (recommendations && recommendations.length > 0) {
      htmlReport += `
          <div class="report-recommendations">
            <h4>Recommendations</h4>
            <ul>
        `;

      recommendations.forEach(rec => {
        htmlReport += `
            <li>
              <strong>${rec.title}</strong>: ${rec.description}
              ${rec.applied ? ' <span class="applied">(Applied)</span>' : ''}
            </li>
          `;
      });

      htmlReport += `
            </ul>
          </div>
        `;
    }

    // Add details for each risk
    htmlReport += `
        <div class="report-details">
          <h4>Detailed Risk Analysis</h4>
      `;

    risks.forEach(risk => {
      htmlReport += `
          <div class="risk-detail">
            <h5>${risk.name} <span class="${risk.severity.toLowerCase()}">(${risk.severity})</span></h5>
            <p>${risk.description}</p>
            <p><strong>CVSS:</strong> ${risk.cvssVector}</p>
            <p><strong>Score:</strong> ${risk.cvssScore.toFixed(1)}</p>
          </div>
        `;
    });

    htmlReport += `
        </div>
      `;

    // Plain text version for download
    let textReport = `PRIVACY ANALYSIS REPORT
  Generated on: ${timestamp}
  
  SUMMARY
  Total risks identified: ${totalRisks}
  - Critical: ${criticalRisks}
  - High: ${highRisks}
  - Medium: ${mediumRisks}
  - Low: ${lowRisks}
  
  IDENTIFIED RISKS
  `;

    risks.forEach(risk => {
      textReport += `
  ${risk.name} (${risk.severity}) - CVSS: ${risk.cvssScore.toFixed(1)}
  `;
    });

    if (recommendations && recommendations.length > 0) {
      textReport += `
  RECOMMENDATIONS
  `;
      recommendations.forEach(rec => {
        textReport += `
  - ${rec.title}: ${rec.description}${rec.applied ? ' (Applied)' : ''}`;
      });
    }

    textReport += `
  
  DETAILED RISK ANALYSIS
  `;

    risks.forEach(risk => {
      textReport += `
  ${risk.name} (${risk.severity})
  Description: ${risk.description}
  CVSS: ${risk.cvssVector}
  Score: ${risk.cvssScore.toFixed(1)}
  
  `;
    });

    return {
      html: htmlReport,
      text: textReport
    };
  }
};