import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {apiResponse} from '../utils/apiResponse.js'
import { JsonWebTokenError } from "jsonwebtoken";
import { verifyJwt } from "../middlewares/auth.middleware.js";


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

export {userRegisterController , userLoginController , userLogedOut , userRegisterController }





















 // get data form frontend
 // validate - not empty
 // check user if already exists (check by email , username)
 // check for image , check for avatar
 // upload it into cloudniary  , avatar
 // create user object - create entry in db
 // remove password and refresh token from field from response
 // check for user creation
 // return response
   
