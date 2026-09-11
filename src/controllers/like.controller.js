import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. Toggle Like for a Video
const toggleLikeVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        return res.status(400).json(new apiError(400, "Invalid video ID format"));
    }

    const userId = req.user._id;

    // Check if the user has already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

    if (existingLike) {
        // If already liked, remove it (Unlike)
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new apiResponse(200, { isLiked: false }, "Video unliked successfully"));
    } else {
        // If not liked, create a new like document
        await Like.create({
            video: videoId,
            likedBy: userId
        });
        return res
            .status(200)
            .json(new apiResponse(200, { isLiked: true }, "Video liked successfully"));
    }
});

// 2. Toggle Like for a Comment
const toggleLikeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        return res.status(400).json(new apiError(400, "Invalid comment ID format"));
    }

    const userId = req.user._id;

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new apiResponse(200, { isLiked: false }, "Comment unliked successfully"));
    } else {
        await Like.create({
            comment: commentId,
            likedBy: userId
        });
        return res
            .status(200)
            .json(new apiResponse(200, { isLiked: true }, "Comment liked successfully"));
    }
});

// 3. Toggle Like for a Tweet
const toggleLikeTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        return res.status(400).json(new apiError(400, "Invalid tweet ID format"));
    }

    const userId = req.user._id;

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new apiResponse(200, { isLiked: false }, "Tweet unliked successfully"));
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: userId
        });
        return res
            .status(200)
            .json(new apiResponse(200, { isLiked: true }, "Tweet liked successfully"));
    }
});

// 4. Get All Liked Videos for the Logged-in User
const getAllLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.aggregate([
        {
            // Match all likes belonging to this user where the video field is present
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true, $ne: null }
            }
        },
        {
            // Lookup the video collection to get video details
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                // Nested pipeline to also grab the video owner's details
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    },
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            // Sort by most recently liked first
            $sort: {
                createdAt: -1
            }
        },
        {
            // Clean up the projected response
            $project: {
                _id: 1,
                createdAt: 1,
                videoDetails: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new apiResponse(
                200, 
                likedVideos, 
                "Liked videos fetched successfully"
            )
        );
});

export {
    toggleLikeVideo,
    toggleLikeComment,
    toggleLikeTweet,
    getAllLikedVideos
};