import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

// // Add debug logging for configuration
// console.log("Cloudinary Configuration Status:", {
//     cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
//     apiKey: !!process.env.CLOUDINARY_API_KEY,
//     apiSecret: !!process.env.CLOUDINARY_API_SECRET,
// });

// cloudinary.config({
//     cloud_name: "dsptomo3q",
//     api_key: "518218992571839",
//     api_secret: "bESS-9ChFXgX4uhCLkIPa058mg0",
// });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (filePath) => {
    try {

        if (!filePath) {
            console.log("No file path provided");
            return null;
        }

        // Verify file exists
        try {
            await fs.access(filePath);
            console.log("File exists and is accessible");
        } catch (error) {
            console.error("File access error:", error);
            return null;
        }

        const uploadResponse = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });

        // console.log("Upload response:", uploadResponse);

        await fs.unlink(filePath);

        return uploadResponse;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error.message);
        if (error.stack) console.error("Stack trace:", error.stack);

        try {
            await fs.unlink(filePath);
            console.log("Cleaned up local file after error");
        } catch (unlinkError) {
            console.error("Error deleting file:", unlinkError.message);
        }

        return null;
    }
};


 export const extractCloudinaryId = async (url) => {
    try {
        const splitedURL = url.split("/");
        const indexof = splitedURL.indexOf("upload");
        if (indexof === -1) {
            throw Error("Invalid Cloudinary URL");
        }
        const idVidExt = splitedURL.slice(indexof + 2).join("/");

        const cloudinaryId = idVidExt.substring(0, idVidExt.lastIndexOf("."));
        return cloudinaryId;
    } catch (error) {
        console.error("Error extracting public_id:", error);
        return null;
    }
};

