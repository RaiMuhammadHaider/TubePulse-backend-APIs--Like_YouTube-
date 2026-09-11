import { Router } from "express";
import { Playlist } from "../models/playlist.model";
import { apiResponse } from "../utils/apiResponse";
import { apiError } from "../utils/apiError";
import { verifyJwt } from "../middlewares/auth.middleware";
import {createPlayList , deletePlayList , updatePlayList , addVideoToPlayList , getPlayListById , getUserPlayList , removeVideoFromPlayList} from "../controllers/playlist.controller"
const router = Router()

router.use(verifyJwt)
router.route("/").post(createPlayList)
router.route("/:").get(getPlayListById).patch(updatePlayList).delete(deletePlayList)
router.route("/add/:videoId/:playlistId").post(addVideoToPlayList)
router.route("/user/:userId").get(getUserPlayList)
export default router
