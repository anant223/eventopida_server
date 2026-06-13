import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Waitlist = mongoose.model("Waitlist", waitlistSchema);
export default Waitlist;
