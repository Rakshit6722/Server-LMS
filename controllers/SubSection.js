const Section = require('../model/Section')
const SubSection = require('../model/SubSection')
const { uploadImageToCloudinary } = require('../utils/fileUpload')
require('dotenv').config()
const mongoose = require('mongoose')

exports.createSubSection = async (req, res) => {
    try {
        const { sectionId, title, description } = req.body
        const video = req.files.video

        if (!sectionId || !title || !description || !video) {
            return res.status(401).json({
                success: false,
                message: "All fields are required"
            })
        }
        console.log(video)

        // const findSection = await Section.findById(sectionId)
        // if(!findSection){
        //     return res.status(401).json({
        //         success:false,
        //         message:"Section do not exist"
        //     })
        // }

        const uploadedVideo = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)
        console.log(uploadedVideo)

        const subSection = await SubSection.create({
            title,
            timeDuration: `${uploadedVideo.duration}`,
            description,
            videoUrl: uploadedVideo.secure_url
        })

   

        const updatedSection = await Section.findByIdAndUpdate(sectionId, { $push: { subSection: subSection._id } }, { new: true })
            .populate("subSection")

        res.status(200).json({
            success: true,
            message: "Sub Section created successfully",
            data: updatedSection
        })


    } catch (err) {
        console.log("Error in sub section creation ", err);
        res.status(500).json({
            success: false,
            message: "Error in sub section creation"
        })
    }
}

exports.updateSubSection = async (req, res) => {
    try {

        const { sectionId, subSectionId, title, description } = req.body
        const subSection = await SubSection.findById(subSectionId)

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }
        if (title !== undefined) {
            subSection.title = title
        }

        if (description !== undefined) {
            subSection.description = description
        }

        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }
        await subSection.save()

        const updatedSection = await Section.findById(sectionId).populate(
            "subSection"
        )
        console.log("updated section", updatedSection)

        return res.json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection,
        })

    } catch (err) {
        console.error("update sub section error...", err)
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the section",
        })
    }
}

exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndDelete(sectionId,
            { $pull: { subSection: subSectionId } }
        )
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }
        const updatedSection = await Section.findById(sectionId).populate(
            "subSection"
        )
        return res.json({
            success: true,
            message: "SubSection deleted successfully",
            data: updatedSection,
        })
    } catch (err) {
        console.log("delete sub section error...", err)
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the SubSection",
        })
    }
}