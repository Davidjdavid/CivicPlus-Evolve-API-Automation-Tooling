# CivicPlus Evolve API Automation Tooling

A local Node.js tool with a small web GUI for bulk-importing website content into CivicPlus Evolve sites via the Evolve REST API — instead of manually creating hundreds or thousands of articles, staff records, FAQs, etc. through the CMS UI.

## What it does

1. You prep an Excel workbook (`EvolveUploads.xlsx`) with one sheet per content type.
2. Start the local server (`node index.js`, or the included `.bat` on Windows) — it serves a simple dashboard at `http://localhost:4000`.
3. Enter the target Evolve site's API URL and an access token, then click the button for the content type you want to upload.
4. The server reads the matching sheet from the workbook, maps each row into the JSON payload shape the Evolve API expects, and POSTs the records to the site in batches of 10, reporting how many were processed.

## Supported content types

Each maps to a specific sheet (by index) in `EvolveUploads.xlsx`:

| Upload type | Sheet index | Notes |
|---|---|---|
| Articles | 0 | Title, content, content type, tags, categories |
| Resources | 1 | Department contact info, address, hours, website link |
| FAQs | 2 | Question/answer pairs |
| Staff | 3 | Name, title, contact info, bio |
| Departments | 4 | Department contact info and hours |
| Quick Links | 5 | Link records |
| News | 6 | News title/text (date range currently hardcoded, see Known limitations) |
| Calendar | 7 | Event name, date, time, details |
| Agendas & Minutes | 8 | Department-linked agenda records |
| Facilities | 9 | Facility name |

## Project structure

| File | Purpose |
|---|---|
| `index.js` | Express server: serves the GUI, exposes a single dynamic `POST /upload/:type` route, reads the relevant Excel sheet, maps rows to Evolve API payloads, and batches the upload |
| `index.html` | Front-end dashboard, URL/token inputs plus one button per content type |
| `style.css` | Styling for the dashboard |
| `EvolveUploads.xlsx` | The source data workbook, one sheet per content type, column headers matching the fields each `mapPayload` function expects |
| `CivicPlus Evolve Article Import.bat` | Windows convenience script, kills any existing `node.exe`, starts the server, and opens the dashboard in a browser |

## Requirements

```
npm install express xlsx
```

## Usage

**Windows:** double-click `CivicPlus Evolve Article Import.bat`, it starts the server and opens `http://localhost:4000` automatically.

**Manual:**
```
node index.js
```
Then open `http://localhost:4000` in a browser.

In the dashboard:
1. Enter the destination site's API URL and bearer token.
2. Click the button for the content type you want to import (data is read from the matching sheet in `EvolveUploads.xlsx`, which must be in the same folder as `index.js`).
3. Watch the results field for a completion count, or an error if something fails.

## Adding a new content type

Content types are configured in one place, the `uploadConfig` object in `index.js`. Add a new entry with a `sheetIndex` and a `mapPayload` function describing how to turn an Excel row into the API payload, then add a matching button in `index.html`. No new routes needed, the single `/upload/:type` route handles all types generically.

## Known limitations

A few fields are explicitly marked `//FIX LATER` in the code and are currently stubbed with empty values or placeholders rather than pulled from the spreadsheet:
- **Staff**: `department` is always uploaded as an empty array.
- **Departments**: `parentdepartment` and `staffdirectory` are always empty arrays.
- **News**: `newsdate` uses a hardcoded date range, and `newsasset` is always empty.
- **Calendar**: `attachments`, `url-link`, and `submission-pdf` are hardcoded/empty rather than sourced from the sheet.

`index.html` also currently contains two copies of the page markup concatenated together (an older single-button version followed by the current multi-button version), worth cleaning up since only the second copy is actually used by the browser.
