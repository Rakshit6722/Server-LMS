const express = require('express');
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const dbConnect = require("./config/database")
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
// const { Credentials } = require('aws-sdk');


dotenv.config()
const PORT = 4000

dbConnect()

app.use(express.json())
app.use(cookieParser())
app.use(
    cors()
)

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp"
}))

cloudinaryConnect()

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: 'Your server is up and running....'
    });
});


app.listen(PORT, () => {
    console.log(`App is running at ${PORT}`)
})
