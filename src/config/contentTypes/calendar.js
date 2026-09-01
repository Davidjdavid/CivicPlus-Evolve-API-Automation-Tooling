// Content type: Calendar (events).
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 7,
    endpoint: "event",
    standardColumns: ["TitleOfEvent", "TimeTest", "DateOfEvent", "StartTimeOfEvent", "Details", "Attachments", "UrlLink", "SubmissionPDF", "Publish", "Name", "PermissionSet", "Categories"],
    mapPayload: (entry, lookups) => ({
        data: {
            "name-of-event": { iv: entry.TitleOfEvent },
            TimeTest: { iv: entry.TimeTest },
            "date-of-event": { iv: entry.DateOfEvent },
            "start-time-of-event": { iv: entry.StartTimeOfEvent },
            details: { iv: entry.Details },
            // FIX LATER: asset references.
            attachments: { iv: [] },
            "url-link": { iv: entry.UrlLink || "test.com" },
            "submission-pdf": { iv: [] },
        },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
