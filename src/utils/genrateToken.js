import dotenv from "dotenv";
dotenv.config();
import User from "../models/user.model.js";
import ApiError from "./ApiError.js";
import jwt from "jsonwebtoken";
import crypto from "crypto"

export const generateToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

export const generateRefreshAndAccessToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        
        // Generate refresh and access tokens
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();


        // Save the refresh token in the user document
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};





