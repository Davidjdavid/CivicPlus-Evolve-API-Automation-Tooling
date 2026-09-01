// Content type: Quick links.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 5,
    endpoint: "bpquicklink",
    standardColumns: ["Link", "Publish", "Name", "PermissionSet", "Categories"],
    // Was a hardcoded placeholder ({ url: "#" }, hardcoded permissionSet) that
    // ignored the sheet. Now wired to the real Link/Name columns. If your schema
    // calls the sub-field `title` rather than `displayName`, rename it below; if
    // the link field is invariant, change `en` to `iv`.
    mapPayload: (entry, lookups) => ({
        data: {
            link: {
                en: {
                    url: entry.Link,
                    displayName: entry.Name,
                    openInNewWindow: true
                }
            }
        },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
