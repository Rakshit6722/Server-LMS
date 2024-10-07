const jwt = require('jsonwebtoken')
require('dotenv').config()
const User = require('../model/User')
//auth
exports.auth = async (req,res,next) => {
    try{
        //extract token
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ","")

        //token is missing
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing"
            })
        }

        //verify token
        try{
            const decode = await jwt.verify(token,process.env.JWT_SECRET)
            console.log(decode),
            req.user = decode
        }
        catch(err){
            return res.status(401).json({
                success:false,
                message:"token is missing"
            })
        }
        next();
    }catch(err){
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validating the token"
        })
    }
}


//isStudent
exports.isStudent = async(req,res,next)=>{
    try{
        if(req.user.accountType!=='Student'){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for student only"
            })
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified"
        })
    }
}


//isInstructor
exports.isInstructor = async(req,res,next)=>{
    try{
        if(req.user.accountType!=='Instructor'){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for instructor only"
            })
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified"
        })
    }
}

//isAdmin
exports.isAdmin = async(req,res,next)=>{
    try{
        if(req.user.accountType!=='Admin'){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for admin only"
            })
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified"
        })
    }
}