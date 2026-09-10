import mongoose from "mongoose";
import {Comments} from "../models/comments.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {apiresponse} from "../utils/apiResponse.js";

const getVideoComments = asyncHandler(async (req,res,next) => {
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;
    const comments = await Comments.find({video : videoId}).populate("owner" , "username avatar").skip((page - 1) * limit).limit(parseInt(limit));
    return res.status(200).json(new apiresponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req,res,next) => {
    const {videoId} = req.params;
    const {content} = req.body;
    const comment = await Comments.create({
        content,
        video: videoId,
        owner: req.user._id
    });
    return res.status(201).json(new apiresponse(201, comment, "Comment added successfully"));
});
const updateComment = asyncHandler(async (req,res,next) => {
    const {commentId} = req.params;
    const {content} = req.body;
    const comment = await Comments.findById(commentId);
    if(!comment){
        return next(new apiError(404, "Comment not found"));
    }
    comment.content = content;
    await comment.save();
    return res.status(200).json(new apiresponse(200, comment, "Comment updated successfully"));
});
const deleteComment = asyncHandler(async (req,res,next) => {
    const {commentId} = req.params;
    const comment = await Comments.findById(commentId);
    if(!comment){
        return next(new apiError(404, "Comment not found"));
    }
    await comment.remove();
    return res.status(200).json(new apiresponse(200, null, "Comment deleted successfully"));
});

export {getVideoComments, addComment, updateComment, deleteComment}