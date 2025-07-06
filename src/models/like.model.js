import mongoose, { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    eventId: {
        type : Schema.Types.ObjectId,
        ref : "Event"
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref : "User"
    }
}, {timestamps: true});

likeSchema.index({ eventId: 1, likedBy: 1}, {unique: true})

const Like = model("Like", likeSchema);
export default Like