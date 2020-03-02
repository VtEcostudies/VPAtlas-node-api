const nodemailer = require('nodemailer');
﻿const config = require('config.json');

module.exports = {
    reset
};

function reset(userMail, token) {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.vceEmail,
      pass: config.vcePassW
    }
  });

  var mailOptions = {
    from: config.vceEmail,
    to: userMail,
    subject: 'VPAtlas Password Reset',
    html: `<a href=https://vpatlas.org/users/confirm?${token}>Confirm VPAtlas Password Change</a>`
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
