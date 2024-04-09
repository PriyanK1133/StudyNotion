const Course = require('../models/Course');
const Category = require('../models/Category');
const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const User = require("../models/User");
const { uploadImageToCloudinary } = require('../utils/imageUploader');
require('dotenv').config();
const { convertSecondsToDuration } = require("../utils/secToDuration");
const { default: mongoose } = require('mongoose');
const CourseProgress = require("../models/CourseProgress");


//function to create new course
exports.createCourse = async (req, res) => {
    try {
        //get user id from request object
        const userId = req.user.id;

        const {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag,
            category,
            status,
            instructions,
        } = req.body;

        const thumbnail = req.files.thumbnailImage;

        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag.length || !thumbnail || !category || !instructions.length) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",

            })
        }

        // if (!status || status === undefined) {
        //     status = "Draft";
        // }

        //cheack user is instruactor
        const instructorDetails = await User.findById(userId, { accountType: "Instructor" });

        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor detail not found",
            })
        }

        //tag is valid or not
        const categoryDetail = await Category.findById(category);
        if (!categoryDetail) {
            return res.status(404).json({
                success: false,
                message: "Category detail not found",
            })
        }

        //upload image to cloudinary

        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
        console.log(thumbnailImage);

        //create course

        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag,
            category: categoryDetail._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions,
        })

        //add new course to user schema of the instructor
        await User.findByIdAndUpdate(instructorDetails._id, { $push: { course: newCourse._id } }, { new: true });
        //add new course to category
        const categoryDetails2 = await Category.findByIdAndUpdate(category, { $push: { course: newCourse._id } }, { new: true });

        console.log("category", categoryDetails2);

        res.status(200).json({
            success: true,
            data: newCourse,
            message: "Course Created Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to created new course",
        })
    }

}

//getAll course
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find(
            { status: "Published" },
            { courseName: true, price: true, thumbnail: true, instructor: true, ratingAndReview: true, studentsEnrolled: true }
        ).populate('instructor').exec();
        return res.status(200).json({
            success: true,
            data: allCourses,
        })
    } catch (error) {
        console.log(error);
        return res.status(404).json({
            success: false,
            error: error.message,
            message: "Cant fetch course data",
        })
    }
}

//edit course
exports.editCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const updates = req.body;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                error: "Course not found",
            })
        }

        //if thumbnail image found update it
        if (req.files) {
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
            course.thumbnail = thumbnailImage.secure_url;
        }

        //upload only fild that present in updates 
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(updates[key]);
                } else {
                    course[key] = updates[key];
                }
            }
        }

        await course.save();

        const updatedCourse = await Course.findOne({
            _id: courseId,
        }).populate({
            path: "instructor",
            populate: {
                path: "additionalDetails",
            }
        }).populate("category")
            .populate("ratingAndReview")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                }
            }).exec();

        res.json({
            success: true,
            message: "Course update successfuly",
            data: updatedCourse,
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Interanl server error",
            error: error.message,
        })
    }
}

//get course detail
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const courseDetails = await Course.findOne({ _id: courseId })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                }
            })
            .populate("category")
            .populate("ratingAndReview")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "-videoUrl"  //here - mean specific field ne bare
                }
            }).exec()

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `can not find course with id:${courseId}`,
            })
        }

        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDuration = parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDuration;
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
            }
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.messsage,
        })
    }
}

exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.query;
        const userId = req.user.id
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")   
            .populate("ratingAndReview")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec()

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })

        console.log("courseProgressCount : ", courseProgressCount)

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }

        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                    ? courseProgressCount?.completedVideos
                    : [],
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


//Get a list of course of given instructor
exports.getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;

        //find courses
        const instructorCourses = await Course.find({
            instructor: instructorId,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: instructorCourses,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrive instructor courses",
            error: error.message,
        })
    }
}

//delete the course
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).josn({
                success: false,
                message: "Can not found",
            })
        }

        //un enroll student from course
        const studentsEnroled = course.studentsEnrolled;
        for (const studentId of studentsEnroled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: {
                    courses: courseId,
                }
            })
        }

        //delete section and subsection 
        const courseSections = course.courseContent;
        for (const sectionId of courseSections) {
            //delete subsection for each section
            const section = await Section.findById(sectionId)
            if (section) {
                const subSections = section.subSection;
                for (const subSectionId of subSections) {
                    await SubSection.findByIdAndDelete(subSectionId);
                }
            }

            //delete section 
            await Section.findByIdAndDelete(sectionId);
        }

        //delete the course
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course delete successfully",
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        })
    }
}