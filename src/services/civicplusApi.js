// Low-level HTTP client for the CivicPlus content API. Every function here does
// network I/O and returns plain data (Maps / arrays / null) — no caching, no
// Express, no business logic. Caching lives in schemaCache.js.
//
// Exports: fetchReferenceData, fetchSchemaNames, fetchSchemaFieldMap

const { normalizeSlug } = require('../lib/slug');

/**
 * GET https://content.civicplus.com/api/apps/<site>/<endpoint>
 * @returns {Promise<Map<string,string>>} lowercased name -> id, for matching.
 * @throws if the request fails (caller decides how to surface it).
 */
async function fetchReferenceData(siteURL, endpoint, accessToken) {
    const apiURL = `https://content.civicplus.com/api/apps/${siteURL}/${endpoint}`;

    const response = await fetch(apiURL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to load ${endpoint}: HTTP ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const lookup = new Map();

    (json.items || []).forEach(item => {
        if (item?.name) lookup.set(String(item.name).trim().toLowerCase(), item.id);
    });

    console.log(`Loaded ${lookup.size} ${endpoint} entries for ${siteURL}`);
    return lookup;
}

/**
 * Best-effort list of the schema (content-type) slugs that actually exist in an
 * app. Used both to resolve which candidate slug this site uses and to turn an
 * opaque 404 into "here are the names that exist."
 * @returns {Promise<string[]|null>} names, or null if the list can't be read
 *          (caller then falls back to the first candidate slug).
 */
async function fetchSchemaNames(siteURL, accessToken) {
    try {
        const response = await fetch(`https://content.civicplus.com/api/apps/${siteURL}/schemas`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        if (!response.ok) return null;
        const json = await response.json();
        const list = Array.isArray(json) ? json : (json.items || []);
        const names = list
            .map(s => (typeof s === 'string' ? s : (s?.name || s?.slug)))
            .filter(Boolean);
        return names.length ? names : null;
    } catch {
        return null;
    }
}

/**
 * Read the resolved schema's fields as a map: normalizedName -> { name, partitioning }.
 * "partitioning" is "invariant" (=> { iv }) or a language (=> { en }); we only need
 * the binary distinction.
 * @returns {Promise<Map<string,{name:string,partitioning:string}>|null>} null if the
 *          fields can't be read (field conforming is then skipped, mapper output sent as-is).
 */
async function fetchSchemaFieldMap(siteURL, schema, accessToken) {
    try {
        const response = await fetch(`https://content.civicplus.com/api/apps/${siteURL}/schemas/${schema}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        if (!response.ok) return null;
        const json = await response.json();

        // Be liberal about where the field array lives across API shapes.
        const fields = json.fields || json?.schema?.fields || json?.data?.fields;
        if (!Array.isArray(fields) || !fields.length) return null;

        const map = new Map();
        for (const f of fields) {
            const name = f?.name || f?.slug;
            if (!name) continue;
            const partitioning = String(f?.partitioning || 'invariant').toLowerCase();
            map.set(normalizeSlug(name), { name, partitioning });
        }
        return map.size ? map : null;
    } catch {
        return null;
    }
}

module.exports = {
    fetchReferenceData,
    fetchSchemaNames,
    fetchSchemaFieldMap,
};
