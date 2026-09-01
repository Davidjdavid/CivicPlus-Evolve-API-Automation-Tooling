// Assembles the full uploadConfig from the per-type files, then applies optional
// environment-variable overrides so new site-specific slugs / field aliases can
// be added without editing code or redeploying.
//
// THE CONFIG CONTRACT (each file in ./contentTypes exports one of these):
//   sheetIndex      Which sheet in the workbook this type reads (0-based).
//   endpoint        Schema slug, when it's the same on every site.
//   endpoints       Array of candidate slugs (preference order) when sites use
//                   different WORDS for the same type. Punctuation/casing variants
//                   are matched automatically, so only list genuinely different words.
//   standardColumns Columns the mapper already handles. ANY column NOT in this list
//                   is auto-injected into `data` as an invariant custom field
//                   ({ iv: ... }). Leave a column OUT only if it is a real invariant
//                   custom field in your schema — otherwise the API rejects the row.
//   fieldAliases    Optional { nameTheMapperEmits: ["altName", ...] } for when sites
//                   name the SAME field differently (e.g. faxnumber vs fax).
//   mapPayload      (entry, lookups) => payload object for the create API.

const { getEndpointCandidates } = require('../lib/slug');

const uploadConfig = {
    articles:    require('./contentTypes/articles'),
    resources:   require('./contentTypes/resources'),
    faqs:        require('./contentTypes/faqs'),
    staff:       require('./contentTypes/staff'),
    departments: require('./contentTypes/departments'),
    quicklinks:  require('./contentTypes/quicklinks'),
    news:        require('./contentTypes/news'),
    calendar:    require('./contentTypes/calendar'),
    agendas:     require('./contentTypes/agendas'),
    facility:    require('./contentTypes/facility'),
};

// Reference lists pulled from /api/apps/<site>/<endpoint> for EVERY type. Names
// in each sheet's PermissionSet / Categories columns are matched against these to
// fill in ids. A type can override this (e.g. `referenceData: []` to skip), but by
// default every type loads both lists so a new sheet "just works".
const DEFAULT_REFERENCE_DATA = ["permissionSet", "categories"];

// --- Optional: extend endpoint candidates without redeploying ---
//
// Set an env var per type to append site-specific slugs discovered in the field,
// e.g.  ENDPOINT_ALIASES_STAFF="employee,enhanced-employee,employe-records"
// These are appended AFTER the built-in candidates (lower preference) and still
// benefit from normalized matching.
for (const [type, cfg] of Object.entries(uploadConfig)) {
    const extra = process.env[`ENDPOINT_ALIASES_${type.toUpperCase()}`];
    if (extra) {
        const extras = extra.split(',').map(s => s.trim()).filter(Boolean);
        if (extras.length) {
            cfg.endpoints = [...getEndpointCandidates(cfg), ...extras];
            console.log(`[${type}] endpoint candidates extended via env: ${cfg.endpoints.join(', ')}`);
        }
    }
}

// --- Optional: extend field aliases without redeploying ---
//
// Set an env var per type as JSON to merge extra field aliases discovered in the
// field, e.g.  FIELD_ALIASES_DEPARTMENTS='{"faxnumber":["fax","faxno"]}'
// Merged onto (and appended to) whatever the config already declares.
for (const [type, cfg] of Object.entries(uploadConfig)) {
    const raw = process.env[`FIELD_ALIASES_${type.toUpperCase()}`];
    if (!raw) continue;
    try {
        const extra = JSON.parse(raw);
        cfg.fieldAliases = cfg.fieldAliases || {};
        for (const [key, alts] of Object.entries(extra)) {
            const existing = cfg.fieldAliases[key] || [];
            cfg.fieldAliases[key] = [...new Set([...existing, ...[].concat(alts)])];
        }
        console.log(`[${type}] field aliases extended via env.`);
    } catch (e) {
        console.warn(`Ignoring FIELD_ALIASES_${type.toUpperCase()} — not valid JSON: ${e.message}`);
    }
}

module.exports = { uploadConfig, DEFAULT_REFERENCE_DATA };
