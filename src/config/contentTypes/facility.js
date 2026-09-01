// Content type: Facilities.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 9,
    endpoint: "facility",
    standardColumns: ["FacilityName", "Publish", "Name", "PermissionSet", "Categories"],
    mapPayload: (entry, lookups) => ({
        data: { facilityname: { en: entry.FacilityName } },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
