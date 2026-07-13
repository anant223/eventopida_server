import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        type: {
            type: String,
            required: true,
        },
        metadata: {
            type: Object,
            default: {},
        },
        expiry: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

verificationTokenSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken = mongoose.model(
    "VerificationToken",
    verificationTokenSchema
);

