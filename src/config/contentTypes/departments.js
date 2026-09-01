// Content type: Departments.
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 4,
    // Was "enhanceddepartment" (404). Kebab-case slug is the likely default,
    // but some sites drop the "enhanced" prefix — list both, most-specific first.
    endpoints: ["enhanced-department", "department"],
    standardColumns: ["Department", "PhoneNumber", "EmergencyNumber", "FaxNumber", "HoursOfOperation", "AdditionalInformation", "ParentDepartment", "StaffDirectory", "Publish", "Name", "PermissionSet", "Categories"],
    // The field-name variants seen across sites (faxnumber vs fax, etc.). Add or
    // adjust as you discover more; an alias that no site actually has is ignored.
    fieldAliases: {
        phonenumber: ["phone"],
        faxnumber: ["fax", "faxnumber"],
        emergencynumber: ["emergencyphonenumber", "emergency"],
        hoursofoperation: ["hours"],
        additionalinformation: ["additionalinfo"],
    },
    mapPayload: (entry, lookups) => ({
        data: {
            department: { en: entry.Department },
            phonenumber: { en: entry.PhoneNumber },
            emergencynumber: { en: entry.EmergencyNumber },
            faxnumber: { en: entry.FaxNumber },
            hoursofoperation: { en: entry.HoursOfOperation },
            additionalinformation: { en: entry.AdditionalInformation },
            // FIX LATER: both are references to other content items and need
            // resolved ids. Empty arrays are usually accepted by Squidex.
            parentdepartment: { iv: [] },
            staffdirectory: { iv: [] },
        },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
