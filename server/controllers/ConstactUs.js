const { contactUsEmail } = require('../mail/templates/contactFormRes');
const mailSender = require('../utils/mailSender');

exports.contactUsController = async (req, res) => {
    const { email, firstName, lastName, message, phoneNo, countryCode } = req.body;
    console.log(req.body);

    try {
        const emailRes = await mailSender(
            email,
            "Your data send successfully",
            contactUsEmail(email, firstName, lastName, message, phoneNo, countryCode)
        )
        console.log("EmailRes", emailRes);
        return res.json({
            success: true,
            message: "Mail send successfully",
        })
    } catch (error) {
        console.log("Error", error);
        console.log("Error messsage", error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong...",
        })
    }
}