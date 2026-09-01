// Content type: Agendas and minutes.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 8,
    endpoint: "gh-agenda",
    standardColumns: ["Publish", "Name", "PermissionSet", "Categories"],
    // The Agendas & Minutes sheet genuinely has no content columns, so data stays
    // empty. If gh-agenda has required fields, add the columns to the sheet and
    // map them here.
    mapPayload: (entry, lookups) => ({
        data: {},
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
