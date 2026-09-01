// HTTP layer for uploads. Owns multer (in-memory file handling) and the single
// dynamic /upload/:type route. Parses the workbook from the request and hands off
// to the engine; everything domain-specific lives in services/uploadEngine.
//
// Exports: an Express Router (mounted at "/" by app.js).

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');

const { uploadConfig } = require('../config');
const { processUpload } = require('../services/uploadEngine');

const router = express.Router();

// Excel files are received in memory (never written to disk) and parsed straight
// from the buffer. 25 MB cap + a light filter for spreadsheet types.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /\.(xlsx|xlsm|xls|csv)$/i.test(file.originalname);
        cb(ok ? null : new Error('Please upload a .xlsx, .xlsm, .xls or .csv file.'), ok);
    }
});
const uploadSingle = upload.single('file');

// The Excel file arrives as multipart/form-data under the field name "file".
// url + apiKey travel as ordinary text fields alongside it (req.body).
router.post('/upload/:type', (req, res) => {
    uploadSingle(req, res, async (uploadErr) => {
        // multer errors (wrong type, file too large, etc.) surface here.
        if (uploadErr) {
            return res.status(400).json({ message: uploadErr.message });
        }

        const { url, apiKey } = req.body;
        const { type } = req.params;

        if (!uploadConfig[type]) {
            return res.status(400).json({ message: `Invalid upload type: ${type}` });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No Excel file uploaded. Choose a file and try again.' });
        }

        console.log(`Processing [${type}] - URL: ${url} - file: ${req.file.originalname}`);

        try {
            // Parse the workbook straight from the uploaded buffer (no disk read).
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const { successes, failures } = await processUpload(type, url, apiKey, workbook, 10);

            if (failures.length === 0) {
                return res.json({ message: `Upload complete. Processed ${successes.length} ${type}.` });
            }

            // Partial (or total) failure: report counts AND the actual API errors
            // so you can see exactly which field each content type is rejecting,
            // instead of a silent "Processed 0".
            return res.status(207).json({
                message: `Processed ${successes.length} of ${successes.length + failures.length} ${type}. ${failures.length} failed.`,
                errors: failures.slice(0, 10).map(f => `Row ${f.row}: ${f.error}`)
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message || "Upload failed. Check server logs." });
        }
    });
});

module.exports = router;
