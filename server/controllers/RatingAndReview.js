const RatingAndReview = require('../models/RatingAndReview');
const Course = require('../models/Course');
const { mongoose } = require('mongoose');

//createRating 
exports.createRating = async (req, res) => {
    try {
        const userId = req.user.id;
        const { rating, review, courseId } = req.body;

        //cheack user is enrool or not 
        const courseDetails = await Course.findOne({
            _id: courseId,
            studentsEnrolled: { $elemMatch: { $eq: userId } },
        });

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enroll in this course',
            });
        }

        //cheack user alredy revewd or not
        const alreadyReviewed = await RatingAndReview.findOne({ user: userId, course: courseId });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "User already reviewed",
            })
        }

        //create reating and review
        const ratingReview = await RatingAndReview.create({ rating, review, course: courseId, user: userId });

        //update course whith thi rating and review

        const updatedCourseDetails = await Course.findByIdAndUpdate({ _id: courseId }, {
            $push: {
                ratingAndReview: ratingReview._id,
            }
        },{new:true})

        console.log(updatedCourseDetails);

        return res.status(200).json({
            success: true,
            message: "Rating and review created successfully",
            ratingReview,
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//getAverageRating
exports.getAverageRating = async (req, res) => {
    try {
        const courseId = req.body.courseId;

        const result = await RatingAndReview.aggregate([
            {
                $metch: {
                    course: new mongoose.Types.ObjectId(courseId),
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                }
            }
        ]);

        //return rating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })
        }

        //if no rating and review
        return res.status(200).json({
            success:true,
            message:"NO rating till now",
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//getAllRAting and review

exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image"
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "All reviewd fetch successfully",
            data: allReviews,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}