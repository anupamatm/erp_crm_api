const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { sendInvoiceEmail } = require('../services/emailService');
const PDFDocument = require('pdfkit');

// ========== PDF GENERATION ==========
const fs = require('fs');
// const PDFDocument = require('pdfkit');
const path = require('path');

async function generateInvoicePdf(invoice) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Header with Logo
    const logoPath = path.join(__dirname, '../assets/logo.png'); // Optional logo
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 100 });
    }

    doc
      .fillColor('#333')
      .fontSize(20)
      .text('INVOICE', 400, 50, { align: 'right' })
      .fontSize(10)
      .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 75, { align: 'right' })
      .text(`Date: ${formatDate(invoice.issueDate)}`, 400, 90, { align: 'right' })
      .text(`Due Date: ${formatDate(invoice.dueDate)}`, 400, 105, { align: 'right' });

    // Customer Info
    doc
      .moveDown()
      .fillColor('#444')
      .fontSize(14)
      .text('Bill To', 40, 150)
      .fontSize(10)
      .fillColor('#000')
      .text(invoice.customer.name, 40, 170)
      .text(invoice.billingAddress?.street || '', 40, 185)
      .text(`${invoice.billingAddress?.city || ''}, ${invoice.billingAddress?.state || ''} ${invoice.billingAddress?.zipCode || ''}`, 40, 200)
      .text(invoice.billingAddress?.country || '', 40, 215);

    // Table Header
    const tableTop = 260;
    const rowHeight = 24;
    const colWidths = [120, 120, 70, 50, 70];

    doc
      .fillColor('#ffffff')
      .rect(40, tableTop, 520, rowHeight)
      .fill('#007ACC')
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#ffffff')
      .text('Item', 45, tableTop + 6)
      .text('Description', 165, tableTop + 6)
      .text('Unit Price', 290, tableTop + 6, { width: 70, align: 'right' })
      .text('Qty', 370, tableTop + 6, { width: 50, align: 'right' })
      .text('Total', 450, tableTop + 6, { width: 90, align: 'right' });

    // Table Rows
    let y = tableTop + rowHeight;
    invoice.items.forEach((item, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.fillColor('#f9f9f9').rect(40, y, 520, rowHeight).fill();
      }

      doc
        .fillColor('#000')
        .font('Helvetica')
        .fontSize(9)
        .text(item.product?.name || '', 45, y + 6, { width: 110 })
        .text(item.description || '', 165, y + 6, { width: 120 })
        .text(formatCurrency(item.unitPrice), 290, y + 6, { width: 70, align: 'right' })
        .text(item.quantity.toString(), 370, y + 6, { width: 50, align: 'right' })
        .text(formatCurrency((item.unitPrice || 0) * item.quantity), 450, y + 6, { width: 90, align: 'right' });

      y += rowHeight;
    });

    // Totals
    y += 10;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Subtotal', 370, y, { width: 100, align: 'right' })
      .text(formatCurrency(invoice.subtotal), 470, y, { width: 90, align: 'right' });

    if (invoice.tax) {
      y += 20;
      doc
        .font('Helvetica')
        .text(`Tax (${invoice.tax}%)`, 370, y, { width: 100, align: 'right' })
        .text(formatCurrency(invoice.totalAmount - invoice.subtotal), 470, y, { width: 90, align: 'right' });
    }

    y += 30;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#007ACC')
      .text('Total', 370, y, { width: 100, align: 'right' })
      .fillColor('#000')
      .text(formatCurrency(invoice.totalAmount), 470, y, { width: 90, align: 'right' });

    // Footer Note
    doc
      .fontSize(10)
      .fillColor('#888')
      .text(invoice.notes || 'Thank you for your business!', 40, 740, { align: 'center', width: 520 });

    doc.end();
  });
}


// ========== Helpers ==========
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ========== EMAIL ROUTE ==========
router.post('/:id/send-email', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'email name')
      .populate('items.product', 'name description');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePdf(invoice);

    // Send Email
    await sendInvoiceEmail({
      to: invoice.customer.email,
      subject: `Invoice #${invoice.invoiceNumber} from Your Company`,
      text: `Dear ${invoice.customer.name},\n\nPlease find attached your invoice #${invoice.invoiceNumber}.\n\nThank you for your business!`,
      html: `
        <p>Dear ${invoice.customer.name},</p>
        <p>Please find attached your invoice #${invoice.invoiceNumber}.</p>
        <p>Thank you for your business!</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      data: {
        invoiceId: invoice._id,
        sentTo: invoice.customer.email
      }
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
