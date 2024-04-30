import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// user exist
// import User from '../model/user.model.js'

import { User } from '../model/user.model.js';

import { uploadonCloudinary } from '../utils/cloudinary.js';

import { ApiResponse } from '../utils/ApiResponse.js';


const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token");
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
    throw new ApiError(500,"Something went wrong while registring the user");
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

    if(!username || !email){
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
    
    const loggedInUser=User.findById(user._id).
    select("-password -refreshToken")

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


export {
    registerUser,
    logginUser,
    logoutUser
}