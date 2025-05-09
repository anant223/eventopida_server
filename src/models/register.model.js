import mongoose, {Schema, model} from "mongoose";

const registerSchema = new mongoose.Schema(
    {
        event: {
            type: Schema.Types.ObjectId,
            ref: "Event",
        },
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);
registerSchema.index({event: 1, subscriber: 1}, {unique: true})

export const Register = model("Register", registerSchema);