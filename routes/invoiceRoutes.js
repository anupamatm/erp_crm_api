const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { sendInvoiceEmail } = require('../services/emailService');
const PDFDocument = require('pdfkit');

// ========== PDF GENERATION ==========
async function generateInvoicePdf(invoice) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Header
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('INVOICE', 50, 50, { align: 'right' })
      .fontSize(10)
      .text(`Invoice #${invoice.invoiceNumber}`, 50, 50)
      .text(`Date: ${formatDate(invoice.issueDate)}`, 50, 65)
      .text(`Due Date: ${formatDate(invoice.dueDate)}`, 50, 80)
      .moveDown();

    // Customer Info
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('Bill To', 50, 160)
      .fontSize(10)
      .text(invoice.customer.name, 50, 190)
      .text(invoice.billingAddress?.street || '', 50, 205)
      .text(
        `${invoice.billingAddress?.city || ''}, ${invoice.billingAddress?.state || ''} ${invoice.billingAddress?.zipCode || ''}`,
        50,
        220
      )
      .text(invoice.billingAddress?.country || '', 50, 235)
      .moveDown();

    // Table Header
    const invoiceTableTop = 300;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Item', 50, invoiceTableTop)
      .text('Description', 150, invoiceTableTop)
      .text('Unit Price', 280, invoiceTableTop, { width: 90, align: 'right' })
      .text('Qty', 370, invoiceTableTop, { width: 90, align: 'right' })
      .text('Total', 0, invoiceTableTop, { align: 'right' });

    // Table Rows
    let y = invoiceTableTop + 20;
    doc.font('Helvetica').fontSize(10);
    invoice.items.forEach((item) => {
      doc
        .text(item.product?.name || 'N/A', 50, y)
        .text(item.description || '', 150, y, { width: 100, lineGap: 5 })
        .text(formatCurrency(item.unitPrice || 0), 280, y, { width: 90, align: 'right' })
        .text(item.quantity.toString(), 370, y, { width: 90, align: 'right' })
        .text(
          formatCurrency((item.unitPrice || 0) * item.quantity),
          0,
          y,
          { align: 'right' }
        );
      y += 20;
    });

    // Totals
    const subtotalY = y + 10;
    doc
      .font('Helvetica-Bold')
      .text('Subtotal', 350, subtotalY, { align: 'right' })
      .text(formatCurrency(invoice.subtotal), 0, subtotalY, { align: 'right' });

    if (invoice.tax) {
      const taxY = subtotalY + 20;
      doc
        .font('Helvetica')
        .text(`Tax (${invoice.tax}%)`, 350, taxY, { align: 'right' })
        .text(formatCurrency(invoice.totalAmount - invoice.subtotal), 0, taxY, { align: 'right' });
    }

    const totalY = invoice.tax ? subtotalY + 40 : subtotalY + 20;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total', 350, totalY, { align: 'right' })
      .text(formatCurrency(invoice.totalAmount), 0, totalY, { align: 'right' });

    // Footer
    doc
      .fontSize(10)
      .text(
        'Thank you for your business!',
        50,
        700,
        { align: 'center', width: 500 }
      );

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
