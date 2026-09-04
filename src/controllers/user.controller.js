import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {apiResponse} from '../utils/apiResponse.js'
import { verifyJwt } from "../middlewares/auth.middleware.js";
import mongoose, { mongo } from "mongoose";


const generateAccessAndRefreshToken = async(userId)=> {
try {
    const user =  await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})
    return {accessToken , refreshToken}
} catch (error) {
    throw new apiError(500 , "something went worng ")
}
}

const userRegisterController = asyncHandler(async (req  , res ) => {

    const {username , email , fullName , password } = req.body
    if ([username , email , fullName , password].some( (field) => field.trim() === "" )  ) {
        throw new apiError(400 , "All fields are required ")
    }
    console.log(username);
   
    const userExist = await User.findOne({$or : [ {email} , {username}]}) // check user already exists , $ sign sy mongose k operators milty hn  yahan pe or operator ha
    if (userExist) {
        throw new apiError(409 , "User with same Email , or Username ALready exist")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path // multer give the access of file
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
   let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) { // check if coverImage is provided if not then it will be undefined
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new apiError(400 , "avatar is required" )
    }
        const avatar =  await  uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if (!avatar) {
            throw new apiError(400 , "avatar is required")
        }

     const user = await User.create({ // create user entry in db
            email,
            password,
            username: username.toLowerCase(),
            fullName,
            avatar : avatar.url,
            coverImage : coverImage?.url || "",
        })
        const createUser =  await  User.findById(user._id).select( // remove password and refreshToken from response
            "-password -refreshToken" // by default tu sary selected hoty hn lakin - sign ka matlb hota ha kiya kiya nahi chahiya
        )
        if (!createUser) {
            throw new apiError(500 , "Something went wrong while register the user Internal Server " )
           
        }
        return res.status(201).json(
            new apiResponse(200 , createUser , "user register successfully" )
        )
   

 
})
const userLoginController = asyncHandler( async (req, res)=> {
    const  {username , email , password} = req.body
    if (!email && !username) {
         throw new apiError(400 , "Email or username is required ")
    }
    const user = await User.findOne({
        $or : [{username} , {email}]
    })
    if (!user) {
        throw new apiError(404 , "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new apiError(401 , 'Invalid user Credentials ')
    }
    const {refreshToken , accessToken} = await generateAccessAndRefreshToken(user._id)
    const logginUser = await User.findById(user._id).select("-password -refreshToken")
    const option = {
        httpOnly : true, // mean these cookies can be only modify by the server not by the frontend 
        secure : true
    }
    return res.status(200)
    .cookie("accessToken" , accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new apiResponse(200, {
            user:logginUser, accessToken, refreshToken // we are sending these in retun so frontend can save it in local storage
        }, "user logged in successFully ")
    )
} )

const userLogedOut = asyncHandler(async(req , res )=> {
    await User.findByIdAndUpdate(
        req.user._id, {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly: true,
        secure : true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200 , {}, "User Loged Out successfully"))
})
export const UserRefreshAccessToken = asyncHandler(
    async(req , res ) => {
       try {
         const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
         if (!incomingRefreshToken) {
             throw new apiError(401 , "Unauthorized request")
         }
         const decodedToken = verifyJwt.verifyJwt(
             incomingRefreshToken,
             process.env.REFRESH_TOKEN_SECRET
 
         )
         const user = await user.findById(decodedToken?._id)
         if (!user) {
             throw new apiError(401 , "Invalid refresh token")
         }
         if (incomingRefreshToken !== user?.refreshToken) {
             throw new apiError(401 , "refresh token is expired or used")
         }
         const options = {
             httpOnly: true,
             secure : true
         }
 const {accessToken , NewRefreshToken}=generateAccessAndRefreshToken(user._id)
         return res.status(200).cookie("accessToken", accessToken , options)
         .cookie("refreshToken" , NewRefreshToken , options)
         .json(
             new apiResponse(200,{
                 accessToken, refreshToken: NewRefreshToken
             }, "access token refreshed")
         )
       } catch (error) {
        throw new apiError(401 , error?.message || "Invalid refresh Token")
       }
    }
)

export const changeCurrentUserPassword = asyncHandler(
    async(req , res) => {
        const {oldPassword , newPassword } =  req.body
        const user =  await user.findById(req.user?._id);
 const isPasswordCurrect = await   isPasswordCorrect(oldPassword)
        if (!isPasswordCurrect) {
            throw new apiError(400 , "Invalid old password")
        }
        user.password = newPassword
        await user.save({validateBeforeSave:false})
return res.status(200).json(
    new apiResponse(
        200, [] , "Password change successfully"
    )
)
    }
)

export const getCurrentUser = asyncHandler(
    async(req , res) => {
        return res.status(200).json(
            new apiResponse(200 , req.user , "Current User fetch successfully ")
        )
    }
)
export const updateAccountDetail = asyncHandler(async(
    req , res
) => {
    const {email , fullName } = req.body
    if (!email || !fullName) {
        throw new apiError(400 , "All faields are required")
    }
    user.findByIdAndUpdate(
        req.user?._id, {
            $set:{
                fullName , email: email
            }
        }, {new : true}
    ).select("-password")
    return res.json(
        new apiResponse(200 , user , "User update successfully ")
    )
}       )

export const updateUserAvatar = asyncHandler(async(req , res)=> {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apiError(400 , "file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar?.url) {
        throw new apiError(400 , "Error while uploading on avatar")
    }
    const user = await user.findByIdAndUpdate(req.user?._id
        , {
            $set : {
                avatar: avatar.url
            }
        } , {new : true}
    ).select("-password")
    return res.status(200)
    .json(
        new apiResponse(200 , user , "Update user avatar successfully ")
    )

})
export const updateUserCoverImage = asyncHandler(async(req , res)=> {
    const coverImage = req.file?.path
    if (!coverImage) {
        throw new apiError(400 , "cover Image is required")
    }
    const cover = await uploadOnCloudinary(coverImage)
      if (!cover?.url) {
        throw new apiError(400 , "Error while uploading on cover")
    }
     const user = await user.findByIdAndUpdate(req.user?._id
        , {
            $set : {
                avatar: cover.url
            }
        } , {new : true}
    ).select("-password")
    return res.status(200)
    .json(
        new apiResponse(200 , user , "Update user avatar successfully ")
    )
})

export const getUserCannelProfile =   asyncHandler(
    async( req , res )=>     {
const {username} = req.params
if (!username.trim()) {
    throw new apiError(400 , "user not found ")
}
const channel = await  User.aggregate([
    {
        $match : {
            username : username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from : "subscriptions",
            localField : "_id",
            foreignField: "channel",
            as : "subscribers"
        }
    },
      {
        $lookup:{
            from : "subscriptions",
            localField : "_id",
            foreignField: "subscriber",
            as : "subscribedTo"
        }
    }, 
    {
        $addFields : {
            subscriberCount : {
                $size : "$subscribers"
            },
            channelSubscripbedToCount : {
                $size : "$subscribedTo"
            },
            isSubscribed: {
                $cond : {
                    if : { $in : [req.user?._id, "$subscribers.subscriber"]  },
                    then : true,
                    else: false
                }
            }
        }
    }, {
        $project: {
            fullName:1,
            username:1,
            subscriberCount:1,
            channelSubscripbedToCount: 1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1,
        }
    }
])
if (!channel?.length) {
    throw new apiError(404 , "channel does not exist")
}
return res.status(200).json(
    new apiResponse(200 , channel[0], "user fetch successfully ")
)
    }
)

//when you want to change the user like name email description images file make sure there should be a separate image or file change approch becasue if you change the whole user it will be heavy task on backend best pratice is make sure the separe endpoint of it 

export const getWatchHistory = asyncHandler(async (req , res )=>{
    const user = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField : "watchHistory",
                foreignField: "_id",
                as : "watchHistory",
                pipeline: [ 
                    {
                    $lookup : {
                        from : "users",
                        localField: "owner",
                        foreignField: "_id",
                        as : "owner",
                        pipeline : [
                            {
                                $project: {
                                    fullName : 1,
                                    username : 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }}
                    , {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200)
    .json(
        new apiResponse(
            200 , user[0].watchedHistory , "History fetched successfully"
        )
    )
})


export { userLoginController , userLogedOut , userRegisterController , getUserCannelProfile   }





















 // get data form frontend
 // validate - not empty
 // check user if already exists (check by email , username)
 // check for image , check for avatar
 // upload it into cloudniary  , avatar
 // create user object - create entry in db
 // remove password and refresh token from field from response
 // check for user creation
 // return response
   
