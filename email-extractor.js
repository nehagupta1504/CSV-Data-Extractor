const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files from public folder
app.use(express.static('public'));

/**
 * Extracts unique values from a specified CSV field and writes them
 * to an output file using a given separator.
 *
 * @param {string} csvFile - Path to the CSV file.
 * @param {string} field - Field to extract from CSV rows.
 * @param {string} separator - Separator to use in the output file.
 * @param {string} outputFile - Path to the output file.
 * @param {function} callback - Callback function (err, extractedData).
 */
function extractField(csvFile, field, separator, outputFile, callback) {
  const extractedSet = new Set();
  let validField = false;

  fs.createReadStream(csvFile)
    .pipe(csv())
    .on('headers', (headers) => {
      // Trim headers and find the correct column name
      const cleanHeaders = headers.map((h) => h.trim().toLowerCase());
      validField = cleanHeaders.includes(field.toLowerCase());
      if (!validField) {
        return callback(new Error(`Field "${field}" not found in CSV headers.`), null);
      }
    })
    .on('data', (row) => {
      if (validField) {
        const matchingKey = Object.keys(row).find(
          (key) => key.trim().toLowerCase() === field.toLowerCase()
        );
        if (matchingKey && row[matchingKey] && row[matchingKey].trim()) {
          extractedSet.add(row[matchingKey].trim());
        }
      }
    })
    .on('end', () => {
      const extractedData = Array.from(extractedSet);
      fs.writeFileSync(outputFile, extractedData.join(separator), 'utf8');
      console.log(`Data extracted for field "${field}" and saved to ${outputFile}`);
      callback(null, extractedData);
    })
    .on('error', (error) => {
      callback(error, null);
    });
}

// POST /upload route to handle CSV uploads and extract specified field
app.post('/upload', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  const field = req.body.field?.trim();
  const separator = req.body.separator || ' '; // Default to space
  const fileType = req.body.fileType || 'txt'; // 'txt' or 'csv'
  const download = req.body.download === 'true'; // Should the file be downloadable?

  if (!field) {
    return res.status(400).json({ error: 'Field name is required' });
  }

  const csvFilePath = path.resolve(req.file.path);
  const outputFile = path.resolve(`extracted.${fileType}`);

  extractField(csvFilePath, field, separator, outputFile, (err, extracted) => {
    if (err) {
      console.error('Error extracting data:', err);
      fs.unlinkSync(csvFilePath); // Delete the uploaded file if error occurs
      return res.status(400).json({ error: err.message });
    }

    if (download) {
      return res.download(outputFile, `extracted.${fileType}`, (downloadErr) => {
        if (downloadErr) {
          console.error('Error sending file:', downloadErr);
          return res.status(500).json({ error: 'Failed to download file' });
        }
        fs.unlinkSync(outputFile); // Delete the file after download
      });
    }

    fs.unlinkSync(csvFilePath); // Delete the uploaded CSV file after processing
    res.json({ extracted });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
