import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js"; // Added .js extension
import { 
    getAllLikedVideos, 
    toggleLikeVideo, 
    toggleLikeTweet, 
    toggleLikeComment 
} from "../controllers/like.controller.js"; // Added .js extension

const router = Router();
router.use(verifyJwt);

router.route("/videos").get(getAllLikedVideos); // Changed "/Videos" to lowercase
router.route("/toggle/v/:videoId").post(toggleLikeVideo);
router.route("/toggle/c/:commentId").post(toggleLikeComment);
router.route("/toggle/t/:tweetId").post(toggleLikeTweet); // Added the missing '/'

export default router;