const fs = require('fs');
const csv = require('csv-parser');
<<<<<<< HEAD

function extractEmails(csvFile, outputFile) {
  const emails = new Set();

  // Read existing emails from the output file if it exists
  if (fs.existsSync(outputFile)) {
    const existingEmails = fs.readFileSync(outputFile, 'utf8').split(' ');
    existingEmails.forEach((email) => {
      if (email.trim()) emails.add(email.trim());
    });
  }

  fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      if (
        row[' email'] &&
        row[' email'].trim() &&
        !emails.has(row[' email'].trim())
      ) {
        emails.add(row[' email'].trim());
      }
    })
    .on('end', () => {
      fs.writeFileSync(outputFile, Array.from(emails).join(' '), 'utf8');
      console.log(`Emails extracted and updated in ${outputFile}`);
    });
}

// Usage example
const csvFilename = 'registration-list-2.csv'; // Replace with your actual file name
const outputFilename = 'emails.txt'; // Output file
extractEmails(csvFilename, outputFilename);
=======
const path = require('path');
const express = require('express');
const multer = require('multer');

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
  let headerChecked = false;
  let validField = false;

  const stream = fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      if (!headerChecked) {
        // Check headers on the first row
        const headers = Object.keys(row).map(h => h.trim().toLowerCase());
        if (headers.includes(field.toLowerCase())) {
          validField = true;
        }
        headerChecked = true;
        if (!validField) {
          stream.destroy(new Error(`Field "${field}" not found in CSV headers.`));
          return;
        }
      }

      // Extract and store unique values
      const matchingKey = Object.keys(row).find(
        key => key.trim().toLowerCase() === field.toLowerCase()
      );
      if (matchingKey && row[matchingKey] && row[matchingKey].trim()) {
        extractedSet.add(row[matchingKey].trim());
      }
    })
    .on('end', () => {
      const extractedData = Array.from(extractedSet);
      fs.writeFileSync(outputFile, extractedData.join(separator), 'utf8');
      console.log(`Data extracted for field "${field}" and updated in ${outputFile}`);
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
  
  const field = req.body.field;
  const separator = req.body.separator || ' '; // Default to space if empty
  const fileType = req.body.fileType || 'txt'; // File type: 'txt' or 'csv'
  const download = req.body.download === 'true'; // Should the file be downloadable?
  
  const csvFilePath = path.join(__dirname, req.file.path);
  const outputFile = path.join(__dirname, `extracted.${fileType}`);

  extractField(csvFilePath, field, separator, outputFile, (err, extracted) => {
    fs.unlinkSync(csvFilePath); // Delete the uploaded CSV file after processing

    if (err) {
      console.error('Error extracting data:', err);
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

    res.json({ extracted });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
>>>>>>> 3b66ccd (Merged local project into GitHub repository)
