import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Video } from "./video.model";
const likeSchema = new Schema({
    comments : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comments",
        required : true
    },
    Video : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video",
        required : true
    },
    likeBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    tweet : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Tweet",
        required : true
    },

} , {timestamps : true} )

mongooseAggregatePaginate(likeSchema);
export const Like = mongoose.model("Like",likeSchema);