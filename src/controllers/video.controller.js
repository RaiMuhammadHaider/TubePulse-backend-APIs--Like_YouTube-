import mongoose from "mongoose";
import {Video} from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiresponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // 1. Build the match condition
    const matchCondition = {
        isPunlished: true // Only show published videos (using the spelling from your schema)
    };

    // If a userId is provided, filter videos by that owner
    if (userId) {
        matchCondition.owner = new mongoose.Types.ObjectId(userId);
    }

    // If a search query is provided, search in title or description
    if (query) {
        matchCondition.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // 2. Set up sorting logic
    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    // 3. Create the aggregation pipeline
    const videoAggregate = Video.aggregate([
        { 
            $match: matchCondition 
        },
        {
            $lookup: {
                from: "users", // ensure this matches your actual user collection name in MongoDB
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { 
            $unwind: "$ownerDetails" 
        },
        { 
            $sort: sortOptions 
        },
        {
            // Project only the required owner fields to keep the payload light and secure
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPunlished: 1,
                createdAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1
            }
        }
    ]);

    // 4. Set up pagination options for the plugin
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    // 5. Execute using the mongoose-aggregate-paginate-v2 plugin
    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new apiresponse(200, videos, "Videos fetched successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // 1. Validate text inputs
    if (!title || !title.trim()) {
        return res.status(400).json(new apiresponse(400, null, "Title is required"));
    }
    if (!description || !description.trim()) {
        return res.status(400).json(new apiresponse(400, null, "Description is required"));
    }

    // 2. Extract file paths from req.files (populated by Multer)
    // Assuming your multer setup accepts multiple fields: [{ name: "videoFile", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        return res.status(400).json(new apiresponse(400, null, "Video file is required"));
    }

    if (!thumbnailLocalPath) {
        return res.status(400).json(new apiresponse(400, null, "Thumbnail file is required"));
    }

    // 3. Upload files to a cloud service (e.g., Cloudinary, AWS S3)
    // You cannot save the raw file in MongoDB, you must save the URL
    const videoUploadResponse = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUploadResponse || !videoUploadResponse.url) {
        return res.status(500).json(new apiresponse(500, null, "Failed to upload video file to cloud"));
    }
    if (!thumbnailUploadResponse || !thumbnailUploadResponse.url) {
        return res.status(500).json(new apiresponse(500, null, "Failed to upload thumbnail to cloud"));
    }

    // 4. Create the video document in the database
    const video = await Video.create({
        title,
        description,
        videoFile: videoUploadResponse.url,
        thumbnail: thumbnailUploadResponse.url,
        duration: videoUploadResponse.duration || 0, // Services like Cloudinary return the video duration automatically
        owner: req.user._id, // Extracted from your auth middleware
        isPunlished: true    // Using the exact spelling from your schema
    });

    // 5. Check if the video was actually created and return response
    if (!video) {
        return res.status(500).json(new apiresponse(500, null, "Failed to publish video due to database error"));
    }

    return res
        .status(201)
        .json(new apiresponse(201, video, "Video published successfully"));
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // 1. Validate the videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json(new apiresponse(400, null, "Invalid video ID format"));
    }

    // 2. Fetch the video and join the owner details
    const video = await Video.aggregate([
        {
            $match: { 
                _id: new mongoose.Types.ObjectId(videoId) 
            }
        },
        {
            $lookup: {
                from: "users", // Matches your User collection name
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            // Unwind the array to get a single object
            $unwind: "$ownerDetails"
        },
        {
            // Project only the necessary and secure fields
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPunlished: 1,
                createdAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1
            }
        }
    ]);

    // 3. Check if video exists
    // Aggregation returns an array. If length is 0, no video matched the ID.
    if (!video || video.length === 0) {
        return res.status(404).json(new apiresponse(404, null, "Video not found"));
    }

    // 4. Return the first item in the array
    return res
        .status(200)
        .json(new apiresponse(200, video[0], "Video fetched successfully"));
});

// import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"; 

const updateVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    // 1. Validate the videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json(new apiresponse(400, null, "Invalid video ID format"));
    }

    // 2. Fetch the video first to verify it exists and check ownership
    const video = await Video.findById(videoId);

    if (!video) {
        return res.status(404).json(new apiresponse(404, null, "Video not found"));
    }

    // 3. Security Check: Ensure the logged-in user is the owner of the video
    // Assuming your auth middleware attaches the logged-in user to req.user
    if (video.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiresponse(403, null, "You do not have permission to update this video"));
    }

    // 4. Handle Thumbnail Update (if the user uploaded a new one)
    // Assuming multer middleware handles the file: upload.single("thumbnail")
    const thumbnailLocalPath = req.file?.path;
    let newThumbnailUrl = video.thumbnail; // Keep old thumbnail by default

    if (thumbnailLocalPath) {
        const uploadResponse = await uploadOnCloudinary(thumbnailLocalPath);
        if (!uploadResponse || !uploadResponse.url) {
            return res.status(500).json(new apiresponse(500, null, "Failed to upload new thumbnail"));
        }
        newThumbnailUrl = uploadResponse.url;

        // Best Practice: Delete the old thumbnail from Cloudinary here to save storage space
        // await deleteFromCloudinary(video.thumbnail);
    }

    // 5. Update the document in the database
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                // If the user didn't provide a new title/description, keep the existing one
                title: title || video.title,
                description: description || video.description,
                thumbnail: newThumbnailUrl
            }
        },
        { new: true } // This crucial flag returns the updated document, not the old one
    );

    return res
        .status(200)
        .json(new apiresponse(200, updatedVideo, "Video updated successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // 1. Validate the videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json(new apiresponse(400, null, "Invalid video ID format"));
    }

    // 2. Find the video in the database
    const video = await Video.findById(videoId);

    if (!video) {
        return res.status(404).json(new apiresponse(404, null, "Video not found"));
    }

    // 3. Security Check: Ensure the logged-in user is the actual owner
    if (video.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiresponse(403, null, "You do not have permission to toggle the publish status of this video"));
    }

    // 4. Toggle the boolean value
    // If it was true, it becomes false. If it was false, it becomes true.
    video.isPunlished = !video.isPunlished;

    // 5. Save the changes to the database
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new apiresponse(
                200, 
                { isPunlished: video.isPunlished }, 
                `Video is now ${video.isPunlished ? "published" : "hidden"}`
            )
        );
});
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
// import { deleteFromCloudinary } from "../utils/cloudinary.js"; 

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // 1. Validate the videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json(new apiresponse(400, null, "Invalid video ID format"));
    }

    // 2. Find the video in the database
    const video = await Video.findById(videoId);

    if (!video) {
        return res.status(404).json(new apiresponse(404, null, "Video not found"));
    }

    // 3. Security Check: Ensure the logged-in user is the actual owner
    if (video.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiresponse(403, null, "You do not have permission to delete this video"));
    }

    // 4. Delete files from Cloudinary (or your cloud storage)
    // Cloudinary usually requires the 'public_id' to delete files, which you can extract from the URL in your utility function
    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile, "video"); // "video" tells Cloudinary the resource type
    }
    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image");
    }

    // 5. Delete the video document from the database
    // We use .deleteOne() directly on the fetched video document
    await video.deleteOne();

    return res
        .status(200)
        .json(new apiresponse(200, {}, "Video deleted successfully"));
});