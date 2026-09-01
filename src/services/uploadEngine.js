// The generic upload engine. Given a content type and a parsed workbook, it:
//   1. resolves the schema slug THIS site uses (from /schemas),
//   2. resolves this site's real field names (fieldAliases + live schema),
//   3. loads the reference lists (permissionSet, categories),
//   4. maps each row to a payload, injecting unknown columns as custom fields,
//   5. POSTs in batches, publishing rows whose Publish column is "Yes".
//
// It deliberately knows nothing about Express req/res — it takes plain arguments
// and returns { successes, failures }, so it can be tested without HTTP.
//
// Exports: processUpload

const XLSX = require('xlsx');

const { uploadConfig, DEFAULT_REFERENCE_DATA } = require('../config');
const {
    getEndpointCandidates,
    resolveEndpoint,
    suggestClosestSchemas,
} = require('../lib/slug');
const { conformFields } = require('../lib/fields');
const { fetchReferenceData } = require('./civicplusApi');
const { getSchemaNames, getSchemaFields } = require('./schemaCache');

/**
 * Upload one content type from a parsed workbook to a CivicPlus site.
 *
 * @param {string} type         Key into uploadConfig (e.g. "articles").
 * @param {string} siteURL      Site/app identifier used in the API URLs.
 * @param {string} accessToken  Bearer token for the CivicPlus API.
 * @param {object} workbook     Parsed XLSX workbook (from XLSX.read).
 * @param {number} [batchSize]  How many rows to POST in parallel per batch.
 * @returns {Promise<{ successes: Array<{row:number,data:object}>,
 *                     failures:  Array<{row:number,error:string}> }>}
 */
async function processUpload(type, siteURL, accessToken, workbook, batchSize = 10) {

    const config = uploadConfig[type];

    const sheetName = workbook.SheetNames[config.sheetIndex];
    if (!sheetName) {
        throw new Error(`The uploaded workbook has no sheet at index ${config.sheetIndex} for "${type}". It has ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}.`);
    }
    const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // --- Resolve the schema slug THIS site uses ---
    // Instead of trusting a single hardcoded slug, resolve the configured
    // candidate(s) against the schemas that actually exist on this site. This is
    // what makes one codebase work across sites with different slugs, and turns a
    // wrong slug into a precise, actionable error instead of a blind 404.
    const candidates = getEndpointCandidates(config);
    if (!candidates.length) {
        throw new Error(`No endpoint(s) configured for "${type}". Add an "endpoint" string or "endpoints" array in uploadConfig.`);
    }

    const schemaNames = await getSchemaNames(siteURL, accessToken);
    let endpoint;
    if (schemaNames) {
        endpoint = resolveEndpoint(candidates, schemaNames);
        if (!endpoint) {
            const close = suggestClosestSchemas(candidates, schemaNames);
            throw new Error(
                `None of the known slugs for "${type}" (${candidates.join(', ')}) exist in app "${siteURL}". ` +
                (close.length
                    ? `Closest schemas that DO exist: ${close.join(', ')}. `
                    : `Existing schemas: ${schemaNames.join(', ')}. `) +
                `Add the correct slug to endpoints[] for "${type}" in uploadConfig ` +
                `(or set ENDPOINT_ALIASES_${type.toUpperCase()}).`
            );
        }
        if (endpoint !== candidates[0]) {
            console.log(`[${type}] resolved to schema "${endpoint}" for ${siteURL} (preferred "${candidates[0]}").`);
        }
    } else {
        // Couldn't list schemas (token can't reach /schemas). Fall back to the
        // first candidate and let the POST report its own 404 if it's wrong.
        endpoint = candidates[0];
        console.warn(`Could not list schemas for "${siteURL}" — trying "${endpoint}" for "${type}". A 404 below means it's the wrong slug for this site.`);
    }

    const apiURL = `https://content.civicplus.com/api/content/${siteURL}/${endpoint}`;

    // --- Resolve field names THIS site uses ---
    // Read the resolved schema's real field names once, then rename each row's
    // data keys per fieldAliases. If the fields can't be read, conforming is
    // skipped and the mapper's field names are sent as-is (current behavior).
    // Partition conforming (fixing { iv } vs { en } to match the field) is
    // opt-in: set conformPartitions:true on the type, or CONFORM_PARTITIONS=1.
    const conformPartitions = config.conformPartitions === true || !!process.env.CONFORM_PARTITIONS;
    const fieldMap = process.env.DISABLE_SCHEMA_CONFORM
        ? null
        : await getSchemaFields(siteURL, endpoint, accessToken);
    if (!fieldMap && config.fieldAliases && !process.env.DISABLE_SCHEMA_CONFORM) {
        console.warn(`Could not read fields for schema "${endpoint}" on "${siteURL}" — field-name aliases won't be applied (sending the mapper's field names as-is).`);
    }

    // Load every reference list this type needs, once, before uploading.
    const lookups = {};
    for (const refEndpoint of (config.referenceData || DEFAULT_REFERENCE_DATA)) {
        lookups[refEndpoint] = await fetchReferenceData(siteURL, refEndpoint, accessToken);
    }

    const successes = [];
    const failures = [];

    for (let i = 0; i < excelData.length; i += batchSize) {
        const batch = excelData.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(excelData.length / batchSize)}`);

        const batchPromises = batch.map((entry, j) => {
            // Excel row number as the user sees it (1-based + header row).
            const rowNumber = i + j + 2;
            const requestData = config.mapPayload(entry, lookups);

            // --- DYNAMIC EXTRA FIELD INJECTION ---
            // Any column not in standardColumns is treated as an invariant custom
            // field. Empty cells are skipped so a blank column never sends { iv: "" }
            // (or, worse, an empty partition the API can reject).
            Object.keys(entry).forEach(key => {
                if (config.standardColumns && !config.standardColumns.includes(key)) {
                    const value = entry[key];
                    if (value !== undefined && value !== null && value !== '') {
                        requestData.data[key] = { iv: value };
                    }
                }
            });

            // --- FIELD-NAME CONFORMING ---
            // Rename data (and searchFields / titles, if present) to the field
            // names this site's schema actually uses. No-op when a key already
            // matches, so working sites are unaffected.
            if (fieldMap) {
                requestData.data = conformFields(requestData.data, fieldMap, config, { conformPartitions });
                if (requestData.searchFields) requestData.searchFields = conformFields(requestData.searchFields, fieldMap, config, { conformPartitions });
                if (requestData.titles) requestData.titles = conformFields(requestData.titles, fieldMap, config, { conformPartitions });
            }

            // Set DEBUG_PAYLOAD=1 to see exactly what is sent for each row.
            if (process.env.DEBUG_PAYLOAD) {
                console.log(`Row ${rowNumber} payload:`, JSON.stringify(requestData, null, 2));
            }

            return fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(async response => {
                if (!response.ok) {
                    const errBody = await response.text();
                    if (response.status === 404) {
                        // "Not Found" = the schema slug in this URL doesn't exist.
                        // Resolution should have caught this already; if we get here
                        // the /schemas list was unavailable, so surface the slug we tried.
                        throw new Error(`HTTP 404 — schema "${endpoint}" not found at ${apiURL}. Verify the schema slug (it is a URL problem, not a field problem).`);
                    }
                    throw new Error(`HTTP ${response.status}: ${errBody}`);
                }
                return response.json();
            })
            .then(async data => {
                if (entry.Publish === 'Yes') {
                    const patchUrl = `https://content.civicplus.com/api/content/${siteURL}/${endpoint}/${data.id}/status/?=`;
                    try {
                        const patchRes = await fetch(patchUrl, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ status: "Published" })
                        });

                        if (!patchRes.ok) {
                            console.error(`Publish failed for ${data.id}:`, await patchRes.text());
                        } else {
                            console.log(`Successfully published ${data.id}`);
                        }
                    } catch (err) {
                        console.error(`Network error publishing ${data.id}:`, err);
                    }
                }

                return { row: rowNumber, data };
            })
            .catch(error => {
                console.error(`Row ${rowNumber} failed:`, error.message);
                return { row: rowNumber, error: error.message };
            });
        });

        const batchResults = await Promise.all(batchPromises);
        for (const result of batchResults) {
            if (result.error) failures.push(result);
            else successes.push(result);
        }
    }

    return { successes, failures };
}

module.exports = { processUpload };
