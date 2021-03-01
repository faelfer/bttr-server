var nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.ACCOUNT_EMAIL,
        pass: process.env.ACCOUNT_PASS
    }
});

module.exports = function sendEmail(message) {
    try {

        const info = transporter.sendMail(message);

        console.log("sendEmail | URL: ", nodemailer.getTestMessageUrl(info));

        return info;

    } catch (error) {
      console.log("sendEmail | error: ", error)
    }
};
  