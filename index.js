const fs = require('node:fs');
const XLSX = require('xlsx');
const express = require('express');
const path = require('node:path');
const { title } = require('node:process');

const app = express();
app.use(express.json());

app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// --- Helper Functions ---

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parseTags = (tags) => tags ? String(tags).split(',').map(tag => tag.trim()) : undefined;

// Resolve a name (from the spreadsheet) to an id using a name->id lookup Map.
// Falls back to the raw value if it already looks like a GUID, so a sheet can
// mix plain names and raw IDs. Returns undefined (and warns) if nothing matches.
const resolveId = (value, lookup, label = 'value') => {
    const name = String(value ?? '').trim();
    if (!name) return undefined;

    const match = lookup?.get(name.toLowerCase());
    if (match) return match;

    if (GUID_REGEX.test(name)) return name; // already an id, use as-is
    console.warn(`No ${label} match for "${name}" — id left empty.`);
    return undefined;
};

// Categories can be a comma-separated list of names; map each to { id, name }.
const parseCategories = (categories, lookup) => categories
    ? String(categories).split(',')
        .map(cat => cat.trim())
        .filter(Boolean)
        .map(name => ({ id: resolveId(name, lookup, 'category'), name }))
    : undefined;

// Every sheet carries a PermissionSet NAME column (no id columns anymore),
// so permissionSet is resolved the same way for every content type.
const permissionSetByName = (entry, lookups) => ({
    id: resolveId(entry.PermissionSet, lookups.permissionSet, 'permissionSet'),
    name: entry.PermissionSet
});

// Reference lists pulled from /api/apps/<site>/<endpoint> for EVERY type. Names
// in each sheet's PermissionSet / Categories columns are matched against these
// to fill in ids. A type can override this (e.g. `referenceData: []` to skip),
// but by default every type loads both lists so a new sheet "just works".
const DEFAULT_REFERENCE_DATA = ["permissionSet", "categories"];

// Each config maps a sheet to an endpoint + payload shape. `standardColumns`
// lists the columns the mapper already handles; ANY column not in that list is
// auto-injected into `data` as a custom field (see processUpload). So the only
// columns to leave OUT are the genuine custom/extra ones for that sheet.
const uploadConfig = {
    articles: {
        sheetIndex: 0,
        endpoint: "article",
        standardColumns: ["Title", "ContentType", "ContentName", "Content", "Publish", "PermissionSet", "Categories", "Tags", "Name"], // leaves TestName as a custom field
        mapPayload: (entry, lookups) => ({
            data: { name: { en: entry.Title }, article: { en: entry.Content } },
            contentTypeName: entry.ContentType,
            contentTypeDisplayName: entry.contentTypeDisplayName,
            permissionSet: permissionSetByName(entry, lookups),
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, lookups.categories),
            publish: entry.Publish
        })
    },
    resources: {
        sheetIndex: 1,
        endpoint: "resourcedirectory",
        standardColumns: ["Department", "MaskedEmail", "PhoneNumber", "AdditionalNumber", "FaxNumber", "Address1", "Address2", "City", "State", "Zip", "Latitude", "Longitude", "HoursOfOperation", "AdditionalInformation", "Name", "Email", "Fax", "Hours", "WebsiteUrl", "WebsiteDisplayName", "Description", "Publish", "UserName", "PermissionSet", "Categories"], // leaves Ack as a custom field
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
    },
    faqs: {
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
    },
    staff: {
        sheetIndex: 3,
        endpoint: "enhancedemployee",
        standardColumns: ["PermissionSet", "Categories", "FirstName", "LastName", "Title", "Department", "PhoneNumber", "FaxNumber", "EmailAddress", "Biography", "Publish", "Name"], // leaves `new` as a custom field
        mapPayload: (entry, lookups) => ({
            data: {
                firstname: { en: entry.FirstName },
                lastname: { en: entry.LastName },
                title: { en: entry.Title },
                department: { en: [] }, //FIX LATER
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
    },
    departments: {
        sheetIndex: 4,
        endpoint: "enhanceddepartment",
        standardColumns: ["Department", "PhoneNumber", "EmergencyNumber", "FaxNumber", "HoursOfOperation", "AdditionalInformation", "ParentDepartment", "StaffDirectory", "Publish", "Name", "PermissionSet", "Categories"],
        mapPayload: (entry, lookups) => ({
            data: {
                department: { en: entry.Department },
                phonenumber: { en: entry.PhoneNumber },
                emergencynumber: { en: entry.EmergencyNumber },
                faxnumber: { en: entry.FaxNumber },
                hoursofoperation: { en: entry.HoursOfOperation },
                additionalinformation: { en: entry.AdditionalInformation },
                parentdepartment: { iv: [] }, //FIX LATER
                staffdirectory: { iv: [] }, //FIX LATER
            },
            permissionSet: permissionSetByName(entry, lookups),
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, lookups.categories),
            publish: entry.Publish
        })
    },
    quicklinks: {
        sheetIndex: 5,
        endpoint: "bpquicklink",
        standardColumns: ["Link", "Publish", "Name", "PermissionSet", "Categories"],
        mapPayload: (entry, lookups) => ({
            data: {
                link: { en: entry.Link }
            },
            permissionSet: permissionSetByName(entry, lookups),
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, lookups.categories),
            publish: entry.Publish
        })
    },
    news: {
        sheetIndex: 6,
        endpoint: "newsflash",
        standardColumns: ["NewsTitle", "NewsDate", "NewsText", "NewsAsset", "Publish", "Name", "PermissionSet", "Categories"],
        mapPayload: (entry, lookups) => ({
            data: {
                newstitle: { en: entry.NewsTitle },
                newsdate: { iv: {
                    startDate: "2019-08-24T14:15:22Z",
                    endDate: "2019-09-24T14:15:22Z"
                } }, //FIX LATER
                newstext: { en: entry.NewsText },
                newsasset: { iv: [] }, //FIX LATER
            },
            permissionSet: permissionSetByName(entry, lookups),
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, lookups.categories),
            publish: entry.Publish
        })
    },
    calendar: {
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
                attachments: { iv: [] }, //FIX LATER
                "url-link": { iv: "test.com" }, //FIX LATER
                "submission-pdf": { iv: [] }, //FIX LATER

            },
            permissionSet: permissionSetByName(entry, lookups),
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, lookups.categories),
            publish: entry.Publish
        })
    },
    agendas: {
        sheetIndex: 8,
        endpoint: "gh-agenda",
        standardColumns: ["Publish", "Name", "PermissionSet", "Categories"],
        mapPayload: (entry, lookups) => ({
            data: {}, //FIX LATER: the Agendas and Minutes sheet has no content columns yet
            permissionSet: permissionSetByName(entry, lookups),
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, lookups.categories),
            publish: entry.Publish
        })
    },
    facility: {
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
    }
}

// --- Single Dynamic Route ---

app.post('/upload/:type', async (req, res) => {
    const { url, apiKey } = req.body;
    const { type } = req.params;

    if (!uploadConfig[type]) {
        return res.status(400).json({ message: `Invalid upload type: ${type}` });
    }

    console.log(`Processing [${type}] - URL: ${url}`);

    try {
        const executionResults = await processUpload(type, url, apiKey, 10);
        res.json({ message: `Upload complete. Processed ${executionResults.length} ${type}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed. Check server logs." });
    }
});


// --- Reference Data Loader ---

// GET https://content.civicplus.com/api/apps/<site>/<endpoint>
// Returns a Map of lowercased name -> id for quick matching.
async function fetchReferenceData(siteURL, endpoint, accessToken) {
    const apiURL = `https://content.civicplus.com/api/apps/${siteURL}/${endpoint}`;

    const response = await fetch(apiURL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to load ${endpoint}: HTTP ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const lookup = new Map();

    (json.items || []).forEach(item => {
        if (item?.name) lookup.set(String(item.name).trim().toLowerCase(), item.id);
    });

    console.log(`Loaded ${lookup.size} ${endpoint} entries for ${siteURL}`);
    return lookup;
}


// --- Generic Engine ---

async function processUpload(type, siteURL, accessToken, batchSize = 10) {
    
    const config = uploadConfig[type];
    let apiURL = `https://content.civicplus.com/api/content/${siteURL}/${config.endpoint}`;
    
    const workbook = XLSX.readFile("EvolveUploads.xlsx");
    const sheetName = workbook.SheetNames[config.sheetIndex];
    const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Load every reference list this type needs, once, before uploading.
    // Defaults to permissionSet + categories for every type (see DEFAULT_REFERENCE_DATA).
    // lookups ends up like { permissionSet: Map, categories: Map }.
    const lookups = {};
    for (const endpoint of (config.referenceData || DEFAULT_REFERENCE_DATA)) {
        lookups[endpoint] = await fetchReferenceData(siteURL, endpoint, accessToken);
    }

    let executionResults = [];

    for (let i = 0; i < excelData.length; i += batchSize) {
        const batch = excelData.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(excelData.length / batchSize)}`);

        const batchPromises = batch.map(entry => {
            const requestData = config.mapPayload(entry, lookups);

            // --- DYNAMIC EXTRA FIELD INJECTION ---
            Object.keys(entry).forEach(key => {
                if (config.standardColumns && !config.standardColumns.includes(key)) {
                    // Based on your schema, wrapped in { iv: ... } or { en: ... }
                    requestData.data[key] = { iv: entry[key] }; 
                }
            });
            return fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(async response => {
                if (!response.ok) {
                    const errBody = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errBody}`);
                }
                return response.json();
            })
            .then(async data => {
                console.log(data);

                if (entry.Publish === 'Yes') {
                    const patchUrl = `https://content.civicplus.com/api/content/${siteURL}/${config.endpoint}/${data.id}/status/?=`;
                    try {
                        const patchRes = await fetch(patchUrl, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ status: "Published" })
                        });
                        
                        if (!patchRes.ok) {
                            console.error(`Publish failed for ${data.id}:`, await patchRes.text());
                        } else {
                            console.log(`Successfully published ${data.id}`);
                        }
                    } catch (err) {
                        console.error(`Network error publishing ${data.id}:`, err);
                    }
                }

                return data;
            })
            .catch(error => {
                console.error('Fetch error:', error);
                return null;
            });
        });

        const batchResults = await Promise.all(batchPromises);
        executionResults = executionResults.concat(batchResults.filter(result => result !== null));
    }

    return executionResults;
}
