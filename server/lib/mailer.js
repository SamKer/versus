const nodemailer = require('nodemailer');
const config = require('./config');
let transport = nodemailer.createTransport(config.mailer.transporter);

const Mailer = {

    send: (to, subject, message) => {
        let m = {
            from: config.mailer.from,
            to: to,
            subject: subject,
            text: message
        };
        transport.sendMail(m, function(err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info);
    }
});
    },
}

module.exports = Mailer;