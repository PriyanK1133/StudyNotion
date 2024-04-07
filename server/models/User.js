const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firstName:{
            type:String,
            required:true,
            trim:true,
        },
        lastName: {
            type:String,
            required:true,
            trim:true,
        },
        email:{
            type:String,
            required:true,
            trim:true,
        },
        password:{
            type:String,
            required:true,
        },
        accountType: {
            type:String,
            enum:['Admin','Student','Instructor'],
            required:true,
        },
        active:{
            //
            type:Boolean,
            default:true,   
        },
        approved:{
            //
            type:Boolean,
            default:true,
        },
        additionalDetails:{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"Profile",
        },
        courses: [
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'Course',
            }
        ],
        token:{
            //reset password haru use karava
            type:String,
        },
        resetPasswordExpires:{
            //reset password link expires mate
            type:Date,
        },
        image:{
            type:String,
            required:true,
        },
        courseProgress:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'courseProgress',
            }
        ]
        // Add timestamps for when the document is created and last modified
    },{timestamps:true} // createdAt and updatedAt will be automatically set
);

module.exports = mongoose.model("user",userSchema);