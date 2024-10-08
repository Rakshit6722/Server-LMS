const Course = require("../model/Course")
const RatingAndReview = require('../model/RatingAndReview')


exports.createRating = async (req, res) => {
    try {

        const userId = req.user.id
        const { rating, review, courseId } = req.body

        const courseDetails = await Course.findOne(
            {
                _id: courseId,
                studentsEnrolled: { $elematch: { $eq: userId } }
            }
        )

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Student is not enrolled in the course."
            })
        }

        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        })

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "Course is already reviewed by the user"
            })
        }

        const ratingReview = await RatingAndReview.create({
            rating,
            review,
            course: courseId,
            user: userId,
        })

        const updatedCourseDetails = await Course.findByIdAndUpdate(
            { _id: courseId },
            { $push: { ratingAndReview: ratingReview._id } },
            { new: true },
        )

        console.log(updatedCourseDetails)

        return res.status(200).json({
            success: true,
            message: "Rating and Review created Successfully",
            ratingReview
        })

    } catch (err) {
        console.log("Create Rating Error...", err)
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

exports.getAverageRating = async (req, res) => {
    try {
        const courseId = req.body.courseId

        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                }
            },
            {
                $group: {
                    _id: null,
                    averagerating: { $avg: "$rating" },
                }
            }
        ])

        if (result.length > 0) {
            return res.status(200).json({
                sucess: true,
                averagerating: result[0].averagerating,
            })
        }

        return res.status(200).json({
            success: true,
            message: "Average Rating is 0, no ratings given till now",
            averagerating: 0,
        })
    } catch (err) {
        console.log("Get Average Rating Error...", err)
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}


exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec()

        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data: allReviews,
        })
    } catch (err) {
        console.log("Get all Rating Error...", err)
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}