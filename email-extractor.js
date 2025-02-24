const fs = require('fs');
const csv = require('csv-parser');

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
