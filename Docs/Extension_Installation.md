# Ascend Ingestion Bridge - Browser Extension

This extension allows recruiters and job seekers to ingest job postings directly from LinkedIn and Indeed into the Ascend ATS pipeline with one click.

## Installation Instructions (Chrome/Opera/Safari)

### 1. Enable Developer Mode
- Open your browser and navigate to the extensions management page:
  - **Chrome**: `chrome://extensions`
  - **Opera**: `opera://extensions`
  - **Safari**: Enable the "Develop" menu in Settings > Advanced, then choose "Show Extension Builder".

- Toggle the **Developer mode** switch in the top right corner.

### 2. Load the Extension
- Click the **Load unpacked** button.
- Navigate to your project directory and select the `/extension` folder.
- The "Ascend ATS Ingestion Bridge" icon should now appear in your extension list.

### 3. Usage
- Go to any job posting on **LinkedIn** (e.g., `linkedin.com/jobs/view/...`) or **Indeed**.
- Look for the blue **"Ascend to ATS"** button near the "Apply" or "Save" actions.
- Click the button to open the **Review Overlay**.
- Verify the extracted Position Title and Company Name, then click **Confirm & Ingest**.
- The job will be instantly parsed by Ascend AI and added to your pipeline.

## Technical Details
- **Scraping**: Uses source-specific DOM selectors for maximum accuracy.
- **AI Processing**: Data is sent to the `/api/ingest-job` endpoint for Gemini-powered deep parsing.
- **Security**: Extension requires `host_permissions` for LinkedIn, Indeed, and the Ascend server domain.
