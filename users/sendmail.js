const nodemailer = require('nodemailer');
const config = require('config.json');
const os = require("os");
const host = os.hostname();
const env = os.hostname()=='vpatlas.org'?'prod':('dev.vpatlas.org'?'dev-remote':'dev-local');

module.exports = {
    register: (userMail, token) => reset(userMail, token, 'registration'),
    reset: (userMail, token) => reset(userMail, token, 'reset'),
    new_email: (userMail, token) => reset(userMail, token, 'email')
};

/*
Send registration or reset email with token.
*/
function reset(userMail, token, type='registration') {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.vceEmail,
      pass: config.vcePassW
    },
    from: config.vceEmail
  });

  var url = `<a href=${config.server[env]}/confirm/registration?token=${token}>Confirm VPAtlas Registration</a>`;
  var sub = 'VPAtlas Registration';
  if (type == 'reset') {
    url = `<a href=${config.server[env]}/confirm/reset?token=${token}>Confirm VPAtlas Password Change</a>`;
    sub = 'VPAtlas Password Reset';
  }
  if (type == 'email') {
    url = `<a href=${config.server[env]}/confirm/email?token=${token}>Confirm VPAtlas Email Change</a>`;
    sub = 'VPAtlas Email Change';
  }

  var mailOptions = {
    from: config.vceEmail,
    to: userMail,
    subject: sub,
    html: url
  };

  /*
  To make sendmail work, log-in to the sending gmail account and turn-on 'less secure app access':
  - https://myaccount.google.com/lesssecureapps
  */
  return new Promise(function(resolve, reject) {
      transporter.sendMail(mailOptions, function(err, info) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Email sent: ' + info.response);
        resolve(info);
      }
    });
  });

}
