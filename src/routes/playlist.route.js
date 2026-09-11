import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {createPlayList , deletePlayList , updatePlayList , addVideoToPlayList , getPlayListById , getUserPlayList , removeVideoFromPlayList} from "../controllers/playlist.controller"
const router = Router()

router.use(verifyJwt)
router.route("/").post(createPlayList)
router.route("/:").get(getPlayListById).patch(updatePlayList).delete(deletePlayList)
router.route("/add/:videoId/:playlistId").post(addVideoToPlayList).delete(removeVideoFromPlayList)
router.route("/user/:userId").get(getUserPlayList)
export default router
