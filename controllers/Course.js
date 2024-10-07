const Course = require('../model/Course')
const User = require('../model/User')
const Category = require('../model/Category')
const Section = require('../model/Section')
const SubSection = require('../model/SubSection')
const { uploadImageToCloudinary } = require('../utils/fileUpload')
const convertSecondsToDuration = require('../utils/secToDuration')
require('dotenv').config()
//create course
exports.createCourse = async (req, res) => {
    try {
        //fetch data
        const {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag: _tag,
            category,
            status,
            instructions: _instructions,
        } = req.body

        console.log('inside create courses')
        //thumbnail
        const thumbnail = req.files.thumbnailImage

        const tag = JSON.parse(_tag)
        const instructions = JSON.parse(_instructions)

        //validation
        if (
            !courseName ||
            !courseDescription ||
            !whatYouWillLearn ||
            !price ||
            !category ||
            !tag.length ||
            !thumbnail ||
            !instructions.length) {
            return res.status(401).json({
                succes: false,
                message: "All fields are required"
            })
        }

        if (!status || status === undefined) {
            status = "Draft"
        }
        //check for instructor
        const id = req.user.id
        const instructor = await User.findById(id, { accountType: "Instructor" })
        console.log(instructor)

        if (!instructor) {
            return res.status(401).json({
                success: false,
                message: "Instructor not found"
            })
        }

        //tag validation
        const findCategory = await Category.findById(category)
        if (!findCategory) {
            return res.status(401).json({
                success: false,
                message: "Category not found"
            })
        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME)


        //create entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            category,
            tag,
            category: findCategory._id,
            instructor: instructor._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions,
        })
        console.log("new course...")
        //add new course to user schema of Instructor profile
        await User.findByIdAndUpdate({ _id: instructor._id }, { $push: { courses: newCourse._id } }, { new: true })

        //update tag schema
        await Category.findByIdAndUpdate({ _id: category }, { $push: { courses: newCourse._id } }, { new: true })
        console.log(newCourse)
        return res.status(200).json({
            success: true,
            message: "Course added successfully",
            data: newCourse,
        })

    } catch (err) {
        console.log("Error while creating course ", err)
        res.status(500).json({
            success: false,
            message: "Error while creating course, please try again"
        })
    }
}


//edit course details
exports.editCourse = async (req, res) => {
    try {
        //fetch data
        const { courseId } = req.body
        const updates = req.body

        //check if course exist
        const course = await Course.findById(courseId)
        if (!course) {
            req.status(404).json({
                success: false,
                message: "Course not found"
            })
            console.log("Course not found...")
        }

        //check for thumbnail image and if found update it
        if (req.files) {
            console.log("thumbnail update")
            const thumbnail = req.files.thumbnailImage
            const thumbnailImage = await uploadImageToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME,
            )
            course.thumbnail = thumbnailImage.secure_url
        }

        //updates only the fields that are present in the req body
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
              if (key === "tag" || key === "instructions") {
                course[key] = JSON.parse(updates[key])
              } else {
                course[key] = updates[key]
              }
            }
          }
      
        await course.save()
      
        const updatedCourse = await Course.findOne({ _id: courseId, }).populate({
            path: "instructor",
            populate: {
                path: "additionalDetails",
            }
        })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            })
            .exec()

        res.json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        })


    } catch (err) {
        console.log("Edit Course backend...", err)
        res.status(500).json({
            success: false,
            message: "Internal server error",
            err: "edit course error"
        })
    }
}


//get course
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find({}, {
            courseName: true,
            courseDescription: true,
            price: true,
            instructor: true,
            ratingAndReview: true,
            studentEnrolled: true

        }).populate("instructor").exec();
        console.log(allCourses)

        res.status(200).json({
            success: true,
            message: "All courses fetched successfully",
            data: allCourses
        })

    } catch (err) {
        console.log("Error in fetching courses ", err)
        res.status(500).json({
            success: false,
            message: "Error in fetching courses"
        })
    }
}

//get given course details
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const courseDetails = await Course.findOne({ _id: courseId })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails"
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "videoUrl"
                },
            })
            .exec()
            
        console.log("course details:",courseDetails)
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }
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
            },
        })

    } catch (err) {

        console.log("Get Course Details backend...", err)

        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

//get full course Details
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
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
            .populate("ratingAndReviews")
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

        console.log("courseProgressCount: ", courseProgressCount)

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`
            })
        }

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


    } catch (err) {
        console.log('get course full details backend error')
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

//get instructor courses
exports.getInstructorCourses = async (req, res) => {
    try {

        const instructorId = req.user.id
        console.log("inside getInstuctor courses backend")
        const instructorCourses = await Course.find({
            instructor: instructorId
        }).sort({ createdAt: -1 })
        console.log("instructor courses found...")

        return res.status(200).json({
            success: true,
            data: instructorCourses,
        })

    } catch (err) {
        console.log("getInstructorCourses...", err)
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            err: err.message,
        })
    }
}


//delete the course
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body

        const course = Course.findById(courseId)
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }

        const studentsEnrolled = course.studentsEnrolled
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, { $pull: { courses: courseId } })
        }

        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
            const section = Section.findById(sectionId)
            if (section) {
                const subSection = section.subSection
                for (const subSectionId of subSection) {
                    await SubSection.findByIdAndDelete(subSectionId)
                }
            }
            await Section.findByIdAndDelete(sectionId)
        }

        await Course.findByIdAndDelete(courseId)

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        })
    } catch (err) {
        console.log("Delete course...", err)
        return res.status(500).json({
            success: false,
            message: "Server error",
            err: err.message
        })
    }
}
