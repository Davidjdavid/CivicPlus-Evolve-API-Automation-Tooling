// Content type: Resources (resource directory).
// See src/config/index.js for the shared config contract.

const { permissionSetByName, parseTags, parseCategories } = require('../../lib/mapHelpers');

module.exports = {
    sheetIndex: 1,
    // Was "resourcedirectory" — that URL 404s. Squidex slugs are kebab-case
    // (see "gh-agenda" / "name-of-event"), so the real slug is almost certainly
    // "resource-directory". Resolution confirms it against /schemas, and a site
    // that spells it "resourcedirectory" still matches (normalized).
    endpoint: "resource-directory",
    // "Ack" is a test column, not a schema field. Listed here so it is ignored
    // instead of injected as { iv: "..." } (which made the API reject every row).
    standardColumns: ["Department", "MaskedEmail", "PhoneNumber", "AdditionalNumber", "FaxNumber", "Address1", "Address2", "City", "State", "Zip", "Latitude", "Longitude", "HoursOfOperation", "AdditionalInformation", "Name", "Email", "Fax", "Hours", "WebsiteUrl", "WebsiteDisplayName", "Description", "Publish", "UserName", "PermissionSet", "Categories", "Ack"],
    // Add fieldAliases here (like departments does) if resource field names vary
    // across sites, e.g. faxnumber: ["fax"].
    mapPayload: (entry, lookups) => ({
        data: {
            department: { en: entry.Department },
            maskedemail: { en: entry.MaskedEmail },
            phonenumber: { en: entry.PhoneNumber },
            additionalnumber: { en: entry.AdditionalNumber },
            faxnumber: { en: entry.FaxNumber },
            location: {
                iv: {
                    address1: entry.Address1,
                    address2: entry.Address2,
                    city: entry.City,
                    state: entry.State,
                    zip: entry.Zip,
                }
            },
            hoursofoperation: { en: entry.HoursOfOperation },
            additionalinformation: { en: entry.AdditionalInformation },
            Name: { en: entry.Name },
            email: { en: entry.Email },
            PhoneNumber: { en: entry.PhoneNumber },
            Fax: { en: entry.Fax },
            Address: {
                iv: {
                    address1: entry.Address1,
                    address2: entry.Address2,
                    city: entry.City,
                    state: entry.State,
                    zip: entry.Zip,
                }
            },
            Hours: { en: entry.Hours },
            Website: {
                en: {
                    openInNewWindow: true,
                    url: entry.WebsiteUrl,
                    displayName: entry.WebsiteDisplayName
                }
            },
            Description: { en: entry.Description }
        },
        titles: { department: { en: entry.Department } },
        searchFields: {
            department: { en: entry.Department },
            maskedemail: { en: entry.MaskedEmail },
            phonenumber: { en: entry.PhoneNumber },
            additionalnumber: { en: entry.AdditionalNumber },
            faxnumber: { en: entry.FaxNumber },
            location: {
                iv: {
                    address1: entry.Address1,
                    address2: entry.Address2,
                    city: entry.City,
                    state: entry.State,
                    zip: entry.Zip,
                }
            },
            hoursofoperation: { en: entry.HoursOfOperation },
            additionalinformation: { en: entry.AdditionalInformation },
            Name: { en: entry.Name },
            email: { en: entry.Email },
            PhoneNumber: { en: entry.PhoneNumber },
            Fax: { en: entry.Fax },
            Address: {
                iv: {
                    address1: entry.Address1,
                    address2: entry.Address2,
                    city: entry.City,
                    state: entry.State,
                    zip: entry.Zip,
                }
            },
            Hours: { en: entry.Hours },
            Website: {
                en: {
                    openInNewWindow: true,
                    url: entry.WebsiteUrl,
                    displayName: entry.WebsiteDisplayName
                }
            },
            Description: { en: entry.Description }
        },
        permissionSet: permissionSetByName(entry, lookups),
        tags: parseTags(entry.Tags),
        categories: parseCategories(entry.Categories, lookups.categories),
        publish: entry.Publish
    })
};
