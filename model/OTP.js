const mongoose = require('mongoose')
const mailSender = require('../utils/mailSender')
const otpTemplate = require('../templates/emailVerificationTemplate')

const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:5*60
    }
})

//to signup we will send a otp to user and if user fills correct otp then only we will save user entry into database
//to implement this we need to create a pre middleware between opt schema and otp model

async function sendVerificationEmail(email,otp){
    try{
        const mailResponse = await mailSender(email,"Verfication email from StudyNotion",otpTemplate(otp))
        console.log('email sent successfully: ',mailResponse)
    }catch(err){
        console.log('Error occured while sending email')
        console.log(err)
        throw err
    }
}   

otpSchema.pre("save",async function(next){
    await sendVerificationEmail(this.email,this.otp);//this is used here to use email and otp of the current docuement that is the document to be saved
    next();
})


module.exports = mongoose.model("OTP",otpSchema)