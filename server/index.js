const express = require('express');
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

const database = require('./config/database');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const { cloudinaryConnect } = require('./config/cloudinary');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 4000;

database.connect();

//middleware
app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        origin: "https://studynotion-lyart.vercel.app",
        credentials: true,
    })
)


app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
)

cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Your server is running......",
    })
})

app.listen(PORT, () => {
    console.log(`Server is running in ${PORT}`)
})