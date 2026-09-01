// In-memory TTL cache in front of the schema endpoints. Schemas are app-wide, so
// we fetch each list once per site and reuse it across all content types in the
// same run (uploading 10 types to one site => 1 /schemas call instead of 10).
// null results are NOT cached, so a transient failure is retried next time.
//
// Exports: getSchemaNames, getSchemaFields

const { fetchSchemaNames, fetchSchemaFieldMap } = require('./civicplusApi');

const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;
const schemaCache = new Map();      // siteURL -> { names, expires }
const schemaFieldCache = new Map(); // `${site}::${schema}` -> { map, expires }

async function getSchemaNames(siteURL, accessToken) {
    const cached = schemaCache.get(siteURL);
    if (cached && cached.expires > Date.now()) return cached.names;

    const names = await fetchSchemaNames(siteURL, accessToken);
    if (names) schemaCache.set(siteURL, { names, expires: Date.now() + SCHEMA_CACHE_TTL_MS });
    return names; // don't cache null — retry next time
}

async function getSchemaFields(siteURL, schema, accessToken) {
    const cacheKey = `${siteURL}::${schema}`;
    const cached = schemaFieldCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.map;

    const map = await fetchSchemaFieldMap(siteURL, schema, accessToken);
    if (map) schemaFieldCache.set(cacheKey, { map, expires: Date.now() + SCHEMA_CACHE_TTL_MS });
    return map; // don't cache null — retry next time
}

module.exports = {
    getSchemaNames,
    getSchemaFields,
};
