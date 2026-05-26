const nodemailer = require('nodemailer');
const { getSetting } = require('./settings');

async function getTransporter() {
  const host = await getSetting('smtp_host');

  if (!host) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.test@email.com',
        pass: 'test123'
      }
    });
  }

  const port = await getSetting('smtp_port');
  const secure = await getSetting('smtp_secure');
  const user = await getSetting('smtp_user');
  const pass = await getSetting('smtp_pass');

  return nodemailer.createTransport({
    host,
    port: Number(port || 587),
    secure: secure === 'true',
    auth: { user, pass },
    connectionTimeout: 10000,
    tls: { rejectUnauthorized: true }
  });
}

async function sendEmail({ to, subject, html, pdfBuffer, pdfFilename }) {
  try {
    const transport = await getTransporter();

    const smtpFrom = await getSetting('smtp_from');
    const mailOptions = {
      from: smtpFrom || '"Patient Feedback System" <noreply@hospital.com>',
      to,
      subject,
      html
    };

    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: pdfFilename || 'patient-feedback-report.pdf',
          content: pdfBuffer
        }
      ];
    }

    const info = await transport.sendMail(mailOptions);
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    if (e.code === 'EAUTH') {
      return { ok: false, error: 'SMTP authentication failed. Please check your email credentials.' };
    }
    if (e.code === 'ECONNECTION') {
      return { ok: false, error: 'Could not connect to SMTP server. Please check your SMTP settings.' };
    }
    return { ok: false, error: e.message };
  }
}

module.exports = { sendEmail };
