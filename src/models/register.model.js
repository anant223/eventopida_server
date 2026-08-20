import mongoose, { Schema, model } from "mongoose";

const eventRegistrationSchema = new mongoose.Schema(
    {
        event: {
            type: Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

eventRegistrationSchema.index({ event: 1, subscriber: 1 }, { unique: true });

const EventRegistration = model(
    "EventRegistration",
    eventRegistrationSchema
);
export default EventRegistration;