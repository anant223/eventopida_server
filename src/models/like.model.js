import mongoose, { model, Schema } from "mongoose";

const likeSchema = new Schema({
    event: {
        type : Schema.Types.ObjectId,
        ref : "Event"
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref : "User"
    }
}, {timestamps: true});

const Like = model("Like", likeSchema);
export default Like