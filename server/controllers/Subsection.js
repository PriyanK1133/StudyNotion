const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require('../utils/imageUploader');

//create new subsection

exports.createSubSection = async (req, res) => {
    try {
        const { sectionId, title, description } = req.body;
        const video = req.files.video;

        if (!sectionId || !title || !description || !video) {
            return res.status(404).json({
                success: false,
                message: "All fields are required",

            })
        }

        console.log(video);

        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        console.log(uploadDetails);

        //create new sub section
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })

        //update section acording newly added subsection
        const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId }, {
            $push: {
                subSection: SubSectionDetails.id,
            }
        }, { new: true }).populate("subSection").exec();

        return res.status(200).json({
            success: true,
            data: updatedSection,
            message: "SubSection created successfully",
        })
    } catch (error) {
        console.error("Error while creating subsection", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

//update subsection
exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description } = req.body;
        const subSection = await SubSection.findById(subSectionId);

        if (!subSectionId) {
            return res.status(404).json({
                success: false,
                message: "Subsection not found",
            })
        }

        if (title !== undefined) {
            subSection.title = title;
        }

        if (description !== undefined) {
            subSection.description = description;
        }

        if (req.files && req.files.video !== undefined) {
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
            subSection.url = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`;
        }

        await subSection.save();

        //find update section
        const updateSection = await Section.findById(sectionId).populate('subSection');

        console.log("Update section", updateSection);

        return res.status(200).json({
            success: true,
            message: "Section update successfully",
            data: updateSection,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}

//delete subsetion
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId,sectionId } = req.body;

        await Section.findByIdAndUpdate({ _id: sectionId }, {
            $pull: {
                subSection: subSectionId,
            }
        })

        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId });

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "Subsection not found",
            })
        }

        const updatedSection = await Section.findById(sectionId).populate("subSection");

        return res.status(200).json({
            success: true,
            message: "Subsection deleted successfully",
            data: updatedSection,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error accured while deleting the subsection"
        })
    }
}

