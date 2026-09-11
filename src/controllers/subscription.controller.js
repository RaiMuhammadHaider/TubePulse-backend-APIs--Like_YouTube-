import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model";
import { User } from "../models/user.model";
import { apiResponse } from "../utils/apiResponse";
import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ObjectId } from "mongodb";

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { id } = req.params; // This is the ID of the subscriber (the user whose list we are fetching)

    // 1. Validate the user ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new apiError(400, "Invalid user ID format"));
    }

    // 2. Fetch the channels this user is subscribed to
    const subscribedChannels = await Subscription.aggregate([
        {
            // Find all documents where this user is the "subscriber"
            $match: {
                subscriber: new mongoose.Types.ObjectId(id)
            }
        },
        {
            // Join the users collection to get the channel's details
            $lookup: {
                from: "users", // Must match your MongoDB collection name exactly
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel"
            }
        },
        {
            // Unwind the array to turn it into an object
            $unwind: "$subscribedChannel"
        },
        {
            // Project only the necessary fields for the UI
            $project: {
                _id: 1, // The subscription document ID
                createdAt: 1, // When they subscribed
                "subscribedChannel._id": 1,
                "subscribedChannel.username": 1,
                "subscribedChannel.fullName": 1,
                "subscribedChannel.avatar": 1
            }
        }
    ]);

    // 3. Return the response
    // If they aren't subscribed to anyone, it returns an empty array [], which is perfect.
    return res
        .status(200)
        .json(
            new apiResponse(
                200, 
                subscribedChannels, 
                "Subscribed channels fetched successfully"
            )
        );
});
const toggleSubscription = asyncHandler(async (req, res) => {
    const { id: channelId } = req.params;
    const subscriberId = req.user._id;

    // 1. Validate the channel ID format
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        return res.status(400).json(new apiError(400, "Invalid channel ID format"));
    }

    // Optional: Prevent users from subscribing to themselves
    if (channelId.toString() === subscriberId.toString()) {
        return res.status(400).json(new apiError(400, "You cannot subscribe to yourself"));
    }

    // 2. Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if (existingSubscription) {
        // 3a. If they are already subscribed, unsubscribe them (delete the document)
        await existingSubscription.deleteOne();
        
        return res
            .status(200)
            .json(new apiResponse(200, { subscribed: false }, "Unsubscribed successfully"));
    } else {
        // 3b. If they are not subscribed, subscribe them (create a new document)
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        });

        if (!newSubscription) {
            return res.status(500).json(new apiError(500, "Something went wrong while subscribing"));
        }

        return res
            .status(200)
            .json(new apiResponse(200, { subscribed: true }, "Subscribed successfully"));
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { id: channelId } = req.params; // This is the ID of the channel being viewed

    // 1. Validate the channel ID format
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        return res.status(400).json(new apiError(400, "Invalid channel ID format"));
    }

    // 2. Fetch the subscribers for this channel
    const subscribers = await Subscription.aggregate([
        {
            // Find all documents where this user is the "channel"
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            // Join the users collection to get the subscriber's details
            $lookup: {
                from: "users", // Matches the actual collection name in MongoDB
                localField: "subscriber", // We are looking up the person who subscribed
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            // Unwind the array to turn it into an object
            $unwind: "$subscriberDetails"
        },
        {
            // Project only the necessary fields for the UI
            $project: {
                _id: 1, // The subscription document ID
                createdAt: 1, // When they subscribed
                "subscriberDetails._id": 1,
                "subscriberDetails.username": 1,
                "subscriberDetails.fullName": 1,
                "subscriberDetails.avatar": 1
            }
        }
    ]);

    // 3. Return the response
    // If the channel has 0 subscribers, it safely returns an empty array []
    return res
        .status(200)
        .json(
            new apiResponse(
                200, 
                subscribers, 
                "Channel subscribers fetched successfully"
            )
        );
});
