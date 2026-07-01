const fs = require('node:fs');
const XLSX = require('xlsx');
const express = require('express');
const path = require('node:path');
const { title } = require('node:process');

const app = express();
app.use(express.json());

app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(4000, () => console.log('Server running at http://localhost:4000'));

// --- Helper Functions ---

const parseTags = (tags) => tags ? String(tags).split(',').map(tag => tag.trim()) : undefined;
const parseCategories = (categories, defaultId) => categories ? String(categories).split(',').map(cat => ({ id: defaultId, name: cat.trim() })) : undefined;

// --- Entity Configuration Dictionary ---
// Add new upload types here instead of creating new routes/functions.

const uploadConfig = {
    articles: {
        sheetIndex: 0,
        mapPayload: (entry) => ({
            data: { name: { en: entry.Title }, article: { en: entry.Content } },
            contentTypeName: entry.ContentType,
            contentTypeDisplayName: entry.contentTypeDisplayName,
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    resources: {
        sheetIndex: 1,
        mapPayload: (entry) => ({
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
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    faqs: {
        sheetIndex: 2,
        mapPayload: (entry) => ({
            data: { 
                question: { en: entry.Question }, 
                answer: { en: entry.Answer } 
            },
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "517621b0-bb58-4e34-ba0f-b6c15b1b0f66")
        })
    },
    staff: {
        sheetIndex: 3,
        mapPayload: (entry) => ({
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
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    departments: {
        sheetIndex: 4,
        mapPayload: (entry) => ({
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
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    quicklinks: {
        sheetIndex: 5,
        mapPayload: (entry) => ({
            data: { link: { en: entry.Link } },
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    news: {
        sheetIndex: 6,
        mapPayload: (entry) => ({
            data: { 
                newstitle: { en: entry.NewsTitle },
                newsdate: { iv: {
                    startDate: "2019-08-24T14:15:22Z",
                    endDate: "2019-09-24T14:15:22Z"
                } }, //FIX LATER
                newstext: { en: entry.NewsText },
                newsasset: { iv: [] }, //FIX LATER
            },             
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    calendar: {
        sheetIndex: 7,
        mapPayload: (entry) => ({
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
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    agendas: {
        sheetIndex: 8,
        mapPayload: (entry) => ({
            data: { department: { en: entry.department } },
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    },
    facility: {
        sheetIndex: 9,
        mapPayload: (entry) => ({
            data: { facilityname: { en: entry.FacilityName } },
            permissionSet: { id: entry.Id },
            tags: parseTags(entry.Tags),
            categories: parseCategories(entry.Categories, "51a3131f-eda3-46fb-b4aa-1cc2d2effb81")
        })
    }
};

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

// --- Generic Engine ---

async function processUpload(type, apiURL, accessToken, batchSize = 10) {
    const config = uploadConfig[type];
    
    // Parse Excel
    const workbook = XLSX.readFile("EvolveUploads.xlsx");
    const sheetName = workbook.SheetNames[config.sheetIndex];
    const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let executionResults = [];

    // Batch & Upload
    for (let i = 0; i < excelData.length; i += batchSize) {
        const batch = excelData.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(excelData.length / batchSize)}`);

        const batchPromises = batch.map(entry => {
            // JSON.stringify automatically drops keys where the value is undefined (e.g., missing tags)
            const requestData = config.mapPayload(entry);

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
            .then(data => {
                console.log(data);
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
