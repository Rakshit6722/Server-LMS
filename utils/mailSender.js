const nodemailer = require('nodemailer')
require('dotenv').config()

const mailSender = async (email, title, body) => {
    try {

        let transporter = nodemailer.createTransport({
            host: process.env.HOST,
            service: 'gmail',
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
            connectionTimeout: 60000,
            greetingTimeout: 60000

        })

        let info = await transporter.sendMail({
            from: 'rakshitchauhan435@gmail.com',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`
        })
        console.log(info)
        return info

    } catch (err) {
        console.log(err.message)
    }
}

module.exports = mailSender