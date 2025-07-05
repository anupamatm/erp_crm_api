// backend/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

exports.sendInvoiceEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    await transporter.sendMail({
      from: `"Your Company" <${process.env.SMTP_FROM_EMAIL || 'noreply@yourcompany.com'}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};