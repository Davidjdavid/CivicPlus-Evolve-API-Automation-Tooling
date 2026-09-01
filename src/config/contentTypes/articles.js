// Content type: Articles.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 0,
    endpoint: "article",
    standardColumns: ["Title", "ContentType", "ContentName", "Content", "Publish", "PermissionSet", "Categories", "Tags", "Name"],
    mapPayload: (entry, lookups) => ({
        data: { name: { en: entry.Title }, article: { en: entry.Content } },
        contentTypeName: entry.ContentType,
        contentTypeDisplayName: entry.contentTypeDisplayName,
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
