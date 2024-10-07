const CourseProgress = require("../model/CourseProgress")
const SubSection = require("../model/SubSection")


exports.updateCourseProgress = async (req, res) => {
    const { courseId, subsectionId } = req.body
    const userId = req.user.id

    try {
        const subsection = await SubSection.findById(subsectionId)
        if (!subsection) {
            return res.status(404).json({
                success: false,
                message: "Invalid subsection"
            })
        }

        let courseProgress = await CourseProgress.findOne({
            courseId: courseId,
            userId: userId,
        })
        if (!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "Course progress does not exist"
            })
        } else {
            if (CourseProgress.completedVideos.includes(subsectionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Course progress does not exist",
                })
            }
            courseProgress.completedVideos.push(subsectionId)
        }
        await courseProgress.save()

        return res.status(200).json({
            success: true,
            message: "Course progress updated"
        })

    } catch (err) {
        console.log("Update course progress error...", err)
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}