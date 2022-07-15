const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      type: "login",
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const message = {
    from: `Admin ${process.env.GMAIL_USER} `,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  return info;
};

module.exports = sendMail;
