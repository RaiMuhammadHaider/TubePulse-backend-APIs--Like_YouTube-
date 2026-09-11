import mongoose from "mongoose";
import {Tweet} from '../models/tweet.model.js';
import {User} from '../models/user.model.js';
import { apiResponse } from "../utils/apiResponse";
import { apiError } from "../utils/apiError";
import {asyncHandler} from "../utils/asyncHandler.js";
import ObjectId from "mongoose/lib/types/objectid.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    // 1. Validate the content
    if (!content || content.trim() === "") {
        // Assuming apiError throws or is used with next(). Usually, you throw it in asyncHandler.
        return res.status(400).json(new apiError(400, "Tweet content cannot be empty")); 
    }

    // 2. Create the tweet in the database
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id // Comes from verifyToken middleware
    });

    // 3. Check if creation was successful (failsafe)
    if (!tweet) {
        return res.status(500).json(new apiError(500, "Something went wrong while creating the tweet"));
    }

    // 4. Return success response
    return res
        .status(201)
        .json(new apiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweet = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // 1. Validate the userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json(new apiError(400, "Invalid user ID format"));
    }

    // 2. Fetch tweets and join the user details
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users", // Must match your MongoDB collection name for users
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            // Sort by newest tweets first
            $sort: {
                createdAt: -1
            }
        },
        {
            // Project only the tweet data and the public user profile data
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.fullName": 1,
                "ownerDetails.avatar": 1
            }
        }
    ]);

    // 3. Return the tweets
    // Note: If the user has no tweets, 'tweets' will be an empty array []. 
    // This is the correct behavior; we don't throw a 404 here.
    return res
        .status(200)
        .json(new apiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { id } = req.params; // This is the tweet ID from the URL
    const { content } = req.body;

    // 1. Validate the tweet ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new apiError(400, "Invalid tweet ID format"));
    }

    // 2. Validate the new content
    if (!content || content.trim() === "") {
        return res.status(400).json(new apiError(400, "Tweet content cannot be empty"));
    }

    // 3. Find the tweet in the database
    const tweet = await Tweet.findById(id);

    if (!tweet) {
        return res.status(404).json(new apiError(404, "Tweet not found"));
    }

    // 4. Security Check: Verify the logged-in user owns this tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiError(403, "You do not have permission to edit this tweet"));
    }

    // 5. Update the content and save
    tweet.content = content.trim();
    const updatedTweet = await tweet.save();

    // 6. Return the updated tweet
    return res
        .status(200)
        .json(new apiResponse(200, updatedTweet, "Tweet updated successfully"));
});
const deleteTweet = asyncHandler(async (req, res) => {
    const { id } = req.params; // This is the tweet ID from the URL

    // 1. Validate the tweet ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new apiError(400, "Invalid tweet ID format"));
    }

    // 2. Find the tweet in the database
    const tweet = await Tweet.findById(id);

    if (!tweet) {
        return res.status(404).json(new apiError(404, "Tweet not found"));
    }

    // 3. Security Check: Verify the logged-in user owns this tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiError(403, "You do not have permission to delete this tweet"));
    }

    // 4. Delete the tweet from the database
    // We use .deleteOne() directly on the document we already fetched
    await tweet.deleteOne();

    // 5. Return success response
    return res
        .status(200)
        .json(new apiResponse(200, {}, "Tweet deleted successfully"));
});