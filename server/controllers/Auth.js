const User = require('../models/User');
const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const mailSender = require('../utils/mailSender');
const { passwordUpdated } = require('../mail/templates/passwordUpdate');


//singup
exports.signup = async (req, res) => {

    try {

        const { firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).send({
                success: false,
                message: "All fields are required",
            })
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match, please try again",
            })
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exits. Please sign in to continue",
            })
        }

        const response = await OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1);
        console.log(response);

        if (response.length === 0) {
            return res.status(400).json({
                success: false,
                message: "The otp is not valid",
            })
        } else if (otp !== response.otp) {
            return res.status(400).json({
                success: false,
                message: "Otp is not valid",
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        //find user is student or not
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        })

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
        })

        const payload = {
            email: user.email,
            id: user._id,
            accountType: user.accountType
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });

        user.token = token;
        user.password = undefined;

        const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        }

        res.cookie("token", token, options).status(200).json({
            success: true,
            token,
            user,
            message: "User Signup successfully",
        })

        // return res.status(200).json({
        //     success: true,
        //     user,
        //     message: "user register successfuly",
        // })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "user can not register please try again",
        })
    }
}
//login controller
exports.login = async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill up all required fields",
            })
        }

        const user = await User.findOne({ email }).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not exits, please sign up to continue",
            })
        }

        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "24h",
            });

            user.token = token;
            user.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }

            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "User Login successfully",
            })
        } else {
            return res.status(401).json({
                success: false,
                message: "password is incorrecetd",
            })
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Login fail please try again"
        })
    }
}

//send otp for email varification for new user
exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;


        const checkUserPresent = await User.findOne({ email });

        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User is already exits',
            })
        }

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        let result = await OTP.findOne({ otp: otp });
        console.log("OTP", otp)
        console.log("Result", result)
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp: otp });
        }

        const otpPayload = { email, otp };
        const otpBody = await OTP.create(otpPayload);
        console.log("otpbody", otpBody);

        res.status(200).json({
            success: true,
            message: "otp send successfully",
            otp,
        })
    } catch (error) {
        console.log(console.error);
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

//change password

exports.changePassword = async (req, res) => {

    try {

        //fetch user
        const userDetails = await User.findById(req.user.id);

        const { oldPassword, newPassword } = req.body;

        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "The password is incorected",
            })
        }

        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUserDetails = await User.findByIdAndUpdate(req.user.id, { password: encryptedPassword }, { new: true });

        //send mail for update password
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password has been update",
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email response", emailResponse.response);
        } catch (error) {
            console.error("Error while sending mail", error);
            return res.status(500).json({
                success: false,
                message: "error occured while sending mail",
                error: error.message,
            })
        }

        //return success
        return res.status(200).json({
            success: true,
            message: "Password successfully changed",
        })
    } catch (error) {
        console.error("Error while changing password", error);
        return res.status(500).json({
            success: false,
            message: "error while changing password",
            error: error.message,
        })
    }
}