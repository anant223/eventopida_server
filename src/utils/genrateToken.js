import User from "../models/user.model.js";
import ApiError from "./ApiError.js";

const generateRefreshAndAccessToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        // Generate refresh and access tokens
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();


        // Save the refresh token in the user document
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access or refresh token"
        );
    }
};

export default generateRefreshAndAccessToken;