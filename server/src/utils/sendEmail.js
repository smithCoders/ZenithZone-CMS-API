const catchsync=require("./catchAsync");
const AppError=require("./appError")
const ejs=require("ejs");
const nodemailer=require("nodemailer");
exports.sendEmail=catchsync(async (email,subject,template,data)=>{
    const transporter=nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    })
    const html=await ejs.renderFile(`${__dirname},"../mails/activation_email.ejs",${template}.ejs`,data);
    const mailOptions={
        from:process.env.EMAIL,
        to:email,
        subject,
        html
    }
    await transporter.sendMail(mailOptions);
})