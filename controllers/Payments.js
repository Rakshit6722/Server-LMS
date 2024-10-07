const { instance } = require('../config/razorpay')
const Course = require('../model/Course')
const User = require('../model/User')
const mailSender = require('../utils/mailSender')
const { courseEnrollmentEmail } = require('../templates/courseEnrollmentEmail')
const mongoose = require('mongoose')
const crypto = require('crypto')
const { paymentSuccessEmail } = require('../templates/paymentSuccessEmail')

//computer the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {

    const { courses } = req.body
    const userId = req.user.id

    if (courses.length === 0) {
        return res.json({
            success: false,
            message: "Please Provide Course ID"
        })
    }

    let total_amount = 0

    for (const courseId of courses) {
        let course
        try {
            course = await Course.findById(courseId)
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: "Could not find the course",
                })
            }

            const uid = new mongoose.Types.ObjectId(userId)
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({
                    success: false,
                    message: "Student is already Enrolled",
                })
            }
            total_amount += course.price
        } catch (err) {
            console.log("Capture Payment Error...", err)
            return res.status(500).json({
                success: false,
                message: err.message,
            })
        }
    }

    const options = {
        amount: total_amount * 100,
        currency: "INR",
        receipt: Math.random(Date.now().toString()),
    }

    try {
        const paymentResponse = await instance.orders.create(options)
        console.log(paymentResponse)
        res.json({
            sucess: true,
            data: paymentResponse
        })
    } catch (err) {
        console.log("Paymnet Capture Error...", err)
        res.status(500).json({
            success: false,
            message: "Could not initate order"
        })
    }



}


//verify Signature of Razorpay and Server
exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id
    const razorpay_payment_id = req.body?.razorpay_payment_id
    const razorpay_signature = req.body?.razorpay_signature
    const courses = req.body?.courses

    const userId = req.user.id

    if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !courses ||
        !userId
    ) {
        return res.status(200).json({
            success: false,
            message: "Payment failed"
        })
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
        .createHamc("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex")

    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res)
        return res.status(200).json({
            success: true,
            message: "Payment Verified"
        })
    }
    return res.status(200).json({
        success: false,
        message: "Payment Failed"
    })
}

exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body

    const userId = req.user.id

    if (!orderId || !parymentId || !amount || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide all the details"
        })
    }

    try {
        const enrollStudents = await User.findById(userId)

        await mailSender(
            enrollStudents.email,
            'Payment Received',
            paymentSuccessEmail(
                `${enrollStudents.firstName} ${enrollStudents.lastName}`,
                amount / 100,
                orderId,
                paymentId
            )
        )
    } catch (err) {
        console.log("Error in sending payment success mail", err)
        return res.status(400).json({
            success: false,
            message: "Could not send email",
        })
    }
}


exports.enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide CourseId and UserId"
        })
    }

    for (const courseId of courses) {
        try {
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnrolled: userId } },
                { new: true }
            )

            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Course not found",
                })
            }

            console.log("Update courses: ", enrolledCourse)

            const courseProgress = await courseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            })

            const enrolledStudent = await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id,
                    }
                },
                { new: true },
            )

            console.log("Enrolled Student: ", this.enrolledStudents)

            const emailResponse = await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            )

            console.log('Email sent successfully: ', emailResponse.response)

        } catch (err) {
            console.log("Error in enrolling student...", err)
            return res.status(400).json({
                success: false,
                message: "error in enrolling student"
            })
        }
    }
}