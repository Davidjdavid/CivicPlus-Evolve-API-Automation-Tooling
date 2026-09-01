// Pure helpers shared by the per-type config files (src/config/contentTypes/*).
// No network, no file I/O — just data in, data out. Safe to unit-test directly.
//
// Exports: GUID_REGEX, parseTags, resolveId, parseCategories, permissionSetByName

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parseTags = (tags) => tags ? String(tags).split(',').map(tag => tag.trim()) : undefined;

// Resolve a name (from the spreadsheet) to an id using a name->id lookup Map.
// Falls back to the raw value if it already looks like a GUID, so a sheet can
// mix plain names and raw IDs. Returns undefined (and warns) if nothing matches.
const resolveId = (value, lookup, label = 'value') => {
    const name = String(value ?? '').trim();
    if (!name) return undefined;

    const match = lookup?.get(name.toLowerCase());
    if (match) return match;

    if (GUID_REGEX.test(name)) return name; // already an id, use as-is
    console.warn(`No ${label} match for "${name}" — id left empty.`);
    return undefined;
};

// Categories can be a comma-separated list of names; map each to { id, name }.
const parseCategories = (categories, lookup) => categories
    ? String(categories).split(',')
        .map(cat => cat.trim())
        .filter(Boolean)
        .map(name => ({ id: resolveId(name, lookup, 'category'), name }))
    : undefined;

// Every sheet carries a PermissionSet NAME column (no id columns anymore),
// so permissionSet is resolved the same way for every content type.
const permissionSetByName = (entry, lookups) => ({
    id: resolveId(entry.PermissionSet, lookups.permissionSet, 'permissionSet'),
    name: entry.PermissionSet
});

module.exports = {
    GUID_REGEX,
    parseTags,
    resolveId,
    parseCategories,
    permissionSetByName,
};
