const Section = require('../model/Section')
const Course = require('../model/Course')
const SubSection = require('../model/SubSection')

exports.createSection = async (req, res) => {
    try {
        const { sectionName, courseId } = req.body
        if (!sectionName || !courseId) {
            return res.status(401).json({
                success: false,
                message: "Enter all details"
            })
        }
        console.log("inside create section")

        const savedSection = await Section.create({ sectionName })

        console.log("saved section")

        const updatedCourse = await Course.findByIdAndUpdate(courseId, { $push: { courseContent: savedSection._id } }, { new: true })
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            })
            .exec()

            console.log("updated course")


        return res.status(200).json({
            success: true,
            message: "Section creation successfull",
            updatedCourse,
        })

    } catch (err) {
        console.log("Error in section creation ", err)
        return res.status(500).json({
            success: false,
            message: "Section creation failed"
        })
    }
}

exports.updateSection = async (req, res) => {
    try {

        const { sectionName, sectionId, courseId } = req.body

        if (!updateName || !sectionId) {
            return res.status(401).json({
                success: false,
                message: "all fields are required"
            })
        }

        const course = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            })
            .exec()

        const section = Section.findByIdAndUpdate(sectionId, { sectionName: sectionName }, { new: true })

        res.status(200).json({
            success: true,
            message: "Section updated successfully" + section,
            data: course
        })



    } catch (err) {
        console.log("Error in section updation ", err)
        return res.status(500).json({
            success: false,
            message: "Section updation failed"
        })
    }
}

exports.deleteSection = async (req, res) => {
    try {

        const { sectionId, courseId } = req.body

        if (!sectionId || !courseId) {
            return res.status(401).json({
                success: false,
                message: "all fields are required"
            })
        }

        // const findCourse = await Course.findByIdAndUpdate(courseId,{$pull:{whatYouWillLearn:sectionId}},{new:true})

        await Course.findByIdAndUpdate(courseId,
            { $pull: { courseContent: sectionId } }
        )

        const section = Section.findById(sectionId)
        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            })
        }

        await SubSection.deleteMany({ _id: { $in: section.subSection } })

        await Section.findByIdAndDelete(sectionId)

        const course = await Course.findById(courseId).populate({
            path: "courseContent",
            populate: {
                path: "subSection"
            }
        })
            .exec();

        res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data:course
        })


    } catch (err) {
        console.log("Error in section deletion ", err)
        return res.status(500).json({
            success: false,
            message: "Section deletion failed"
        })
    }
}
