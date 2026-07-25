import { Schema } from "mongoose";
import mongoose from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type : Schema.type.ObjectId, // one who is subscribing 
        ref : "User"
    },
    channel : {
        type : Schema.type.ObjectId,
        ref : "User"
    },


}, {timestamps})


export const subscription = mongoose.model("Subscription", subscriptionSchema)