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
        isSubscribed:{
            type : Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export const Register = model("Register", registerSchema);