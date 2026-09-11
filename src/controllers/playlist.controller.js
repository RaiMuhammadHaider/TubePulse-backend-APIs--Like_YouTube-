import mongoose , {isValidObjectId} from "mongoose";
import { upload } from "../middlewares/multer.middleware";
import {Playlist} from "../models/playlist.model"
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";


const createPlayList = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // 1. Validate inputs
    if (!name || name.trim() === "") {
        return res.status(400).json(new apiError(400, "Playlist name is required"));
    }
    if (!description || description.trim() === "") {
        return res.status(400).json(new apiError(400, "Playlist description is required"));
    }

    // 2. Create the playlist in the database
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id, // Extracted from verifyJwt middleware
        videos: []           // Initialize with an empty array
    });

    // 3. Check for database failure
    if (!playlist) {
        return res.status(500).json(new apiError(500, "Something went wrong while creating the playlist"));
    }

    // 4. Return success response
    return res
        .status(201) // 201 Created
        .json(new apiResponse(201, playlist, "Playlist created successfully"));
});

const getPlayListById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // 1. Validate the playlist ID format
    if (!isValidObjectId(playlistId)) {
        return res.status(400).json(new apiError(400, "Invalid playlist ID format"));
    }

    // 2. Fetch the playlist and populate owner and videos
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            // Join the user collection to get playlist owner details
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            // Join the video collection to get the details of the videos inside the playlist
            $lookup: {
                from: "videos", // Make sure this matches your MongoDB videos collection name
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            // Project only the fields we want to expose to the frontend
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.fullName": 1,
                "ownerDetails.avatar": 1,
                // We map over the populated videos to keep the payload clean and secure
                videoDetails: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1
                }
            }
        }
    ]);

    // 3. Check if playlist exists (aggregation returns an array)
    if (!playlist || playlist.length === 0) {
        return res.status(404).json(new apiError(404, "Playlist not found"));
    }

    // 4. Return the populated playlist object
    return res
        .status(200)
        .json(new apiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const updatePlayList = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // 1. Validate the playlist ID format
    if (!isValidObjectId(playlistId)) {
        return res.status(400).json(new apiError(400, "Invalid playlist ID format"));
    }

    // 2. Check if user provided at least one field to update
    if (!name && !description) {
        return res.status(400).json(new apiError(400, "Please provide a name or description to update"));
    }

    // 3. Fetch the playlist from database
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json(new apiError(404, "Playlist not found"));
    }

    // 4. Security Check: Verify if the logged-in user is the owner of this playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiError(403, "You do not have permission to update this playlist"));
    }

    // 5. Update the fields only if they are provided
    if (name) {
        playlist.name = name.trim();
    }
    if (description) {
        playlist.description = description.trim();
    }

    // 6. Save the updated playlist
    const updatedPlaylist = await playlist.save();

    return res
        .status(200)
        .json(new apiResponse(200, updatedPlaylist, "Playlist updated successfully"));
});

const deletePlayListById = asyncHandler(async()=>{
    const {PlayListId} = req.params

})

const deletePlayList = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // 1. Validate the playlist ID format
    if (!isValidObjectId(playlistId)) {
        return res.status(400).json(new apiError(400, "Invalid playlist ID format"));
    }

    // 2. Fetch the playlist from database
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json(new apiError(404, "Playlist not found"));
    }

    // 3. Security Check: Verify if the logged-in user is the owner
    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiError(403, "You do not have permission to delete this playlist"));
    }

    // 4. Delete the playlist
    // Hum `deleteOne()` use kar ry hain kyunke document already step 2 mein fetch ho chuka hai. 
    // Yeh `findByIdAndDelete` se zyada fast hai kyunke dobara DB query nahi karni parti.
    await playlist.deleteOne();

    // 5. Return success response
    return res
        .status(200)
        .json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

const addVideoToPlayList = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // 1. Validate both IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        return res.status(400).json(new apiError(400, "Invalid playlistId or videoId"));
    }

    // 2. Fetch Playlist and Video concurrently (Performance optimization)
    // Promise.all use karne se dono queries database mein ek sath run hoti hain, time bachta hai.
    const [playlist, video] = await Promise.all([
        Playlist.findById(playlistId),
        Video.findById(videoId)
    ]);

    if (!playlist) {
        return res.status(404).json(new apiError(404, "Playlist not found"));
    }
    if (!video) {
        return res.status(404).json(new apiError(404, "Video not found"));
    }

    // 3. Security Check: Only the owner can add videos
    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiError(403, "You do not have permission to add videos to this playlist"));
    }

    // 4. Check for Duplicates
    // Pata lagana ke kya yeh video pehle se toh playlist mein majood nahi?
    const isVideoAlreadyAdded = playlist.videos.some(
        (id) => id.toString() === videoId
    );

    if (isVideoAlreadyAdded) {
        return res.status(400).json(new apiError(400, "Video is already in the playlist"));
    }

    // 5. Add the video to the playlist array and save
    playlist.videos.push(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new apiResponse(200, playlist, "Video added to playlist successfully"));
});

const removeVideoFromPlayList = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // 1. Validate both IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        return res.status(400).json(new apiError(400, "Invalid playlistId or videoId"));
    }

    // 2. Fetch the Playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json(new apiError(404, "Playlist not found"));
    }

    // 3. Security Check: Only the owner can remove videos
    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json(new apiError(403, "You do not have permission to remove videos from this playlist"));
    }

    // 4. Check if the video is actually inside the playlist
    const isVideoInPlaylist = playlist.videos.some(
        (id) => id.toString() === videoId
    );

    if (!isVideoInPlaylist) {
        return res.status(404).json(new apiError(404, "Video is not in this playlist"));
    }

    // 5. Remove the video using Mongoose's built-in array .pull() method
    playlist.videos.pull(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new apiResponse(200, playlist, "Video removed from playlist successfully"));
});

const getUserPlayList = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // 1. Validate the user ID format
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new apiError(400, "Invalid user ID format"));
    }

    // 2. Fetch all playlists owned by this user
    const playlists = await Playlist.aggregate([
        {
            // Match all playlists where owner matches the given userId
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            // Add a new field to count how many videos are inside the playlist
            $addFields: {
                totalVideos: { $size: "$videos" } // $size array ki length nikalta hai
            }
        },
        {
            // Project only the required fields for the UI
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    // 3. Return the response
    // Agar user ne koi playlist nahi banayi toh empty array [] wapis jayega jo ke theek hai
    return res
        .status(200)
        .json(new apiResponse(200, playlists, "User playlists fetched successfully"));
});

export {
    createPlayList,
    getPlayListById,
    updatePlayList,
    deletePlayList,
    addVideoToPlayList,
    removeVideoFromPlayList,
    getUserPlayList
}