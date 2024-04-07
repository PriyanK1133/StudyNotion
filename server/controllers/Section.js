const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const Course = require('../models/Course');

//Create new section
exports.createSection = async (req, res) => {
    try {
        const { sectionName, courseId } = req.body;

        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing Required properties",
            })
        }

        //create section
        const newSection = await Section.create({ sectionName });

        //section add in Course
        const updatedCourse = await Course.findByIdAndUpdate(courseId, {
            $push: {
                courseContent: newSection._id,
            }
        }, { new: true }).populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            }
        }).exec();      //populaet section and subsection bane populate karse

        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourse,
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Interanal server error",
            error: error.message,
        })
    }
}

//update section 
exports.updateSection = async (req, res) => {
    try {
        const { sectionName, sectionId, courseId } = req.body;

        const section = await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });

        const course = await Course.findById(courseId).populate({
            path: 'courseContent',
            populate: {
                path: "subSection",
            }
        }).exec();

        return res.status(200).json({
            success:true,
            message:section,
            data:course,
            
        })

    } catch (error) {
        console.error("Error while update section",error);
        res.status(500).json({
            success: false,
            message: "Interanal server error",
            error: error.message,
        })
    }
}

//delete section

exports.deleteSection = async(req,res) =>{
    try {
        const {sectionId,courseId} = req.body;

        await Course.findByIdAndDelete(courseId,{
            $pull:{
                courseContent:sectionId,
            }
        })

        const section = await Section.findById(sectionId);
        console.log(sectionId,courseId);

        if(!section){
            return res.status(404).json({
                success:false,
                message:"Section Not found",
            })
        }
        
        //delete subsection
        await SubSection.deleteMany({_id:{$in:section.subSection}});  //many item delete

        await Section.findByIdAndDelete(sectionId);
        //find updated course 
        const course = await Course.findById(courseId).populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            }
        }).exec();

        return res.status(200).json({
            success:true,
            message:"Section delete successfully",
            data:course,
        })
    } catch (error) {
        console.error("Error deleting section",error);
        res.status(500).json({
            success:false,
            message:"Internal server error",
        })
    }
}