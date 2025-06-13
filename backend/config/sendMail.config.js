const nodemailer = require ('nodemailer');
const fs = require ('fs');
const { promisify } =  require ('util');

const readFileAsync = promisify(fs.readFile);

const sendEmail = async (options) => {
  const htmlTemplate = await readFileAsync('./utils/template/mail.html', 'utf-8');
  const imageAttachment = await readFileAsync('./utils/template/assets/banner.jpg');

  const htmlContent = htmlTemplate
    .replace('[RecipientName]', options.name || 'HabiStreaker')
    .replace('[CompanyName]', 'HabiStreak')
    .replace('[Year]', new Date().getFullYear())
    .replace('[ResetLink]', options.message || '#');

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: htmlContent,
    attachments: [{
      filename: 'banner.jpg',
      content: imageAttachment,
      encoding: 'base64',
      cid: 'uniqueImageCID'
    }],
  };

  await transporter.sendMail(mailOptions);
};


module.exports = sendEmail