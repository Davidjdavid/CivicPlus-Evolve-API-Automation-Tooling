// Field-name resolution helpers.
//
// Same idea as endpoints, one level deeper: the SAME logical field is named
// differently per site (departments' fax number is "faxnumber" on one site and
// "fax" on another). Each config can declare `fieldAliases`, mapping the name
// the mapper emits to the alternate names other sites use. At upload time we
// read the resolved schema's real field names and rename each data key to
// whatever THIS site actually has. Punctuation/casing variants are matched
// automatically (shares normalizeSlug with endpoints), so you only list
// genuinely different WORDS.
//
// Exports: getFieldCandidates, resolveField, conformPartition, conformFields

const { normalizeSlug } = require('./slug');

// Candidate field names for a data key = the key itself, then its declared alts.
const getFieldCandidates = (config, key) =>
    [key, ...((config.fieldAliases && config.fieldAliases[key]) || [])];

// Pick the real field descriptor for THIS site from the schema's field map
// (keyed by normalized name). Returns { name, partitioning } or null.
function resolveField(candidates, fieldMap) {
    for (const c of candidates) {
        const hit = fieldMap.get(normalizeSlug(c));
        if (hit) return hit;
    }
    return null;
}

// Re-wrap a single-partition value under the partition the schema expects.
// { en: X } <-> { iv: X } only; multi-key or non-standard wrappers are left
// alone so complex/localized fields are never mangled.
function conformPartition(value, partitioning) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const keys = Object.keys(value);
    if (keys.length !== 1 || (keys[0] !== 'en' && keys[0] !== 'iv')) return value;

    const wanted = partitioning === 'invariant' ? 'iv' : 'en';
    if (keys[0] === wanted) return value;
    return { [wanted]: value[keys[0]] };
}

// Rename each key of a fields object (data / searchFields / titles) to the field
// name THIS site's schema actually uses, based on the config's fieldAliases and
// the live schema. Optionally also fix the { iv } vs { en } wrapper to match the
// field's partitioning. Keys with no schema match are left untouched (they may
// be injected custom fields, or the API will report them). Returns a new object.
//
// SAFE BY DESIGN: it only renames a key when the schema has a DIFFERENT spelling
// for it. For any site where the upload already succeeds, every key already
// matches, so this is a no-op there. It only changes the failing case.
function conformFields(fieldsObj, fieldMap, config, { conformPartitions } = {}) {
    if (!fieldsObj || !fieldMap) return fieldsObj;
    const out = {};

    for (const [key, value] of Object.entries(fieldsObj)) {
        const match = resolveField(getFieldCandidates(config, key), fieldMap);
        let targetKey = match ? match.name : key;

        // Never clobber a key already present under its real name.
        if (targetKey !== key && Object.prototype.hasOwnProperty.call(out, targetKey)) {
            console.warn(`Field "${key}" resolves to "${targetKey}" but that key already exists — keeping "${key}" as-is.`);
            targetKey = key;
        }
        if (targetKey !== key) {
            console.log(`Field "${key}" -> "${targetKey}" (matched this site's schema).`);
        }

        out[targetKey] = (conformPartitions && match)
            ? conformPartition(value, match.partitioning)
            : value;
    }
    return out;
}

module.exports = {
    getFieldCandidates,
    resolveField,
    conformPartition,
    conformFields,
};
