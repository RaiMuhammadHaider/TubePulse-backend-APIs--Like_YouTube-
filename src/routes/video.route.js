import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { deleteVideo , getAllVideos , getVideoById , updateVideoById , publishAVideo , togglePublishVideo} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();
router.use(verifyJwt); // Apply JWT verification middleware to all routes in this router
router.route("/").get(getAllVideos).post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
] ) , publishAVideo);

router.route("/:videoId").get(getVideoById).put(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
] ), updateVideoById).delete(deleteVideo);

router.route("/:videoId/publish").patch(togglePublishVideo);
export default router;

