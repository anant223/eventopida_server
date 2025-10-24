import mongoose, { Mongoose, Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        desc: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            trim: true,
            lowercase: true,
            enum: [
                "tech",
                "business",
                "health",
                "education",
                "entertainment",
                "sports",
                "other",
            ],
            default: "other",
        },
        startDateTime: {
            type: Date,
            required: true,
        },
        endDateTime: {
            type: Date,
            required: true,
        },
        location: {
            type: String,
            default: "online",
            required: true,
        },
        locationId: {
            type: String,
        },
        capacity: {
            type: Number,
        },
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        hosts: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        eventType: {
            type: String,
            enum: ["public", "private"],
            default: "public",
            lowercase: true,
        },
        ticketType: {
            type: String,
            enum: ["free", "paid"],
            default: "free",
            lowercase: true,
        },
        price: {
            type: String,
            default: 0,
        },
        requireApproval: {
            type: Boolean,
            default: false,
        },
        token: {
            type: String,
            unique: true,
            sparse: true,
        },
    },
    { timestamps: true }
);

eventSchema.plugin(mongooseAggregatePaginate);
const Event = model("Event", eventSchema);
export default Event;
