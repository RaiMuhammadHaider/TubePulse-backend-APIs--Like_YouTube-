import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentsSchema = new Schema({

constent : {
    type : String,
    require : true 
},
video : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "Video",
    required : true
},
owner : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required : true
}


} , {timestamps : true} )


commentsSchema.plugin(mongooseAggregatePaginate);
export const Comments = mongoose.model("Commenrs",videoSchema);