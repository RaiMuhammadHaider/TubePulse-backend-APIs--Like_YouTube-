import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile : {
        type : String,
        required : true
    },
    thumbnail : {
        type : String,
        
    },
    title : {
        type : String,
        

    },
    description : {
        type : String,
        
    },duration : {
        type : Number,
        
    },
    views : {
        type : Number,
        default : 0
    },
    isPunlished : {
        type : Boolean,
        default : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
    }


} , { timestamps : true} )

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video",videoSchema);