# Evolve Content Uploader

A small web tool + Express server that reads content from an Excel workbook (one
sheet per content type) and uploads it to a CivicPlus/Evolve site via the
`content.civicplus.com` API.

## Running

```bash
npm install
npm start          # starts on http://localhost:4000 (set PORT to change)
```

Requires **Node 18+** (the server uses the built-in global `fetch`).

Open the page, enter the site URL + API token, choose your `.xlsx`, and click the
button for the content type you want to upload.

## Project structure

```
src/
├── server.js                  Entry point — starts the HTTP server.
├── app.js                     Builds the Express app (JSON, static files, routes).
├── routes/
│   └── upload.js              multer + POST /upload/:type; parses the file, calls the engine.
├── config/
│   ├── index.js               Assembles uploadConfig + applies env overrides. The config contract lives here.
│   └── contentTypes/          One file per content type (articles, resources, faqs, ...).
├── services/
│   ├── civicplusApi.js        Raw HTTP calls to the CivicPlus API (no caching, no logic).
│   ├── schemaCache.js         TTL cache in front of the schema endpoints.
│   └── uploadEngine.js        processUpload — the orchestration that ties it all together.
├── lib/
│   ├── mapHelpers.js          Pure helpers used by the config files (tags, ids, categories).
│   ├── slug.js                Endpoint slug resolution + shared normalizeSlug.
│   └── fields.js              Per-site field-name resolution/conforming.
└── public/
    ├── index.html             The upload page.
    └── style.css
```

The dependency flow is one-directional: `server → app → routes → services → config/lib`.
`lib/*` depends on nothing else of ours, which is why it's the safest place to unit-test.

## Spreadsheet format

One workbook, one sheet per content type, **in this order** (the `sheetIndex` in
each config file):

| Index | Content type | Sheet |
|------:|--------------|-------|
| 0 | Articles | article |
| 1 | Resources | resource-directory |
| 2 | FAQs | faq |
| 3 | Staff | employee / enhanced-employee |
| 4 | Departments | enhanced-department / department |
| 5 | Quick links | bpquicklink |
| 6 | News | newsflash |
| 7 | Calendar | event |
| 8 | Agendas & minutes | gh-agenda |
| 9 | Facilities | facility |

Column rules:

- Each sheet's columns are mapped by that type's `mapPayload`.
- Any column **not** listed in a type's `standardColumns` is injected into `data`
  as an invariant custom field (`{ iv: value }`). This only works if a field with
  that **exact** name exists in the schema and is invariant — otherwise the API
  rejects the whole row. Leave a column out of `standardColumns` only if it is a
  real invariant custom field.
- A `Publish` column value of `Yes` publishes the item after it's created.
- `PermissionSet` and `Categories` columns are matched by name against the site's
  reference lists to fill in ids.

## Adding / changing a content type

Edit the matching file in `src/config/contentTypes/`. To add a new type, drop a
new file there and register it in `src/config/index.js`.

- **Wrong slug on a site?** Use `endpoints: ["a", "b"]` (preference order) instead
  of `endpoint: "a"`. Only list genuinely different words — casing/punctuation
  variants are matched automatically.
- **A field is named differently on a site?** Add it to `fieldAliases`, e.g.
  `fieldAliases: { faxnumber: ["fax"] }`.

## Environment variables (all optional)

| Variable | Effect |
|----------|--------|
| `PORT` | Server port (default `4000`). |
| `ENDPOINT_ALIASES_<TYPE>` | Comma-separated extra slugs to try for a type, e.g. `ENDPOINT_ALIASES_STAFF="employee,employe-records"`. |
| `FIELD_ALIASES_<TYPE>` | JSON of extra field aliases, e.g. `FIELD_ALIASES_DEPARTMENTS='{"faxnumber":["fax","faxno"]}'`. |
| `CONFORM_PARTITIONS` | Also fix `{ iv }` vs `{ en }` wrappers to match each field's partitioning. |
| `DISABLE_SCHEMA_CONFORM` | Skip reading the schema for field-name conforming (send mapper output as-is). |
| `DEBUG_PAYLOAD` | Log the full JSON payload sent for every row. |

`<TYPE>` is the upper-cased config key, e.g. `DEPARTMENTS`, `QUICKLINKS`.

## Importing pieces for tests

Everything is a plain module, so tests can pull in exactly what they need:

```js
const { uploadConfig } = require('./src/config');
const { processUpload } = require('./src/services/uploadEngine');
const app = require('./src/app');            // for supertest, etc.
```
