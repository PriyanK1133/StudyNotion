const { instance } = require('../config/razorpay');
const Course = require('../models/Course');
const crypto = require('crypto');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const mongoose = require('mongoose');
const { courseEnrollmentEmail } = require('../mail/templates/coureseEnrollmentEmail');
const { paymentSuccessEmail } = require('../mail/templates/paymentSuccessEmail');
const CourseProgress = require('../models/CourseProgress');

//capture payment and initiate razrorpay order
exports.capturePayment = async (req, res) => {
    const { courses } = req.body;
    const userId = req.user.id;

    if (courses.length === 0) {
        return res.json({
            success: false,
            message: "Please Provide course id",
        });
    }

    let total_amount = 0;

    for (const course_id of courses) {
        let course;
        try {
            course = await Course.findById(course_id);

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: "Could not find any course",
                })
            }

            //cheack user is alredy enroll in course
            const uid = new mongoose.Types.ObjectId(userId); //it used for convert string to object id

            if (course.studentsEnrolled.includes(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "Student already include in this course",
                })
            }

            total_amount += course.price;
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            })
        }
    }
    const options = {
        amount: total_amount * 100, //razorpay ma actual amount * 100 karvi pate 100.00 mate
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
    }

    try {
        //initiaze a payment
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);

        res.json({
            success: true,
            data: paymentResponse,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Could not initiate payment",
        })
    }
}

//verify payment 
exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;

    const userId = req.user.id;
    console.log("user id in verify payment",courses,userId);
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Payment failed",
        })
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET).update(body.toString()).digest("hex");

    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res);
        return res.status(200).json({
            success: true,
            message: "Payment Verified",
        });
    }

    return res.status(400).json({
        success: false,
        message: "Payment Failed",
    })
}

//send payment success mail
exports.sendPaymentSuccessEmail = async (req, res) => {
    console.log("in send payment success", req.query);
    const { orderId, paymentId, amount } = req.query;
    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide all details",
        });
    }

    try {
        const enrolledStudent = await User.findById(userId);

        await mailSender(
            enrolledStudent.email,
            `Payment Received`,
            paymentSuccessEmail(enrolledStudent.name, amount / 100, orderId, paymentId)
        );

        return res.status(200).json({
            success: true,
            message: "Email sent successfully",
        });
    } catch (error) {
        console.log("Error in sending mail", error);
        return res.status(500).json({
            success: false,
            message: "Could not send email",
            error: error.message,
        });
    }
};


//enroll student into the course
const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide courseid and userid",
        })
    }

    for (const courseId of courses) {
        try {
            //find course and enroll student in it
            const enrolledCourse = await Course.findByIdAndUpdate({ _id: courseId },
                {
                    $push: {
                        studentsEnrolled: userId,
                    }
                }, { new: true });

            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Course not found",
                })
            }

            console.log("Updated course", enrolledCourse);

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            })

            //find student and enrrol course in it

            const enrolledStudent = await User.findByIdAndUpdate(userId,
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id,
                    }
                }, { new: true });

            console.log("EnrolledStudent", enrolledStudent);

            const emailResponse = await mailSender(enrolledStudent.email,
                `Successfull enroll into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            )

            console.log("Email sent successfully", emailResponse.response);
        } catch (error) {
            console.log(error)
            return res.status(400).json({
                success: false,
                error: error.message,
            })
        }
    }
}