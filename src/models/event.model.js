import mongoose, { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        desc: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            required : true,
        },
        duration: {
            type: Number,
            required: true,
        },
        startingDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        url: {
            type: String,
        },
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        tag: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["upcoming", "completed"],
            default: "upcoming",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        eventType: {
            type: String,
            enum: ["Public", "Private"]
        }
    },
    { timestamps: true }
);

eventSchema.plugin(mongooseAggregatePaginate);
const Event = model("Event", eventSchema);
export default Event;
