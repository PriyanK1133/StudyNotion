const User = require('../models/User');
const bcrypt = require('bcrypt');
const mailSender = require('../utils/mailSender');
const crypto = require('crypto');

//reset password token --> mail sender
exports.resetPasswordToken = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.json({
                success: false,
                message: `This email:${email} not register with us, please register with us`,
            })
        }

        const token = crypto.randomUUID();

        const updatedDetails = await User.findOneAndUpdate({ email: email }, {
            token: token,
            resetPasswordExpires: Date.now() + 5 * 60 * 1000,
        }, { new: true })

        console.log("Detail", updatedDetails);

        const url = `http://localhost:3000/update-password/${token}`;

        await mailSender(email, "Password reset", `Your link for password reset please click ${url} this link to reset password`);

        res.json({
            success: true,
            message: "Email successfully sent please cheack your email",
        })
    } catch (error) {
        res.json({
            error: error.message,
            success: false,
            message: "Some error to send reset link",
        })
    }
}

//reset password --> db ma change mate

exports.resetPassword = async (req, res) => {

    try {
        const { password, confirmPassword, token } = req.body;
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password and confirm password do not match",
            })
        }

        const userDetails = await User.findOne({ token: token });

        if (!userDetails) {
            return res.json({
                success: false,
                message: "Token is invalid",
            })
        }

        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success: false,
                message: "Token is expire please regenerate new token",
            })
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        await User.findOneAndUpdate({ token: token }, { password: encryptedPassword }, { new: true });

        res.json({
            success: true,
            message: "Successfuly password update",
        })
    } catch (error) {
        return res.json({
            error: error.message,
            success: false,
            message: "some error while update password",
        })
    }
}