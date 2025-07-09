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


// Function to send coupon email
exports.sendCouponEmail = async (to, coupon) => {
  const mailOptions = {
    from: `"Your Store" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎉 Your ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : '$'} Discount Code!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Here's your exclusive discount!</h2>
        <p>Use the code below at checkout to get your discount:</p>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="margin: 0; color: #1890ff; font-size: 32px; letter-spacing: 2px;">
            ${coupon.code}
          </h1>
          <p style="margin: 10px 0 0;">
            ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : '$'} off
            ${coupon.minPurchase ? `on orders over $${coupon.minPurchase}` : ''}
          </p>
        </div>

        <p>Valid until: ${new Date(coupon.validUntil).toLocaleDateString()}</p>
        
        <p>Happy shopping!<br>The Store Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
  