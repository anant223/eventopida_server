import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        slug: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true 
        },
        emoji: { 
            type: String, 
            default: "✨" 
        },
        color: { 
            type: String, 
            default: "#6B7280" 
        },
        type: { 
            type: String, 
            enum: ["system", "custom"], 
            default: "system" 
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
        displayOrder: { 
            type: Number, 
            default: 0 
        },
    },
    { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema)

export default Category