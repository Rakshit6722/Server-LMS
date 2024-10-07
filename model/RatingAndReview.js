const mongoose = require('mongoose')

const ratingAndReviewSchema = new mongoose.Schema({
    user: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    rating: {
        type: Number,
        required: true
    },
    review: {
        type: String,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        index: true,
    }
})

module.exports = mongoose.model("RatingAndReview", ratingAndReviewSchema)