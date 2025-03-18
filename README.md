# Browser_privacy
A browser extension add-on 

## What each file does in this project

1. **background.js**
   - Purpose: Acts as the background script for the extension, managing global state and handling communication between the popup and the browser.
   - Responsibilities:
     - Initializes the extension when installed or updated.
     - Listens for messages from the popup (chrome.runtime.onMessage) and performs actions like enabling/disabling privacy analysis, running analysis, or applying recommendations.
     - Periodically runs privacy analysis (every 30 minutes) when enabled.
     - Stores analysis results and recommendations in chrome.storage.local.

2. **popup.js**
   - Purpose: Handles the logic for the popup UI that users interact with.
   - Responsibilities:
     - Manages the state of the privacy toggle and tabs in the popup.
     - Sends messages to the background script to enable/disable analysis, run analysis, or apply recommendations.
     - Displays analysis results, recommendations, and reports in the popup.
     - Allows users to generate and download privacy reports.

3. **popup.html**
   - Purpose: Defines the structure of the popup UI.
   - Responsibilities:
     - Provides the layout for the privacy toggle, tabs (Analysis, Recommendations, Report), and buttons for generating/downloading reports.
     - Links to the necessary scripts (popup.js, cvss_calculator.js, etc.) and styles (popup.css).

4. **popup.css**
   - Purpose: Styles the popup UI.
   - Responsibilities:
     - Defines the appearance of the popup, including the toggle switch, tabs, risk meter, recommendations, and buttons.
     - Ensures the UI is visually appealing and user-friendly.

5. **privacy_analyzer.js**
   - Purpose: Analyzes the browser's current privacy settings.
   - Responsibilities:
     - Retrieves privacy-related settings (e.g., cookies, trackers, fingerprinting protection) using the chrome.privacy API.
     - Identifies risks based on the current settings (e.g., third-party cookies allowed, tracking protection disabled).
     - Provides helper methods for fetching privacy settings and analyzing risks.

6. **recommendations.js**
   - Purpose: Generates and applies recommendations to improve privacy.
   - Responsibilities:
     - Suggests actions to mitigate identified risks (e.g., block third-party cookies, enable tracking protection).
     - Provides methods to apply recommendations programmatically (e.g., using the chrome.privacy API).
     - Marks recommendations as "applied" once they are implemented.

7. **cvss_calculator.js**
   - Purpose: Calculates CVSS (Common Vulnerability Scoring System) scores for identified risks.
   - Responsibilities:
     - Converts risk data into CVSS scores and vectors based on the CVSS 3.1 specification.
     - Determines the severity of risks (e.g., LOW, MEDIUM, HIGH, CRITICAL) based on the calculated scores.
     - Provides helper methods for CVSS calculations (e.g., converting impact levels, calculating sub-scores).

8. **report_generator.js**
   - Purpose: Generates detailed privacy analysis reports.
   - Responsibilities:
     - Creates HTML and plain-text reports summarizing identified risks and recommendations.
     - Includes detailed risk analysis, CVSS scores, and recommendations in the report.
     - Formats the report for display in the popup or for download as a text file.

9. **utils.js**
   - Purpose: Provides utility functions used across the extension.
   - Responsibilities:
     - Includes helper methods for tasks like deep cloning objects, formatting dates, comparing objects, and converting severity levels to colors.
     - Contains reusable logic to simplify code in other files.

10. **manifest.json**
    - Purpose: Defines the metadata and configuration for the browser extension.
    - Responsibilities:
      - Specifies the extension's name, version, description, permissions, and entry points (e.g., background.js, popup.html).
      - Declares the permissions required by the extension (e.g., privacy, cookies, tabs).
      - Configures the extension's action (popup) and background service worker.

11. **README.md**
    - Purpose: Provides a brief description of the project.
    - Responsibilities:
      - Describes the project as a "browser extension add-on."
      - Can be expanded to include installation instructions, usage details, and developer notes.
