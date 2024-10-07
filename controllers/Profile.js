const Profile = require('../model/Profile')
const User = require('../model/User')
const Course = require('../model/Course')
const CourseProgress = require('../model/CourseProgress')
const { uploadImageToCloudinary } = require('../utils/fileUpload')
const convertSecondsToDuration = require('../utils/secToDuration')
const mongoose = require('mongoose')

//update Profile
exports.updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth = "",
            contactNumber = "",
            about = "",
            gender = ""
        } = req.body
        const id = req.user.id

        const userDetails = await User.findById(id)
        if (firstName) {
            userDetails.firstName = firstName
        }
        if (lastName) {
            userDetails.lastName = lastName
        }

        await userDetails.save()

        const profile = await Profile.findById(userDetails.additionalDetails)
        profile.dateOfBirth = dateOfBirth
        profile.about = about
        profile.contactNumber = contactNumber
        profile.gender = gender

        await profile.save()

        const updatedUserDetails = await User.findById(id)
            .populate("additionalDetails")
            .exec()

        console.log(updatedUserDetails)
        return res.json({
            success: true,
            message: "Profile Updated Successfully",
            updatedUserDetails,
        })


    } catch (err) {
        console.log("Error in profile updation ", err)
        return res.status(500).json({
            success: false,
            message: "Profile updation failed"
        })
    }
}

//delete handler
exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.id
        console.log(id)
        const user = await User.findById(id)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User does not exists"
            })
        }

        await Profile.findByIdAndDelete({
            _id: new mongoose.Types.ObjectId(user.additionalDetails)
        })

        for (const courseId of user.courses) {
            await Course.findByIdAndUpdate(
                courseId,
                { $pull: { studentsEnrolled: id } },
                { new: true }
            )
        }

        await User.findByIdAndDelete({ _id: id })
        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        })

    } catch (err) {
        console.log("User deletion unsuccessfull ", err)
        return res.json(500).json({
            success: true,
            message: "User deletion unsuccessfull"
        })
    }
}

exports.getAllUserDetails = async (req, res) => {
    try {
        const id = req.user.id
        const userDetails = await User.findById(id)
            .populate("additionalDetails")
            .exec()

        console.log(userDetails)
        return res.status(200).json({
            success: true,
            message: "User Data fetched successfully",
            data: userDetails,
        })
    } catch (err) {
        console.log("Get All User Details Error...", err)
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

exports.updateDisplayPicture = async (req, res) => {
    try {
        const displayPicture = req.files.displayPicture
        const userId = req.user.id
        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000,
        )
        console.log(image)
        const updatedProfile = await User.findByIdAndUpdate(
            { _id: userId },
            { image: image.secure_url },
            { new: true },
        ).populate("additionalDetails")
        res.send({
            success: true,
            message: "Image Updated Successfully",
            data: updatedProfile,
        })
    } catch (err) {
        console.log("Update display picture error...", err)
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user and populate the necessary fields
        let userDetails = await User.findOne({ _id: userId })
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection",
                    },
                },
            })
            .exec();

        // Check if the user was found
        if (!userDetails || !userDetails.courses) {
            return res.status(404).json({
                success: false,
                message: `No user found with id: ${userId}`,
            });
        }

        // Convert to object and initialize necessary variables
        userDetails = userDetails.toObject();
        let subsectionLength = 0; // Variable to hold the number of subsections

        // Process each course to calculate total duration and progress
        for (let i = 0; i < userDetails.courses.length; i++) {
            let totalDurationInSeconds = 0;
            subsectionLength = 0;

            for (let j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[j].subSection.reduce(
                    (acc, curr) => acc + parseInt(curr.timeDuration), 0
                );
                userDetails.courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);
                subsectionLength += userDetails.courses[i].courseContent[j].subSection.length;
            }

            // Get course progress
            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId,
            });
            courseProgressCount = courseProgressCount?.completedVideos.length || 0;

            // Calculate progress percentage
            if (subsectionLength === 0) {
                userDetails.courses[i].progressPercentage = 100; // No sections means complete
            } else {
                const multiplier = Math.pow(10, 2);
                userDetails.courses[i].progressPercentage = Math.round((courseProgressCount / subsectionLength) * 100 * multiplier) / multiplier;
            }
        }

        // Return the courses array, even if it's empty
        return res.status(200).json({
            success: true,
            data: userDetails.courses, // Will return an empty array if no courses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



exports.instructorDashboard = async (req, res) => {
    try {
        const courseDetails = await Course.find({ instructor: req.user.id })
        console.log("inside instructor dashboard backend")
        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length
            const totalAmountGenerated = totalStudentsEnrolled * course.price

            const courseDataWithStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                totalStudentsEnrolled,
                totalAmountGenerated,
            }
            console.log("instructor course details:", courseDataWithStats)
            return courseDataWithStats

        })

        return res.status(200).json({
            success: true,
            courses: courseData,
        })
    } catch (err) {
        console.log("Instructor Dashboard", err)
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}