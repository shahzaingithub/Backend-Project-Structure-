import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// user exist
import { User } from '../model/user.model.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';

import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser=asyncHandler (async(req,res)=>{

    // register user steps 
// 1) Get user details from frontend
// 2) validation -not empty
// 3) check if user already exist : username ,email
// 4)check for coverImage ,chch for avatar
// 5) upload them to cloudinary ,avatar
// 6) create user object  - create entry in db
// 7) remove password and refresh token field from response
// 8) check for user creation
// 9) return response


    // res.status(200).json({
    //     message:"your api is running"
    // })
    const {fullName,email,username,password}= req.body
    console.log("email:",email);

    // validation check
    // // this is wrong practice 
    // if (fullName==="") {
    //     throw new ApiError(400,"Fullname is required");
    // }
    // this is good practice

    if (
        [fullName,email,username,password].some((field)=>
    field?.trim()==="")
    ) {
        throw new ApiError(400,"All field are required")
    }

    // validation done

    // check user exists 
    const existedUser=await User.findOne({
        $or:[{ username } , { email }]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required");
    }

    // now uplload them to cloudinary 
   const avatar = await uploadonCloudinary(avatarLocalPath)
   const coverImage = await uploadonCloudinary(coverImageLocalPath)

    

   if(!avatar){
    throw new ApiError(400,"Avatar file is required ");
   }

//    now database entry

   const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase() 
   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if(!createdUser){
    throw new ApiError(500,"Something went wrong while generating referesh and access tokeng went wrong while registring the user");
   }

//    now response

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )


})

const logginUser=asyncHandler(async(req,res)=>{
    // req body ->
    // username or email
    // find the user 
    // password check  
    // access token and refresh token 
    // send cookie
    // res login

    const {username,email,password}=req.body

    if(!username && !email){
        throw new ApiError(400,'Username or email is required ')
    }

    // $or is a mongodb operator check username or email is valid 
    const user =await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(400,'User doesnot exist')
    }

    // password check
    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400,'Password Is invalid')
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User Logggid In Successfully"
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out"))
})

// new code tuesday 14 may
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})
    
// change password
    const changeCurrentPassword=asyncHandler(async(req,res)=>{
        const {oldPassword,newPassword}=req.body
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

        if(!isPasswordCorrect){
            throw new ApiError(401,'Invalid old password')
        }
        user.password=newPassword
        await user.save({validateBeforeSave:false})

        return res
        .status(200)
        .json(new ApiResponse(200,{},'Password changed successfully'))
    })

    // current user
    const getCurrentUser=asyncHandler(async(req,res)=>{
        return res
        .status(200)
        .json(200,req.user,"current user fetched successfully")
    })
    // update account detail
    const updateAccountDetails=asyncHandler(async(req,res)=>{
        const {fullName,email}=req.body
        if(!fullName || !email){
            throw new ApiError(400,"All fieldds are required")
        }
       const user =await User.findByIdAndUpdate(
        req.users?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account detailed updated successfully"))
    })

    // now files update
    const UpdateUserAvatar=asyncHandler(async(req,res)=>{
        const avatarLocalPath = req.file?.path
        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is missing")
        }
        const avatar = await uploadonCloudinary(avatarLocalPath)

        if(!avatar.url){
            throw new ApiError(400,"Error while uploading on avatar")
        }
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {new:true}
        ).select("-password")
        return res
        .status(200)
        .json(
            new ApiResponse(400,user,"Avatar Image updated successfully")
        )
    })

    // now coverimage update

    const UpdateUserCoverImage=asyncHandler(async(req,res)=>{
        const coverLocalPath = req.file?.path
        if(!coverLocalPath){
            throw new ApiError(400,"CoverImage file is missing")
        }
        const coverImage = await uploadonCloudinary(avatarLocalPath)

        if(!coverImage.url){
            throw new ApiError(400,"Error while uploading on avatar")
        }
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(400,user,"Cover Image updated successfully")
        )
    })
export {
    registerUser,
    logginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    UpdateUserAvatar,
    UpdateUserCoverImage   
}