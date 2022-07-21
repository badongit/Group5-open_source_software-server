module.exports = {
  resetPassword: {
    SECRET: process.env.RESET_PASSWORD_SECRET,
    EXPIRED: +process.env.RESET_PASSWORD_EXPIRED || 10,
  },
  gmail: {
    USER: process.env.GMAIL_USERNAME,
    PASS: process.env.GMAIL_PASSWORD,
  },
  CLIENT_URI: process.env.CLIENT_URI || "http://localhost:5000",
};
