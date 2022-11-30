// const ErrorHander = require("../utils/errorHander");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = async (req,res,next) => {

    try {
        const token = req.cookies.jwtoken;
        const verifyToken = jwt.verify(token,process.env.JWT_SECRET);

        const rootUser = await User.findOne({_id:verifyToken._id, "tokens.token":token});

        if(!rootUser){
            throw new Error('User not found')
        }
        
        req.token = token;
        req.rootUser = rootUser;
        req.userID = rootUser._id;

        next();

    } catch (error) {
        res.status(401).send('Please Login to access this resource')
        console.log(error);
    }

    // if(!token){
    //     return next(new ErrorHander ("Please Login to access this resource", 401));
    // }

    // const decodedData = jwt.verify(token,process.env.JWT_SECRET);

    // req.user = await User.findById(decodedData.id)
    // next();
}


exports.authorizeRoles = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return next (new ErrorHander(`Role : ${req.user.role} is not allowed to access this resource`,403));
        }

        next();
    }
}