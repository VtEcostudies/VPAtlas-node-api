const nodemailer = require('nodemailer');
﻿const config = require('config.json');
const os = require("os");
const env = os.hostname()=='vpatlas.org'?'prod':'dev';

module.exports = {
    register: (userMail, token) => reset(userMail, token, false),
    reset
};

/*
Send registration or reset email with token.
*/
function reset(userMail, token, reset=true) {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.vceEmail,
      pass: config.vcePassW
    }
  });

  var url = `<a href=${config.server[env]}/confirm/registration?token=${token}>Confirm VPAtlas Registration</a>`;
  if (reset) url = `<a href=${config.server[env]}/confirm/reset?token=${token}>Confirm VPAtlas Password Change</a>`;

  var mailOptions = {
    from: config.vceEmail,
    to: userMail,
    subject: reset?'VPAtlas Password Reset':'VPAtlas Registration',
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
