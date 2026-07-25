import { userRegisterController, userLoginController, userLogedOut  } from "../controllers/user.controller.js";
import { Router } from "express";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()
router.route('/register').post(
    upload.fields([ // multer middleware for handling multipart/form-data for file upload 
        {
            name : "avatar", // field name in the form
            maxCount : 1,
        },{
            name : "coverImage",
            maxCount : 1,
        }
    ])

    , userRegisterController) // router for user registration
  router.route("/login").post(  userLoginController)
    router.route("/logout").post( verifyJwt ,userLogedOut) // add secure route by implimenting the auth middleware 
    // router.route("/refreshToken").post()
export default router