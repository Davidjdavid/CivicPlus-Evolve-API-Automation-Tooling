// Content type: FAQs.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 2,
    endpoint: "faq",
    standardColumns: ["Question", "Answer", "PermissionSet", "Categories", "Publish", "Name"],
    mapPayload: (entry, lookups) => ({
        data: {
            question: { en: entry.Question },
            answer: { en: entry.Answer }
        },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
