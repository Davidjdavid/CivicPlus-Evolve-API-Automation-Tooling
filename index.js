const fs = require('node:fs');
const XLSX = require('xlsx');
const express = require('express');
const path = require('node:path');

const app = express();
app.use(express.json());

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(4000, () => {
    console.log('Server running at http://localhost:4000');
});

app.post('/uploadBtn', async (req, res) => {
    const { url, apiKey } = req.body; 

    console.log("URL:", url);
    console.log("Token:", apiKey);

    try {
        // Passed 10 as the default batch size. Adjust as necessary.
        const executionResults = await uploadArticles(url, apiKey, 10); 
        res.json({ message: `Upload complete. Processed ${executionResults.length} articles.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed. Check server logs." });
    }
});

async function uploadArticles(apiURL, accessToken, batchSize = 10) {
    let excelFiles = parseExcel();
    let executionResults = [];

    for (let i = 0; i < excelFiles.length; i += batchSize) {
        const batch = excelFiles.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(excelFiles.length / batchSize)}`);

        const batchPromises = batch.map(fileData => {
            const requestData = {
                data: {
                    name: {
                        en: fileData.Title
                    },
                    article: {
                        en: fileData.Content
                    }
                },
                contentTypeName: fileData.ContentType,
                contentTypeDisplayName: fileData.contentTypeDisplayName,
                permissionSet: {
                    id: fileData.Id
                }
            };

            if (fileData.Tags) {
                requestData.tags = fileData.Tags;
            }

            if (fileData.Categories) {
                requestData.categories = fileData.Categories;
            }

            const body = JSON.stringify(requestData);

            return fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: body
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
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
        
        // Filter out any nulls from caught fetch errors before adding to results
        executionResults = executionResults.concat(batchResults.filter(result => result !== null));
    }

    return executionResults;
}

function parseExcel() {
    const workbook = XLSX.readFile("EvolveUploads.xlsx"); 
    const artcilesSheetName = workbook.SheetNames[0]; 
    const articleWorksheet = workbook.Sheets[artcilesSheetName];
    const excelData = XLSX.utils.sheet_to_json(articleWorksheet);

    let newFileList = [];
    
    for (let entry of excelData) {
        let newFile = {
            Title: entry.Title,
            ContentType: entry.ContentType,
            ContentName: entry.ContentName,
            contentTypeDisplayName: entry.contentTypeDisplayName, 
            Id: entry.Id,
            Content: entry.Content,
            Tags: entry.Tags ? String(entry.Tags).split(',').map(tag => tag.trim()) : undefined,
            Categories: entry.Categories ? String(entry.Categories).split(',').map(cat => ({
                id: "51a3131f-eda3-46fb-b4aa-1cc2d2effb81",
                name: cat.trim()
            })) : undefined
        }
        try {
            newFileList.push(newFile);
        } 
        catch(error) {
            console.log(error);
        }
    }
    return newFileList;
}
