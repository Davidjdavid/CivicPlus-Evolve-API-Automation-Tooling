// Content type: Staff.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 3,
    // Different sites spell this differently. Only list genuinely different
    // NAMES; punctuation/casing variants (enhancedemployee, enhanced_employee,
    // ...) are matched automatically by the resolver. Order = preference.
    endpoints: ["employee", "enhanced-employee"],
    // "new" is a test column, not a schema field; listed so it is ignored.
    standardColumns: ["PermissionSet", "Categories", "FirstName", "LastName", "Title", "Department", "PhoneNumber", "FaxNumber", "EmailAddress", "Biography", "Publish", "Name", "new"],
    // Field names that vary site to site. Left side = what mapPayload emits.
    fieldAliases: {
        phonenumber: ["phone"],
        faxnumber: ["fax"],
        emailaddress: ["email"],
    },
    mapPayload: (entry, lookups) => ({
        data: {
            firstname: { en: entry.FirstName },
            lastname: { en: entry.LastName },
            title: { en: entry.Title },
            // FIX LATER: `department` is almost certainly a reference to a
            // Department content item, so it needs the target item's id, not the
            // plain string in the sheet. Left as an empty reference for now.
            department: { en: [] },
            phonenumber: { en: entry.PhoneNumber },
            faxnumber: { en: entry.FaxNumber },
            emailaddress: { en: entry.EmailAddress },
            Biography: { en: entry.Biography },
        },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
