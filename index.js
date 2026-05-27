// ------------------------------------------------------------------------------
// VARIABLES AND SET UP
// ------------------------------------------------------------------------------

const fs = require('node:fs');
const XLSX = require('xlsx');
const express = require('express');
const path = require('node:path');

const workbook = XLSX.readFile("articles.xlsx");
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const excelData = XLSX.utils.sheet_to_json(worksheet);

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
        const executionResults = await uploadArticles(url, apiKey);
        res.json({ message: `Upload complete. Processed ${executionResults.length} articles.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed. Check server logs." });
    }
});

// ------------------------------------------------------------------------------
// FUNCTIONS
// ------------------------------------------------------------------------------

function parseExcel() {
    let newFileList = [];
    for(let entry in excelData) {
            let newFile = {
                Title: excelData[entry].Title,
                ContentType: excelData[entry].ContentType,
                ContentName: excelData[entry].ContentName,
                contentTypeDisplayName: excelData[entry].contentTypeDisplayName, 
                Id: excelData[entry].Id,
                Content: excelData[entry].Content,
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

async function uploadArticles(apiURL, accessToken) {
    let excelFiles = parseExcel();
    let uploadPromises = [];

    for (let excelFile in excelFiles) {
        const requestData = {
            data: {
                name: {
                    en: excelFiles[excelFile].Title
                },
                article: {
                    en: excelFiles[excelFile].Content
                }
            },
            contentTypeName: excelFiles[excelFile].ContentType,
            contentTypeDisplayName: excelFiles[excelFile].contentTypeDisplayName,
            permissionSet: {
                id: excelFiles[excelFile].Id
            }
        };

        const body = JSON.stringify(requestData);

        const requestPromise = fetch(apiURL, {
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
        .catch(error => console.error('Fetch error:', error));

        uploadPromises.push(requestPromise);
    }

    return await Promise.all(uploadPromises);
}