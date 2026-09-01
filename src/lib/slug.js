// Endpoint (schema slug) resolution + the shared string-normalisation helper.
//
// The same content type is spelled differently per site: staff might be
// "employee", "enhanced-employee" or "enhancedemployee". Rather than hardcode
// one slug, each config lists the slugs it could be and we pick the one that
// actually exists on the target site (from /schemas). Punctuation/casing
// variants are matched automatically, so you only ever list genuinely different
// WORDS in the candidate array.
//
// Exports: normalizeSlug, getEndpointCandidates, resolveEndpoint, suggestClosestSchemas

// Loose comparison used for BOTH slugs and field names: lowercase and strip
// everything but a-z/0-9, so "enhanced-employee"/"enhancedEmployee" collapse to
// one key, and "faxNumber"/"fax_number" do too. Per-site punctuation/casing
// stops mattering; you only list genuinely different WORDS.
const normalizeSlug = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// A type may list several candidate slugs (order = preference).
// Back-compat: a single `endpoint: "..."` string still works.
const getEndpointCandidates = (config) =>
    config.endpoints?.length ? config.endpoints
    : config.endpoint ? [config.endpoint]
    : [];

// Pick the real slug for THIS site from the schemas that actually exist.
// Exact match wins; otherwise fall back to a normalized match. Returns the
// slug as the site spells it, or null if none of the candidates exist. Only
// ever looks up OUR candidate keys in the schema set — it never scans for
// substrings, so it can't silently grab an unrelated schema.
function resolveEndpoint(candidates, schemaNames) {
    for (const c of candidates) {
        if (schemaNames.includes(c)) return c;            // exact
    }
    const byNorm = new Map(schemaNames.map(n => [normalizeSlug(n), n]));
    for (const c of candidates) {
        const hit = byNorm.get(normalizeSlug(c));         // ignore dashes/case
        if (hit) return hit;
    }
    return null;
}

// For error messages ONLY: schemas whose name looks related to what we wanted,
// so a brand-new variant tells you exactly what to add to endpoints[]. This is
// the only place substring matching happens, and it never picks anything — it
// just builds a helpful hint.
function suggestClosestSchemas(candidates, schemaNames, limit = 6) {
    const cores = candidates.map(normalizeSlug);
    return schemaNames
        .map(name => {
            const n = normalizeSlug(name);
            let score = 0;
            for (const core of cores) {
                if (n.includes(core) || core.includes(n)) {
                    score = Math.max(score, Math.min(n.length, core.length));
                }
            }
            return { name, score };
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.name);
}

module.exports = {
    normalizeSlug,
    getEndpointCandidates,
    resolveEndpoint,
    suggestClosestSchemas,
};
