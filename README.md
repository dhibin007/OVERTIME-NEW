# Employee Hours Calculator (PWA with Google Login + Google Sheets Sync)

## Features
- Google Login required for editing
- Save button stores data locally and syncs to Google Sheets
- Shareable link (read-only) → opens `view.html`
- View shows only Date, Site Name, and Number of Team Members
- Sundays marked yellow, missing times red
- Export CSV with date range
- PWA: Installable on mobile (icon + offline support)

## Setup
1. Create a **Google Cloud Project** → Enable **Google Sheets API**
2. Create an **OAuth2 Client ID** (Web) → copy into `index.html` (`YOUR_GOOGLE_CLIENT_ID`)
3. Create a **Google Sheet** → copy Sheet ID
4. Deploy a **Google Apps Script Web App** with the provided code → replace `YOUR_APPS_SCRIPT_WEBAPP_URL`
5. Replace placeholders in `script.js` and `view.html`
