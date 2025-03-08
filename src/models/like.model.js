import mongoose, { model, Schema } from "mongoose";

const likeSchema = new Schema({
    eventId: {
        type : Schema.Types.ObjectId,
        ref : "Event"
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref : "User"
    },
    isLiked : {
        type: Boolean,
        default : false
    }
}, {timestamps: true});

const Like = model("Like", likeSchema);
export default Like