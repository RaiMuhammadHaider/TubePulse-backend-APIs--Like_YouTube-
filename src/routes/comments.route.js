import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {addComment, updateComment, getVideoComments, deleteComment} from "../controllers/comments.controller.js";
const router = Router();
router.use(verifyJwt); // Apply JWT verification middleware to all routes in this router

router.route("/:videoId").post(addComment).get(getVideoComments);
router.route("/:commentId").put(updateComment).delete(deleteComment);
export default router;
