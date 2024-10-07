const mailSender = require('../utils/mailSender')
const { contactUsEmail } = require("../templates/contactFormRes")

exports.contactUsController = async (req, res) => {
    const { email, firstname, lastname, message, phoneNo, countrycode } = req.body
    console.log("contactUsController...", req.body)

    try {
        const emailRes = await mailSender(
            email,
            "Your Data Sent Successfully",
            contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
        )
        console.log("Email Res...", emailRes)
        return res.json({
            success: true,
            message: "Email sent successfully"
        })
    } catch (err) {
        console.log("Contact us Error", err)
        return res.json({
            success: false,
            message: "Something went wrong..."
        })
    }
}