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

        if (excelFiles[excelFile].Tags) {
            requestData.tags = excelFiles[excelFile].Tags;
        }

        if (excelFiles[excelFile].Categories) {
            requestData.categories = excelFiles[excelFile].Categories;
        }

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

function parseExcel() {
    const workbook = XLSX.readFile("articles.xlsx"); 
    const firstSheetName = workbook.SheetNames[0]; 
    const worksheet = workbook.Sheets[firstSheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet);

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
