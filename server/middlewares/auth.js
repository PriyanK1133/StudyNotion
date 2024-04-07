const jwt = require('jsonwebtoken');
const User = require("../models/User");
require('dotenv').config();
//auth
exports.auth = async (req, res, next) => {

    try {
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                succuss: false,
                message: "Token missing",
            })
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "token is invalid",
            })
        }

        next();
    } catch (error) {
        console.error(error);
        return res.status.json({
            success: false,
            message: "Something went wrong while validating token",
        })
    }
}
//isStudent
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is protected route student only",
            })
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role can not be verify, please try again"
        })
    }
}
//isInstructor
exports.isInstructor = async (req, res, next) => {
    try {
        // const userDetails = await User.findOne({ email: req.user.email });
        // console.log(userDetails);

        // console.log(userDetails.accountType);
        if (req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "This is protected route Instructor only",
            })
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role can not be verify, please try again"
        })
    }
}
//isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "This is protected route Admin only",
            })
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role can not be verify, please try again"
        })
    }
}