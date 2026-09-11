import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    // Removed required: true, changed to singular 'comment'
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment" 
    },
    // Changed 'Video' to lowercase 'video' for consistency
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: { // Changed 'likeBy' to 'likedBy' (standard naming)
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// Correct way to inject the plugin
likeSchema.plugin(mongooseAggregatePaginate);

export const Like = mongoose.model("Like", likeSchema);