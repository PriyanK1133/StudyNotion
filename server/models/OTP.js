const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const emailTemplate = require('../mail/templates/emailVerificationTemplate');

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5, //document automaticaly deleted after 5 minutes
    },
});

async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(
            email,
            "Verification email by StudyNotion",
            emailTemplate(otp),
        );
        console.log("Email send succesfully", mailResponse);
    } catch (error) {
        console.log("Error while send mail", error);
        throw error;
    }
}

OTPSchema.pre("save", async function (next) {

    //only send mail when new document is created
    if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
})

// const OTP = mongoose.model("OTP",OTPSchema);
// module.exports = OTP;
module.exports = mongoose.model('OTP', OTPSchema);