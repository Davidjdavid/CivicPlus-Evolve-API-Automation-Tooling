// Content type: News.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 6,
    endpoint: "newsflash",
    standardColumns: ["NewsTitle", "NewsDate", "NewsText", "NewsAsset", "Publish", "Name", "PermissionSet", "Categories"],
    mapPayload: (entry, lookups) => ({
        data: {
            newstitle: { en: entry.NewsTitle },
            // FIX LATER: real date range. Uses the sheet's NewsDate for both ends
            // if present, otherwise falls back to a placeholder window.
            newsdate: {
                iv: {
                    startDate: entry.NewsDate || "2019-08-24T14:15:22Z",
                    endDate: entry.NewsDate || "2019-09-24T14:15:22Z"
                }
            },
            newstext: { en: entry.NewsText },
            // FIX LATER: asset reference (needs an uploaded asset id).
            newsasset: { iv: [] },
        },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
