// backend/services/pdfService.js
const { generatePdf } = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

exports.generateInvoicePdf = async (invoice) => {
  const templatePath = path.join(__dirname, '../templates/invoice.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders with actual data
  const html = template
    .replace('{{invoiceNumber}}', invoice.invoiceNumber)
    .replace('{{date}}', new Date(invoice.date).toLocaleDateString())
    .replace('{{customerName}}', invoice.customer.name)
    // Add more replacements as needed

  const options = { 
    format: 'A4',
    printBackground: true 
  };

  const file = { content: html };
  return new Promise((resolve, reject) => {
    generatePdf({ content: html }, options, (err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
};