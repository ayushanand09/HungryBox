// const ErrorHander = require("../utils/errorHander");
// const sendToken = require("../utils/jwttoken");
// const sendEmail = require("../utils/sendEmail");
// const crypto = require("crypto");

const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const express = require("express")
const cookieParser = require("cookie-parser");
const app = express();
// const cors = require("cors");
// app.use(cors({origin:'http://localhost:3000',credentials: true}));
app.use(express.json());
app.use(cookieParser());


//Register a user
exports.registerUser = async (req,res,next) => {
    const {name, email, password} = req.body

    if(!name || !email || !password){
        return res.status(422).json({
            error: "Please fill all the required fields"
        })
    }
    try {
        const userExist = await User.findOne({ email:email });
        if(userExist){
            return res.status(422).json({error: "Email already registered"})
        }
        else{
            const user = new User({name,email,password});
            await user.save();

            res.status(201).json({message: "User registered successfully"})
        }

    } catch (error) {
        console.log(error);
    }

    // const {name, email, password} = req.body
    // User.findOne({email: email}, (err, user) => {
    //     if(user) {
    //         res.status({message: "User already exists"})
    //     } else {
    //         const user = new User({
    //             name: name,
    //             email: email,
    //             password: password
    //         })
    //         user.save((err) => {
    //             if(err) {
    //                 res.status(err)
    //             } else {
    //                 res.status({message: "Successfully registered!!! Please login now."})
    //                 sendToken(user,201,res);
    //             }
    //         })
    //     }
    // })

    // const user = await User.create({
    //     name,
    //     email,
    //     password,
    // });

    // sendToken(user,201,res);
};

//Login User
exports.loginUser = async (req,res,next) => {
    try {
        const {email, password} = req.body;
        
        //checking if user has given both email and password
        if(!email || !password){
            return next(new ErrorHander("Please enter email and password",400))
        }
        // const user  = await User.findOne({email}).select("+ password");
        const user  = await User.findOne({email:email});

        if(user){ 
            const isPasswordMatched = await bcrypt.compare(password,user.password);
            const token = await user.generateAuthToken();
            console.log(token);
            
            res.cookie("jwtoken",token, {
                expires: new Date(Date.now() + 25892000),
                httpOnly:true
            });

            // res.cookie('jwtoken',token, {
            //     path: '/',
            //     expires: new Date(Date.now() + 5*1000),
            //     httpOnly: true,
            // }).send("cookie being initialized")

            if(!isPasswordMatched){
                res.status(400).json({message: "Invalid Credentials"});
            }

            else{
                res.json({message: "User sign in successfully"});
            }
        }
        else{
            res.status(400).json({message: "Invalid Credentials"});
        }
        // Using imported function
        // sendToken(user,200,res);
    } catch (error) {
        console.log(error);
    }
}

exports.showAboutMe = async (req,res,next) => {
    console.log(`Hello my about`);
    res.send(req.rootUser);
    res.send("hello");
}
//Logout
exports.logout = async(req,res,next) => {
    // res.cookie("jwtoken",null,{
    //     expires: new Date(Date.now()),
    //     httpOnly: true,
    // });

    res.clearCookie('jwtoken', {path: '/'});
    res.status(200).json({
        success: true,
        message: "Logged out",
    });
};

//Forgot Password
exports.forgotPassword = async(req,res,next) => {
    const user = await User.findOne({email: req.body.email});
    
    if(!user){
        return next(new ErrorHander("User not found",404));
    }

    //Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false});

    const resetPasswordURL = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is : \n\n ${resetPasswordURL} \n\n If you have not requested this email then, please ignore it `;

    try {
        await sendEmail({
            email: user.email,
            subject: `Demo Password Recovery`,
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave: false});

        return next(new ErrorHander(error.message, 500));
    }
}

//Reset Password
exports.resetPassword = async(req,res,next) => {

    // Creating token hash
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if(!user){
        return next(new ErrorHander("Reset Password Token is invalid or has been expired",404));
    }


    if(req.body.password !== req.body.confirmedPassword){
        return next(new ErrorHander("Password does not match",404));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user,200,res);
}

// Get User detail
exports.getUserDetail = async (req,res,next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,
    });
};

// Update User password
exports.updateUserPassword = async (req,res,next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
        return next(new ErrorHander("Old passowrd is incorrect",400));
    }

    if(req.body.newPassword!==req.body.confirmPassword ){
        return next(new ErrorHander("Password does not macth",400));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user,200,res);
};
// Update User password
exports.updateUserPassword = async (req,res,next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
        return next(new ErrorHander("Old passowrd is incorrect",400));
    }

    if(req.body.newPassword!==req.body.confirmPassword ){
        return next(new ErrorHander("Password does not macth",400));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user,200,res);
};
// Update User password
exports.updateUserPassword = async (req,res,next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
        return next(new ErrorHander("Old passowrd is incorrect",400));
    }

    if(req.body.newPassword!==req.body.confirmPassword ){
        return next(new ErrorHander("Password does not macth",400));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user,200,res);
};

// Update User Profile
exports.updateUserProfile = async (req,res,next) => {
    
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }
    //we will add cloudinary later. It is used for avatar
    const user = await User.findByIdAndUpdate(req.user.id,newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: "Updated profile successfully",
        newUserData
    })
};

//Get all users ---> admin
exports.getAllUsers = async (req,res,next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
}

//Get a single user -- ADMIN    
exports.getSingleUser = async (req,res,next) => {
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHander(`User does not exit with the id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
}

// Update User Role -- ADMIN
exports.updateProfile = async (req,res,next) => {
    
    const newUserData = {
        role: req.body.role
    }
    
    //we will add cloudinary later. It is used for avatar
    const user = await User.findByIdAndUpdate(req.params.id,newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    if(!user){
        return next(new ErrorHander(`User does not exist with Id: ${req.params.id}`),404)
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Updated profile successfully",
        newUserData
    })
};

// Delete User -- ADMIN
exports.deleteProfile = async (req,res,next) => {
    const user = await User.findById(req.params.id);

    //We will remove cloudinary later

    if(!user){
        return next(new ErrorHander(`User does not exist with Id: ${req.params.id}`),404)
    }

    await user.remove(); 

    res.status(200).json({
        success: true,
        message: "Deleted profile successfully",
    })
};

// app.listen(4000);